import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Eye,
  Inbox,
} from "lucide-react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { currency, shortDate, expenseDisplayId } from "../utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const categoryColors = ["#F97316", "#FBBF24", "#FFE7C2", "#F59E0B", "#EA580C", "#FDBA74", "#C2410C", "#78350F"];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ---- Skeleton loaders (no blank screens while data loads) ----
const StatSkeleton = () => (
  <div className="card">
    <div className="skeleton h-3 w-20 mb-3" />
    <div className="skeleton h-7 w-28 mb-2" />
    <div className="skeleton h-3 w-32" />
  </div>
);

const ChartSkeleton = ({ className = "" }) => (
  <div className={`card ${className}`}>
    <div className="skeleton h-4 w-40 mb-5" />
    <div className="skeleton h-52 w-full" />
  </div>
);

const TableSkeleton = () => (
  <div className="card">
    <div className="skeleton h-4 w-40 mb-5" />
    {[...Array(4)].map((_, i) => (
      <div key={i} className="skeleton h-10 w-full mb-2" />
    ))}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";
  const canSeeCharts = isAdmin || isManager;

  const loadDashboard = async () => {
    setLoading(true);
    setError(false);
    try {
      const requests = [
        api.get("/analytics/summary"),
        api.get("/expenses", {
          params: { limit: 5, mine: isEmployee ? "true" : undefined },
        }),
      ];
      if (canSeeCharts) {
        requests.push(api.get("/analytics/monthly-trend"));
        requests.push(api.get("/analytics/category-breakdown"));
      }

      const results = await Promise.all(requests);
      setSummary(results[0].data.summary);
      setRecent(results[1].data.expenses);
      if (canSeeCharts) {
        setTrend(results[2].data.trend);
        setBreakdown(results[3].data.breakdown);
      }
    } catch (err) {
      setError(true);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isEmployee]);

  const lineData = {
    labels: trend.map((t) => `${monthNames[t._id.month - 1]} ${t._id.year}`),
    datasets: [
      {
        label: "Approved spend",
        data: trend.map((t) => t.total),
        borderColor: "#F97316",
        backgroundColor: "rgba(249, 115, 22, 0.14)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: "#F97316",
      },
    ],
  };

  const doughnutData = {
    labels: breakdown.map((b) => b._id),
    datasets: [
      {
        data: breakdown.map((b) => b.total),
        backgroundColor: categoryColors,
        borderWidth: 0,
      },
    ],
  };

  const approvedPct =
    summary && summary.total > 0
      ? Math.round((summary.approved / summary.total) * 100)
      : 0;

  const topCategories = [...breakdown].sort((a, b) => b.total - a.total).slice(0, 4);
  const maxCategoryTotal = topCategories[0]?.total || 1;

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="page-subtitle">
            {isEmployee
              ? "Here's your expense overview."
              : "Here's what's happening across the company."}
          </p>
        </div>
        <Link to="/expenses" className="btn-primary self-start sm:self-auto">
          <Plus size={16} /> New Expense
        </Link>
      </div>

      {error ? (
        <div className="card text-center py-16">
          <p className="text-ink-900 font-semibold">Something went wrong.</p>
          <p className="text-sm text-ink-400 mt-1">
            Unable to load dashboard data. Please try again.
          </p>
          <button onClick={loadDashboard} className="btn-secondary mt-4 mx-auto">
            Retry
          </button>
        </div>
      ) : loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </div>
          <TableSkeleton />
        </>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Expenses"
              value={currency(summary?.totalAmount)}
              icon={Wallet}
              accent="brand"
              trend={
                summary?.monthOverMonthPct !== null && summary?.monthOverMonthPct !== undefined
                  ? {
                      direction: summary.monthOverMonthPct >= 0 ? "up" : "down",
                      label: `${summary.monthOverMonthPct >= 0 ? "+" : ""}${summary.monthOverMonthPct.toFixed(1)}% from last month`,
                    }
                  : null
              }
              sub={summary?.monthOverMonthPct === null ? "No data from last month" : undefined}
            />
            <StatCard
              label="Pending"
              value={currency(summary?.pendingAmount)}
              icon={Clock}
              accent="amber"
              sub={`${summary?.pending ?? 0} expense${summary?.pending === 1 ? "" : "s"} awaiting approval`}
            />
            <StatCard
              label="Approved"
              value={currency(summary?.totalApprovedAmount)}
              icon={CheckCircle2}
              accent="emerald"
              sub={`${approvedPct}% of submitted expenses`}
            />
            <StatCard
              label="Rejected"
              value={currency(summary?.rejectedAmount)}
              icon={XCircle}
              accent="red"
              sub={`${summary?.rejected ?? 0} expense${summary?.rejected === 1 ? "" : "s"} rejected`}
            />
          </div>

          {/* Charts — company-wide, so manager/admin only */}
          {canSeeCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="card lg:col-span-2">
                <h2 className="card-title mb-4">Spending Overview</h2>
                {trend.length === 0 ? (
                  <EmptyChart label="No approved expenses yet." />
                ) : (
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: "#332720" }, ticks: { color: "#A99A90" } },
                        x: { grid: { display: false }, ticks: { color: "#A99A90" } },
                      },
                    }}
                  />
                )}
              </div>
              <div className="card">
                <h2 className="card-title mb-4">Category Breakdown</h2>
                {breakdown.length === 0 ? (
                  <EmptyChart label="No data yet." />
                ) : (
                  <Doughnut
                    data={doughnutData}
                    options={{
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { boxWidth: 10, font: { size: 10 }, color: "#C9BAAE" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Top spending categories */}
          {canSeeCharts && topCategories.length > 0 && (
            <div className="card mb-6">
              <h2 className="card-title mb-4">Top Spending Categories</h2>
              <div className="space-y-3">
                {topCategories.map((c, i) => (
                  <div key={c._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-ink-600 font-medium">{c._id}</span>
                      <span className="text-ink-900 font-semibold">{currency(c.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.total / maxCategoryTotal) * 100}%`,
                          backgroundColor: categoryColors[i % categoryColors.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent expenses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">
                {isEmployee ? "Recent Submissions" : "Recent Activity"}
              </h2>
              <Link
                to="/expenses"
                className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="py-14 text-center">
                <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
                  <Inbox size={20} className="text-ink-400" />
                </div>
                <p className="text-sm font-medium text-ink-900">No expenses yet</p>
                <p className="text-xs text-ink-400 mt-1 mb-4">
                  Start tracking your corporate expenses by submitting your first expense.
                </p>
                <Link to="/expenses" className="btn-primary mx-auto w-fit">
                  <Plus size={16} /> New Expense
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="table-head-cell">Expense ID</th>
                      {!isEmployee && <th className="table-head-cell">Employee</th>}
                      <th className="table-head-cell">Category</th>
                      <th className="table-head-cell">Amount</th>
                      <th className="table-head-cell">Date</th>
                      <th className="table-head-cell">Status</th>
                      <th className="table-head-cell text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((e) => (
                      <tr key={e._id} className="table-row">
                        <td className="table-cell font-medium text-ink-900">
                          {expenseDisplayId(e._id)}
                        </td>
                        {!isEmployee && <td className="table-cell">{e.user?.name}</td>}
                        <td className="table-cell">{e.category}</td>
                        <td className="table-cell font-semibold text-ink-900">
                          {currency(e.amount)}
                        </td>
                        <td className="table-cell text-ink-400">{shortDate(e.date)}</td>
                        <td className="table-cell">
                          <Badge status={e.status} />
                        </td>
                        <td className="table-cell text-right">
                          <Link
                            to="/expenses"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            <Eye size={13} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

const EmptyChart = ({ label }) => (
  <div className="h-52 flex items-center justify-center">
    <p className="text-sm text-ink-400">{label}</p>
  </div>
);

export default Dashboard;
