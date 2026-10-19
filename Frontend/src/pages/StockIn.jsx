import React, { useCallback, useEffect, useState } from 'react';
import { useGlobalContext } from '../context/context';
import Modal from '../components/Modal';
import { Loader2, Plus } from 'lucide-react';
import PurchaseItem from '../components/PurchaseItem';
import PurchaseSummary from '../components/PurchaseSummary';
import { toast } from 'react-toastify';
import { localDateBoundary, localDateString } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const filterButtonClass = (active) =>
  `min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
      : 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--surface)]'
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
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [form, setForm] = useState({ productId: '', quantity: 1, costPrice: '', supplier: '', date: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState({ totalValue: 0, transactions: 0 });

  const fetchProductsDropdown = useCallback(async () => {
    try {
      const res = await getProductsDropdown();
      setProductsDropdown(res.data?.products || []);
    } catch (err) {
      console.error(err);
    }
  }, [getProductsDropdown]);

  const fetchPurchases = useCallback(async (p = 1) => {
    if (filterMode === 'custom' && startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      toast.error('Start date must be on or before end date');
      return;
    }
    setIsLoading(true);
    try {
      const params = { page: p, limit };
      const now = new Date();
      if (filterMode === 'today') {
        const day = localDateString(now);
        params.start = localDateBoundary(day);
        params.end = localDateBoundary(day, true);
      } else if (filterMode === 'last7') {
        const end = localDateString(now);
        const start = localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
        params.start = localDateBoundary(start);
        params.end = localDateBoundary(end, true);
      } else if (filterMode === 'month') {
        params.start = localDateBoundary(localDateString(new Date(now.getFullYear(), now.getMonth(), 1)));
        params.end = localDateBoundary(localDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)), true);
      } else if (filterMode === 'custom' && startDateFilter && endDateFilter) {
        params.start = localDateBoundary(startDateFilter);
        params.end = localDateBoundary(endDateFilter, true);
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
  }, [endDateFilter, filterMode, getPurchases, limit, startDateFilter]);

  useEffect(() => {
    fetchProductsDropdown();
  }, [fetchProductsDropdown]);

  useEffect(() => {
    fetchPurchases(page);
  }, [endDateFilter, fetchPurchases, filterMode, page, startDateFilter]);

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

  const exportPurchases = () => downloadCsv('spectra-stock-in-page.csv',
    ['Date', 'Product', 'Quantity', 'Unit cost (NGN)', 'Total cost (NGN)', 'Supplier'],
    purchases.map((purchase) => [purchase.date || purchase.createdAt || '', purchase.product?.name || 'Product', purchase.quantity, Number.isFinite(Number(purchase.costPrice)) ? Number(purchase.costPrice).toFixed(2) : '', Number.isFinite(Number(purchase.totalCost)) ? Number(purchase.totalCost).toFixed(2) : '', purchase.supplier || 'Unknown'])
  );

  return (
    <main className="w-full space-y-5 py-5 text-[var(--text)] sm:py-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Inventory</p>
              <h1 className="app-page-title">Stock in</h1>
              <p className="app-page-copy mt-2">Record restocks and keep purchase costs tied to each product.</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button onClick={exportPurchases} disabled={!purchases.length} className="app-control flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium disabled:opacity-50 sm:flex-none">Export page</button>
              <button onClick={openModal} className="app-control flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white sm:flex-none">
                <Plus className="h-4 w-4" />
                Record Purchase
              </button>
            </div>
        </header>

        <PurchaseSummary totalValue={Number(summary.totalValue || 0)} transactions={summary.transactions} />

        <section className="app-card p-3 sm:p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => { setFilterMode('today'); setPage(1); }} className={filterButtonClass(filterMode === 'today')}>Today</button>
            <button onClick={() => { setFilterMode('last7'); setPage(1); }} className={filterButtonClass(filterMode === 'last7')}>Last 7 days</button>
            <button onClick={() => { setFilterMode('month'); setPage(1); }} className={filterButtonClass(filterMode === 'month')}>This month</button>
            <button onClick={() => { setFilterMode('custom'); setPage(1); }} className={filterButtonClass(filterMode === 'custom')}>Custom</button>
          </div>

          {filterMode === 'custom' ? (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">Start</label>
                <input type="date" className="theme-input app-control mt-2 px-3 py-2" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">End</label>
                <input type="date" className="theme-input app-control mt-2 px-3 py-2" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
              </div>
              <button onClick={() => { fetchPurchases(1); }} className="app-control rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white">Apply</button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-10 text-center text-[var(--muted)]"><Loader2 className="mx-auto animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {purchases.length === 0 ? <div className="py-10 text-center text-sm text-[var(--muted)]">No purchases in this period.</div> : purchases.map((p) => (
                <PurchaseItem key={p._id} purchase={p} />
              ))}

              <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
                <button disabled={page <= 1} onClick={() => { const np = Math.max(1, page - 1); setPage(np); fetchPurchases(np); }} className="app-control border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium disabled:opacity-50">Previous</button>
                <div>Page {page} / {pages}</div>
                <button disabled={page >= pages} onClick={() => { const np = Math.min(pages, page + 1); setPage(np); fetchPurchases(np); }} className="app-control border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </section>

      {showModal ? (
        <Modal onClose={() => setShowModal(false)} widthClass="max-w-md" topOffset="pt-10">
          <div className="glass-modal max-h-[88dvh] w-full overflow-y-auto rounded-xl p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="text-lg font-semibold text-[var(--text)]">Record purchase</h2><p className="mt-1 text-sm text-[var(--muted)]">Add units and their unit cost.</p></div>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">Close</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Product</label>
                  <select required className="theme-input app-control px-3" value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
                    <option value="">Select product</option>
                    {productsDropdown.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.quantity})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Quantity</label>
                    <input required type="number" min={1} step={1} className="theme-input app-control px-3" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Cost Price</label>
                    <input required type="number" min="0.01" step="0.01" className="theme-input app-control px-3" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Supplier (optional)</label>
                  <input type="text" maxLength={120} className="theme-input app-control px-3" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="app-control theme-btn-secondary rounded-lg px-4">Cancel</button>
                  <button type="submit" disabled={isSaving} className="app-control theme-btn-primary rounded-lg px-4 disabled:opacity-50">{isSaving ? 'Saving…' : 'Record purchase'}</button>
                </div>
              </form>
          </div>
        </Modal>
      ) : null}
    </main>
  );
};

export default StockIn;
