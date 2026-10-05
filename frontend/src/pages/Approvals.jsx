import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import api from "../api/axios";
import { currency } from "../utils/format";
import toast from "react-hot-toast";

const Approvals = () => {
  const [tab, setTab] = useState("pending");
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [reviewTarget, setReviewTarget] = useState(null); // { expense, action }
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (tab !== "all") params.status = tab;
      const res = await api.get("/expenses", { params });
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const openReview = (expense, action) => {
    setReviewTarget({ expense, action });
    setComment("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await api.put(`/expenses/${reviewTarget.expense._id}/review`, {
        status: reviewTarget.action,
        managerComment: comment,
      });
      toast.success(
        reviewTarget.action === "approved" ? "Expense approved" : "Expense rejected"
      );
      setReviewTarget(null);
      fetchExpenses(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Approval Workflow</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Review, approve, or reject expense requests from your team
        </p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-400 hover:text-ink-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-ink-300 py-6 text-center">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-ink-300 py-10 text-center">
            No {tab !== "all" ? tab : ""} expense requests found.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-300 border-b border-line">
                  <th className="px-6 py-2 font-medium">Employee</th>
                  <th className="px-6 py-2 font-medium">Category</th>
                  <th className="px-6 py-2 font-medium">Description</th>
                  <th className="px-6 py-2 font-medium">Amount</th>
                  <th className="px-6 py-2 font-medium">Date</th>
                  <th className="px-6 py-2 font-medium">Status</th>
                  <th className="px-6 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e._id} className="border-b border-line hover:bg-surface2/60">
                    <td className="px-6 py-3 text-ink-600">
                      {e.user?.name}
                      <p className="text-xs text-ink-300">{e.user?.department}</p>
                    </td>
                    <td className="px-6 py-3 text-ink-600">{e.category}</td>
                    <td className="px-6 py-3 text-ink-600 max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="px-6 py-3 text-ink-900 font-medium">
                      {currency(e.amount)}
                    </td>
                    <td className="px-6 py-3 text-ink-400">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={e.status} />
                      {e.status !== "pending" && e.managerComment && (
                        <p className="text-[11px] text-ink-300 mt-1 max-w-[140px] truncate" title={e.managerComment}>
                          "{e.managerComment}"
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {e.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openReview(e, "approved")}
                            className="btn-success text-xs px-3 py-1.5"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openReview(e, "rejected")}
                            className="btn-danger text-xs px-3 py-1.5"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-300">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <p className="text-xs text-ink-300">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchExpenses(pagination.page - 1)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchExpenses(pagination.page + 1)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={
          reviewTarget?.action === "approved" ? "Approve Expense" : "Reject Expense"
        }
      >
        {reviewTarget && (
          <div className="space-y-4">
            <div className="bg-surface2 rounded-lg p-3 text-sm">
              <p className="font-medium text-ink-900">
                {reviewTarget.expense.user?.name} — {currency(reviewTarget.expense.amount)}
              </p>
              <p className="text-ink-400">{reviewTarget.expense.category}</p>
              <p className="text-ink-400 mt-1">{reviewTarget.expense.description}</p>
            </div>
            <div>
              <label className="label">Comment (optional)</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Add a note for the employee..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReviewTarget(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className={reviewTarget.action === "approved" ? "btn-success flex-1" : "btn-danger flex-1"}
              >
                {submitting
                  ? "Submitting..."
                  : reviewTarget.action === "approved"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Approvals;
