import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { currency, categories } from "../utils/format";
import api from "../api/axios";
import toast from "react-hot-toast";

const emptyForm = {
  amount: "", category: "Travel", description: "", date: "",
};

const HIGH_EXPENSE_THRESHOLD = 500;

const Expenses = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "", status: "", category: "", from: "", to: "",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await api.get("/expenses", { params });
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setFormOpen(true);
  };

  const openEditForm = (expense) => {
    setEditingId(expense._id);
    setForm({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date.slice(0, 10),
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!form.date) {
      toast.error("Date is required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, form);
        toast.success("Expense updated");
      } else {
        await api.post("/expenses", form);
        toast.success("Expense submitted");
      }
      setFormOpen(false);
      fetchExpenses(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/expenses/${deleteTarget._id}`);
      toast.success("Expense deleted");
      setDeleteTarget(null);
      fetchExpenses(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const exportCSV = () => {
    if (expenses.length === 0) {
      toast.error("Nothing to export on this page");
      return;
    }
    const header = ["Employee", "Category", "Description", "Amount", "Date", "Status"];
    const rows = expenses.map((e) => [
      e.user?.name || user?.name,
      e.category,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      e.amount,
      new Date(e.date).toLocaleDateString(),
      e.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Expenses</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {isEmployee ? "Track and manage your submissions" : "All company expense submissions"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary">
            ⬇ Export CSV
          </button>
          <button onClick={openNewForm} className="btn-primary">
            + New Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            className="input-field"
            placeholder="Search description..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="input-field"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            className="input-field"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <input
            type="date"
            className="input-field"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <p className="text-sm text-ink-300 py-6 text-center">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-ink-300 py-10 text-center">
            No expenses found. Try adjusting your filters or add a new one.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-300 border-b border-line">
                  {!isEmployee && <th className="px-6 py-2 font-medium">Employee</th>}
                  <th className="px-6 py-2 font-medium">Category</th>
                  <th className="px-6 py-2 font-medium">Description</th>
                  <th className="px-6 py-2 font-medium">Amount</th>
                  <th className="px-6 py-2 font-medium">Date</th>
                  <th className="px-6 py-2 font-medium">Status</th>
                  {isEmployee && <th className="px-6 py-2 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e._id} className="border-b border-line hover:bg-surface2/60">
                    {!isEmployee && (
                      <td className="px-6 py-3 text-ink-600">{e.user?.name}</td>
                    )}
                    <td className="px-6 py-3 text-ink-600">{e.category}</td>
                    <td className="px-6 py-3 text-ink-600 max-w-xs truncate">
                      {e.description}
                    </td>
                    <td
                      className={`px-6 py-3 font-medium ${
                        e.amount >= HIGH_EXPENSE_THRESHOLD
                          ? "text-red-600"
                          : "text-ink-900"
                      }`}
                    >
                      {currency(e.amount)}
                      {e.amount >= HIGH_EXPENSE_THRESHOLD && (
                        <span
                          title="High expense"
                          className="ml-1 text-xs align-middle"
                        >
                          🔥
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-ink-400">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={e.status} />
                    </td>
                    {isEmployee && (
                      <td className="px-6 py-3">
                        {e.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditForm(e)}
                              className="text-brand-600 hover:underline text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(e)}
                              className="text-red-500 hover:underline text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Edit Expense" : "New Expense"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="What was this expense for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : editingId ? "Save Changes" : "Submit Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Expense"
      >
        <p className="text-sm text-ink-600 mb-6">
          Are you sure you want to delete this expense
          {deleteTarget ? ` (${currency(deleteTarget.amount)} — ${deleteTarget.category})` : ""}?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button onClick={handleDelete} className="btn-danger flex-1">
            Delete
          </button>
        </div>
      </Modal>
    </Layout>
  );
};

export default Expenses;
