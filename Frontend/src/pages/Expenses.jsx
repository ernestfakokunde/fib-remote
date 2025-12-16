import React, { useEffect, useState } from "react";
import { useGlobalContext } from "../context/context";
import Modal from "../components/Modal";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { formatCurrency, formatNumber } from "../utils/format";

const SummaryCard = ({ title, value, sub }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm">
    <div className="text-sm text-gray-600">{title}</div>
    <div className="text-xl font-semibold mt-2">{value}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);

const Expenses = () => {
  const {
    getCategories,
    createCategory,
    createExpense,
    getExpenses,
    deleteExpense,
    getExpensesSummary,
  } = useGlobalContext();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#8b5cf6");
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalTransactions: 0,
    categories: 0,
    averageExpense: 0,
  });
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "",
    date: "",
  });

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpenses({ page: 1, limit: 50 });
      setExpenses(res.data?.expenses || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await getExpensesSummary();
      setSummary(res.data || {});
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
    fetchSummary();
  }, []);

  const handleCreateCategory = async (e) => {
    e && e.preventDefault();
    if (!newCategoryName.trim()) return toast.error("Category name required");
    try {
      await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      toast.success("Category created");
      setNewCategoryName("");
      setCatModal(false);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category)
      return toast.error("Amount and category are required");
    try {
      await createExpense({
        amount: form.amount,
        category: form.category,
        description: form.description,
        date: form.date || undefined,
      });
      toast.success("Expense added");
      setForm({ amount: "", description: "", category: "", date: "" });
      setShowModal(false);
      await fetchExpenses();
      await fetchSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create expense");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
      await fetchExpenses();
      await fetchSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete expense");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCatModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
        />
        <SummaryCard
          title="Total Transactions"
          value={formatNumber(summary.totalTransactions)}
        />
        <SummaryCard
          title="Categories"
          value={formatNumber(summary.categories)}
        />
        <SummaryCard
          title="Average Expense"
          value={formatCurrency(summary.averageExpense)}
        />
      </div>

      {/* Table for md and larger screens */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm text-gray-500">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-left text-sm text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center">
                  <Loader2 className="animate-spin inline" />
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: exp.category?.color || "#e5e7eb",
                        color: "#fff",
                      }}
                    >
                      <span>{exp.category?.name}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatCurrency(exp.amount)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {exp.description}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="text-red-500"
                    >
                      <Trash2 className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive cards for small screens */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            <Loader2 className="animate-spin inline" />
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: exp.category?.color || "#e5e7eb",
                    color: "#fff",
                  }}
                >
                  {exp.category?.name}
                </span>
                <span className="font-semibold">
                  {formatCurrency(exp.amount)}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{exp.description}</p>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <span>{new Date(exp.date).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDelete(exp._id)}
                  className="text-red-500"
                >
                  <Trash2 className="inline w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          widthClass="max-w-md"
          topOffset="pt-12"
        >
          <div className="bg-white rounded-xl shadow-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Expense</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-full"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {catModal && (
        <Modal
          onClose={() => setCatModal(false)}
          widthClass="max-w-md"
          topOffset="pt-12"
        >
          <div className="bg-white rounded-xl shadow-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Category</h2>
                <button
                  onClick={() => setCatModal(false)}
                  className="text-gray-500"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-12 h-10 p-0 border rounded"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="px-3 py-2 border rounded w-full"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCatModal(false)}
                    className="px-4 py-2 border rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-full"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Expenses;
