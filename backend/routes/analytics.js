const express = require("express");
const asyncHandler = require("express-async-handler");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// @route   GET /api/analytics/summary
// @desc    High-level numbers used by all dashboards, scoped by role
// @access  Private
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const scope =
      req.user.role === "employee" ? { user: req.user._id } : {};

    // Current vs previous calendar month, used for the "+X% from last
    // month" trend shown on the dashboard summary cards.
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const sumByStatus = async (status) => {
      const agg = await Expense.aggregate([
        { $match: { ...scope, status } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      return agg[0]?.total || 0;
    };

    const [
      total,
      pending,
      approved,
      rejected,
      totalAmountAgg,
      pendingAmount,
      rejectedAmount,
      allAmountAgg,
      thisMonthAgg,
      lastMonthAgg,
    ] = await Promise.all([
      Expense.countDocuments(scope),
      Expense.countDocuments({ ...scope, status: "pending" }),
      Expense.countDocuments({ ...scope, status: "approved" }),
      Expense.countDocuments({ ...scope, status: "rejected" }),
      Expense.aggregate([
        { $match: { ...scope, status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      sumByStatus("pending"),
      sumByStatus("rejected"),
      Expense.aggregate([
        { $match: scope },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { ...scope, date: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            ...scope,
            date: { $gte: startOfLastMonth, $lt: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const thisMonthTotal = thisMonthAgg[0]?.total || 0;
    const lastMonthTotal = lastMonthAgg[0]?.total || 0;
    let monthOverMonthPct = null;
    if (lastMonthTotal > 0) {
      monthOverMonthPct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (thisMonthTotal > 0) {
      monthOverMonthPct = 100;
    }

    res.json({
      success: true,
      summary: {
        total,
        totalAmount: allAmountAgg[0]?.total || 0,
        pendingAmount,
        rejectedAmount,
        monthOverMonthPct,
        pending,
        approved,
        rejected,
        totalApprovedAmount: totalAmountAgg[0]?.total || 0,
      },
    });
  })
);

// @route   GET /api/analytics/monthly-trend
// @desc    Approved spending grouped by month (last 12 months), admin/manager only
// @access  Private (manager, admin)
router.get(
  "/monthly-trend",
  authorize("manager", "admin"),
  asyncHandler(async (req, res) => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const trend = await Expense.aggregate([
      {
        $match: {
          status: "approved",
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({ success: true, trend });
  })
);

// @route   GET /api/analytics/category-breakdown
// @desc    Approved spending grouped by category
// @access  Private (manager, admin)
router.get(
  "/category-breakdown",
  authorize("manager", "admin"),
  asyncHandler(async (req, res) => {
    const breakdown = await Expense.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, breakdown });
  })
);

// @route   GET /api/analytics/top-spenders
// @desc    Top users by approved spending
// @access  Private (manager, admin)
router.get(
  "/top-spenders",
  authorize("manager", "admin"),
  asyncHandler(async (req, res) => {
    const topSpenders = await Expense.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$user",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          department: "$user.department",
          total: 1,
          count: 1,
        },
      },
    ]);

    res.json({ success: true, topSpenders });
  })
);

module.exports = router;
