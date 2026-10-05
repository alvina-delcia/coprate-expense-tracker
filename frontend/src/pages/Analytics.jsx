import React, { useEffect, useState } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import api from "../api/axios";
import toast from "react-hot-toast";
import { currency } from "../utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const palette = [
  "#F97316", "#FBBF24", "#FFE7C2", "#F59E0B",
  "#EA580C", "#FDBA74", "#C2410C", "#78350F",
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [topSpenders, setTopSpenders] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, t, b, top] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/analytics/monthly-trend"),
          api.get("/analytics/category-breakdown"),
          api.get("/analytics/top-spenders"),
        ]);
        setSummary(s.data.summary);
        setTrend(t.data.trend);
        setBreakdown(b.data.breakdown);
        setTopSpenders(top.data.topSpenders);
      } catch (err) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lineData = {
    labels: trend.map((t) => `${monthNames[t._id.month - 1]} ${t._id.year}`),
    datasets: [
      {
        label: "Approved spend",
        data: trend.map((t) => t.total),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const doughnutData = {
    labels: breakdown.map((b) => b._id),
    datasets: [
      {
        data: breakdown.map((b) => b.total),
        backgroundColor: palette,
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: topSpenders.map((t) => t.name),
    datasets: [
      {
        label: "Total approved spend",
        data: topSpenders.map((t) => t.total),
        backgroundColor: "#2563eb",
        borderRadius: 6,
      },
    ],
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Analytics</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Company-wide spending insights and trends
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-300">Loading analytics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Requests" value={summary?.total ?? 0} icon="🧾" />
            <StatCard
              label="Total Approved Spend"
              value={currency(summary?.totalApprovedAmount)}
              icon="💰"
              accent="emerald"
            />
            <StatCard label="Pending Review" value={summary?.pending ?? 0} icon="⏳" accent="amber" />
            <StatCard label="Rejected" value={summary?.rejected ?? 0} icon="✖️" accent="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="card lg:col-span-2">
              <h2 className="text-sm font-semibold text-ink-900 mb-4">
                Monthly Expense Trend (last 12 months)
              </h2>
              {trend.length === 0 ? (
                <p className="text-sm text-ink-300">No approved expenses yet.</p>
              ) : (
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              )}
            </div>
            <div className="card">
              <h2 className="text-sm font-semibold text-ink-900 mb-4">
                Category-wise Distribution
              </h2>
              {breakdown.length === 0 ? (
                <p className="text-sm text-ink-300">No data yet.</p>
              ) : (
                <Doughnut
                  data={doughnutData}
                  options={{
                    plugins: {
                      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
                    },
                  }}
                />
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">
              Top Spending Employees
            </h2>
            {topSpenders.length === 0 ? (
              <p className="text-sm text-ink-300">No approved expenses yet.</p>
            ) : (
              <Bar
                data={barData}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true } },
                }}
              />
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Analytics;
