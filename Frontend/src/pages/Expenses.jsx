import { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context';
import Modal from '../components/Modal';
import { formatCurrency, formatNumber } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const blankExpense = { amount: '', description: '', category: '', date: '' };

const SummaryCard = ({ title, value }) => (
  <section className="app-card min-w-0 p-4 sm:p-5">
    <p className="text-xs font-medium text-[var(--muted)]">{title}</p>
    <p className="money-value mt-2 truncate text-xl font-semibold text-[var(--text)] sm:text-2xl">{value}</p>
  </section>
);

export default function Expenses() {
  const { getCategories, createCategory, createExpense, getExpenses, deleteExpense, getExpensesSummary } = useGlobalContext();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpenses: 0, totalTransactions: 0, categories: 0, averageExpense: 0 });
  const [form, setForm] = useState(blankExpense);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [loading, setLoading] = useState(true);
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseRes, summaryRes] = await Promise.all([
        getExpenses({ page: 1, limit: 50 }),
        getExpensesSummary(),
      ]);
      setExpenses(Array.isArray(expenseRes.data?.expenses) ? expenseRes.data.expenses : []);
      setSummary(summaryRes.data || {});
    } catch (error) {
      console.error('Failed to load expenses', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [getExpenses, getExpensesSummary]);

  const refreshCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      setCategories(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Failed to load expense categories', error);
      toast.error('Failed to load categories');
    }
  }, [getCategories]);

  useEffect(() => {
    // Load the category list and expense totals once when the page opens.
    refreshCategories();
    refresh();
  }, [refresh, refreshCategories]);

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.category) return toast.error('Choose an expense category');
    if (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100)) || amount < 0.01) return toast.error('Enter a valid amount of at least 0.01');
    if (form.date && !Number.isFinite(new Date(form.date).getTime())) return toast.error('Choose a valid expense date');

    setSavingExpense(true);
    try {
      await createExpense({ ...form, amount: Math.round((amount + Number.EPSILON) * 100) / 100, date: form.date || undefined });
      toast.success('Expense recorded');
      setForm(blankExpense);
      setShowExpenseModal(false);
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return toast.error('Enter a category name');
    setSavingCategory(true);
    try {
      await createCategory({ name, color: newCategoryColor });
      toast.success('Category created');
      setNewCategoryName('');
      setShowCategoryModal(false);
      await refreshCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete this ${formatCurrency(expense.amount)} expense?`)) return;
    try {
      await deleteExpense(expense._id);
      toast.success('Expense deleted');
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const exportExpenses = () => downloadCsv('spectra-expenses-page.csv',
    ['Date', 'Category', 'Amount (NGN)', 'Description'],
    expenses.map((expense) => [expense.date || expense.createdAt || '', expense.category?.name || 'Uncategorized', Number.isFinite(Number(expense.amount)) ? Number(expense.amount).toFixed(2) : '', expense.description || ''])
  );

  const ExpenseActions = ({ expense }) => (
    <button type="button" onClick={() => handleDelete(expense)} aria-label={`Delete expense ${expense.description || expense.category?.name || ''}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-[var(--danger)] focus-visible:outline-offset-2">
      <Trash2 size={16} />
    </button>
  );

  return (
    <main className="w-full space-y-5 py-5 sm:py-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Finance</p>
          <h1 className="app-page-title text-[var(--text)]">Expenses</h1>
          <p className="app-page-copy mt-2">Keep operating costs organized and visible alongside sales.</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
          <button type="button" onClick={exportExpenses} disabled={!expenses.length} className="app-control rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs font-semibold text-[var(--text)] disabled:opacity-50 sm:px-3 sm:text-sm"><Download className="mr-1 inline" size={15} />Export</button>
          <button type="button" onClick={() => setShowCategoryModal(true)} className="app-control rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs font-semibold text-[var(--text)] sm:px-3 sm:text-sm"><Plus className="mr-1 inline" size={15} />Category</button>
          <button type="button" onClick={() => setShowExpenseModal(true)} className="app-control rounded-lg bg-[var(--primary)] px-2 text-xs font-semibold text-white sm:px-3 sm:text-sm"><Plus className="mr-1 inline" size={15} />Expense</button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Expense summary">
        <SummaryCard title="Total expenses" value={formatCurrency(summary.totalExpenses)} />
        <SummaryCard title="Transactions" value={formatNumber(summary.totalTransactions)} />
        <SummaryCard title="Categories used" value={formatNumber(summary.categories)} />
        <SummaryCard title="Average expense" value={formatCurrency(summary.averageExpense)} />
      </section>

      <section className="app-card overflow-hidden" aria-label="Recent expenses">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div><h2 className="text-sm font-semibold text-[var(--text)]">Recent expenses</h2><p className="mt-0.5 text-xs text-[var(--muted)]">Latest 50 records</p></div>
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs text-[var(--muted)]"><tr><th className="px-5 py-3 font-medium">Category</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Description</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? <tr><td colSpan={5} className="px-5 py-10 text-center text-[var(--muted)]">Loading expenses…</td></tr> : expenses.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--muted)]">No expenses recorded yet.</td></tr> : expenses.map((expense) => (
                <tr key={expense._id} className="transition hover:bg-[var(--surface)]"><td className="px-5 py-3"><span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--text)]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: expense.category?.color || 'var(--primary)' }} />{expense.category?.name || 'Uncategorized'}</span></td><td className="money-value px-5 py-3 font-semibold">{formatCurrency(expense.amount)}</td><td className="max-w-xs truncate px-5 py-3 text-[var(--muted)]">{expense.description || '—'}</td><td className="px-5 py-3 text-xs text-[var(--muted)]">{new Date(expense.date || expense.createdAt).toLocaleDateString()}</td><td className="px-5 py-2"><ExpenseActions expense={expense} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 p-3 lg:hidden">
          {loading ? <div className="py-10 text-center text-sm text-[var(--muted)]">Loading expenses…</div> : expenses.length === 0 ? <div className="py-10 text-center text-sm text-[var(--muted)]">No expenses recorded yet.</div> : expenses.map((expense) => (
            <article key={expense._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><span className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--text)]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: expense.category?.color || 'var(--primary)' }} /><span className="truncate">{expense.category?.name || 'Uncategorized'}</span></span><p className="mt-2 truncate text-xs text-[var(--muted)]">{expense.description || 'No description'}</p></div><ExpenseActions expense={expense} /></div>
              <div className="mt-3 flex items-center justify-between"><span className="text-xs text-[var(--muted)]">{new Date(expense.date || expense.createdAt).toLocaleDateString()}</span><span className="money-value text-sm font-semibold">{formatCurrency(expense.amount)}</span></div>
            </article>
          ))}
        </div>
      </section>

      {showExpenseModal && <Modal onClose={() => !savingExpense && setShowExpenseModal(false)} widthClass="max-w-lg" topOffset="pt-6">
        <div className="glass-modal max-h-[88dvh] overflow-y-auto rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Record an expense</h2><p className="mb-5 mt-1 text-sm text-[var(--muted)]">Add a cost to your financial summary.</p>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <label className="block text-sm font-medium text-[var(--muted)]">Category<select required className="theme-input app-control mt-1.5 px-3 text-[var(--text)]" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}><option value="">Choose a category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
            <label className="block text-sm font-medium text-[var(--muted)]">Amount<input required min="0.01" step="0.01" inputMode="decimal" type="number" className="theme-input app-control mt-1.5 px-3 text-[var(--text)]" placeholder="0.00" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></label>
            <label className="block text-sm font-medium text-[var(--muted)]">Description <span className="font-normal">(optional)</span><input maxLength={240} type="text" className="theme-input app-control mt-1.5 px-3 text-[var(--text)]" placeholder="What was this expense for?" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="block text-sm font-medium text-[var(--muted)]">Date<input type="date" className="theme-input app-control mt-1.5 px-3 text-[var(--text)]" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowExpenseModal(false)} disabled={savingExpense} className="app-control rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)]">Cancel</button><button type="submit" disabled={savingExpense || !categories.length} className="app-control rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{savingExpense ? 'Saving…' : 'Save expense'}</button></div>
            {!categories.length && <p className="text-xs text-[var(--warning)]">Create a category before recording an expense.</p>}
          </form>
        </div>
      </Modal>}

      {showCategoryModal && <Modal onClose={() => !savingCategory && setShowCategoryModal(false)} widthClass="max-w-lg" topOffset="pt-6">
        <div className="glass-modal rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">New expense category</h2><p className="mb-5 mt-1 text-sm text-[var(--muted)]">Use a clear label to keep spending easy to review.</p>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <label className="block text-sm font-medium text-[var(--muted)]">Name<input required maxLength={80} className="theme-input app-control mt-1.5 px-3 text-[var(--text)]" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} /></label>
            <label className="block text-sm font-medium text-[var(--muted)]">Color<div className="mt-1.5 flex gap-2"><input aria-label="Category color" type="color" className="theme-input h-10 w-14 rounded-lg p-1" value={newCategoryColor} onChange={(event) => setNewCategoryColor(event.target.value)} /><input aria-label="Category hex color" className="theme-input app-control px-3 font-mono text-[var(--text)]" value={newCategoryColor} onChange={(event) => setNewCategoryColor(event.target.value)} pattern="^#[0-9a-fA-F]{6}$" /></div></label>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCategoryModal(false)} className="app-control rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)]">Cancel</button><button type="submit" disabled={savingCategory} className="app-control rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{savingCategory ? 'Saving…' : 'Create category'}</button></div>
          </form>
        </div>
      </Modal>}
    </main>
  );
}
