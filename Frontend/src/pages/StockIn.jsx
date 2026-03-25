import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../context/context';
import Modal from '../components/Modal';
import { Loader2, Plus } from 'lucide-react';
import PurchaseItem from '../components/PurchaseItem';
import PurchaseSummary from '../components/PurchaseSummary';
import { toast } from 'react-toastify';

const filterButtonClass = (active) =>
  `rounded-full px-3 py-2 text-sm transition ${
    active
      ? 'bg-[var(--primary)] text-white shadow-lg shadow-sky-500/20'
      : 'border border-white/10 bg-white/10 text-[var(--text)] hover:bg-white/15'
  }`;

const StockIn = () => {
  const { getProductsDropdown, createPurchase, getPurchases } = useGlobalContext();
  const [productsDropdown, setProductsDropdown] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [filterMode, setFilterMode] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [form, setForm] = useState({ productId: '', quantity: 1, costPrice: '', supplier: '', date: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState({ totalValue: 0, transactions: 0 });

  const fetchProductsDropdown = async () => {
    try {
      const res = await getProductsDropdown();
      setProductsDropdown(res.data?.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPurchases = async (p = 1) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit };
      const now = new Date();
      if (filterMode === 'today') {
        params.filter = 'today';
      } else if (filterMode === 'last7') {
        params.filter = 'last7days';
      } else if (filterMode === 'month') {
        params.start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        params.end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      } else if (filterMode === 'custom' && startDateFilter && endDateFilter) {
        params.start = startDateFilter.toISOString().slice(0, 10);
        params.end = endDateFilter.toISOString().slice(0, 10);
      }

      const res = await getPurchases(params);
      const data = res.data || {};
      setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
      setPages(data.totalPages || 1);
      setPage(data.currentPage || p);
      const total = data.totalPurchases || data.total || data.totalCount || (Array.isArray(data.purchases) ? data.purchases.length : 0);
      setSummary({
        totalValue: Number(data.totalValue || 0),
        transactions: total,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsDropdown();
    fetchPurchases();
  }, []);

  useEffect(() => {
    fetchPurchases(page);
  }, [filterMode, startDateFilter, endDateFilter, page]);

  const openModal = () => {
    setForm({ productId: '', quantity: 1, costPrice: '', supplier: '', date: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.costPrice) {
      toast.error('Please fill required fields');
      return;
    }
    setIsSaving(true);
    try {
      await createPurchase({
        productId: form.productId,
        quantity: form.quantity,
        costPrice: form.costPrice,
        supplier: form.supplier,
        date: form.date || undefined,
      });
      toast.success('Purchase recorded');
      setShowModal(false);
      await fetchPurchases();
      await fetchProductsDropdown();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to record purchase';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden text-[var(--text)]">
      <div className="space-y-6 p-6">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_40%)]" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Stock In</p>
              <h1 className="mt-3 text-3xl font-semibold">Record purchases and incoming inventory</h1>
              <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">Keep supplier restocks and purchase entries in one polished flow.</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-[var(--text)] transition hover:bg-white/15">Export</button>
              <button onClick={openModal} className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm text-white shadow-lg shadow-sky-500/20">
                <Plus className="h-4 w-4" />
                Record Purchase
              </button>
            </div>
          </div>
        </section>

        <PurchaseSummary totalValue={Number(summary.totalValue || 0)} transactions={summary.transactions} />

        <section className="glass-panel rounded-[1.75rem] border border-white/10 p-4 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => { setFilterMode('today'); setPage(1); }} className={filterButtonClass(filterMode === 'today')}>Today</button>
            <button onClick={() => { setFilterMode('last7'); setPage(1); }} className={filterButtonClass(filterMode === 'last7')}>Last 7 days</button>
            <button onClick={() => { setFilterMode('month'); setPage(1); }} className={filterButtonClass(filterMode === 'month')}>This month</button>
            <button onClick={() => { setFilterMode('custom'); setPage(1); }} className={filterButtonClass(filterMode === 'custom')}>Custom</button>
          </div>

          {filterMode === 'custom' ? (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm text-[var(--muted)]">Start</label>
                <input type="date" className="theme-input mt-2 rounded-xl px-3 py-2" value={startDateFilter ? startDateFilter.toISOString().slice(0, 10) : ''} onChange={(e) => setStartDateFilter(e.target.value ? new Date(e.target.value) : null)} />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)]">End</label>
                <input type="date" className="theme-input mt-2 rounded-xl px-3 py-2" value={endDateFilter ? endDateFilter.toISOString().slice(0, 10) : ''} onChange={(e) => setEndDateFilter(e.target.value ? new Date(e.target.value) : null)} />
              </div>
              <button onClick={() => { fetchPurchases(1); }} className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-white">Apply</button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-10 text-center text-[var(--muted)]"><Loader2 className="mx-auto animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <PurchaseItem key={p._id} purchase={p} />
              ))}

              <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
                <button disabled={page <= 1} onClick={() => { const np = Math.max(1, page - 1); setPage(np); fetchPurchases(np); }} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 disabled:opacity-50">Prev</button>
                <div>Page {page} / {pages}</div>
                <button disabled={page >= pages} onClick={() => { const np = Math.min(pages, page + 1); setPage(np); fetchPurchases(np); }} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {showModal ? (
        <Modal onClose={() => setShowModal(false)} widthClass="max-w-md" topOffset="pt-10">
          <div className="glass-modal w-full max-h-[85vh] overflow-y-auto rounded-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text)]">Record Purchase</h2>
                <button onClick={() => setShowModal(false)} className="text-[var(--muted)]">Close</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Product</label>
                  <select className="theme-input rounded px-3 py-2" value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
                    <option value="">Select product</option>
                    {productsDropdown.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.quantity})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Quantity</label>
                    <input type="number" min={1} className="theme-input rounded px-3 py-2" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Cost Price</label>
                    <input type="number" step="0.01" className="theme-input rounded px-3 py-2" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Supplier (optional)</label>
                  <input type="text" className="theme-input rounded px-3 py-2" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="theme-btn-secondary rounded px-4 py-2">Cancel</button>
                  <button type="submit" disabled={isSaving} className="theme-btn-primary rounded px-4 py-2">{isSaving ? 'Saving...' : 'Record'}</button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default StockIn;
