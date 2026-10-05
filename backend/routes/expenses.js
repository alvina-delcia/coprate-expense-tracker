const express = require("express");
const asyncHandler = require("express-async-handler");
const Expense = require("../models/Expense");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All expense routes require a logged-in user
router.use(protect);

// @route   POST /api/expenses
// @desc    Submit a new expense (any authenticated user)
// @access  Private
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !description || !date) {
      res.status(400);
      throw new Error("Please fill in all expense fields");
    }

    const expense = await Expense.create({
      user: req.user._id,
      amount,
      category,
      description,
      date,
    });

    res.status(201).json({ success: true, expense });
  })
);

// @route   GET /api/expenses
// @desc    List expenses.
//          Employees only see their own. Managers/Admins can see all,
//          with optional filters: status, category, search, from, to, page, limit
// @access  Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      status,
      category,
      search,
      from,
      to,
      page = 1,
      limit = 10,
      mine,
    } = req.query;

    const query = {};

    // Employees can only ever see their own expenses.
    // Managers/Admins see everyone's unless they explicitly ask for "mine".
    if (req.user.role === "employee" || mine === "true") {
      query.user = req.user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    if (search) {
      query.description = { $regex: search, $options: "i" };
    }

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate("user", "name email department")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      expenses,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  })
);

// @route   GET /api/expenses/:id
// @desc    Get a single expense
// @access  Private
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id)
      .populate("user", "name email department")
      .populate("reviewedBy", "name");

    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    // Employees may only view their own expenses
    if (
      req.user.role === "employee" &&
      expense.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("Not authorized to view this expense");
    }

    res.json({ success: true, expense });
  })
);

// @route   PUT /api/expenses/:id
// @desc    Update an expense (owner only, and only while pending)
// @access  Private
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own expenses");
    }

    if (expense.status !== "pending") {
      res.status(400);
      throw new Error("Only pending expenses can be edited");
    }

    const { amount, category, description, date } = req.body;
    if (amount !== undefined) expense.amount = amount;
    if (category) expense.category = category;
    if (description) expense.description = description;
    if (date) expense.date = date;

    await expense.save();

    res.json({ success: true, expense });
  })
);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense (owner only, and only while pending)
// @access  Private
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own expenses");
    }

    if (expense.status !== "pending") {
      res.status(400);
      throw new Error("Only pending expenses can be deleted");
    }

    await expense.deleteOne();

    res.json({ success: true, message: "Expense deleted" });
  })
);

// @route   PUT /api/expenses/:id/review
// @desc    Approve or reject an expense with an optional comment
// @access  Private (manager, admin)
router.put(
  "/:id/review",
  authorize("manager", "admin"),
  asyncHandler(async (req, res) => {
    const { status, managerComment } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Status must be 'approved' or 'rejected'");
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    if (expense.status !== "pending") {
      res.status(400);
      throw new Error("This expense has already been reviewed");
    }

    expense.status = status;
    expense.managerComment = managerComment || "";
    expense.reviewedBy = req.user._id;
    expense.reviewedAt = new Date();

    await expense.save();

    res.json({ success: true, expense });
  })
);

module.exports = router;
