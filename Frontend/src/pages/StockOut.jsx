import React, { useCallback, useEffect, useState } from 'react';
import SaleCard from '../components/SaleCard';
import { useGlobalContext } from '../context/context';
import Modal from '../components/Modal';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber, localDateBoundary, localDateString } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const filterButtonClass = (active) =>
  `min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
      : 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--surface)]'
  }`;

const StockOut = () => {
  const { getSales, createSale, getProducts } = useGlobalContext();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [form, setForm] = useState({ productId: '', quantity: 1, sellingPrice: '', date: '', customer: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [totals, setTotals] = useState({ totalRevenue: 0, totalProfit: 0, totalSales: 0 });

  const fetchSales = useCallback(async (p = 1) => {
    if (filterMode === 'custom' && startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      toast.error('Start date must be on or before end date');
      return;
    }
    setIsLoading(true);
    try {
      const params = { page: p, limit };
      const now = new Date();
      if (filterMode === 'today') {
        const d = localDateString(now);
        params.startDate = localDateBoundary(d);
        params.endDate = localDateBoundary(d, true);
      } else if (filterMode === 'last7') {
        const end = localDateString(now);
        const start = localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
        params.startDate = localDateBoundary(start);
        params.endDate = localDateBoundary(end, true);
      } else if (filterMode === 'month') {
        const start = localDateString(new Date(now.getFullYear(), now.getMonth(), 1));
        const end = localDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        params.startDate = localDateBoundary(start);
        params.endDate = localDateBoundary(end, true);
      } else if (filterMode === 'custom' && startDateFilter && endDateFilter) {
        params.startDate = localDateBoundary(startDateFilter);
        params.endDate = localDateBoundary(endDateFilter, true);
      }

      const res = await getSales(params);
      const data = res.data || {};
      setSales(Array.isArray(data.sales) ? data.sales : []);
      setPages(data.pages || 1);
      setPage(data.currentPage || p);
      setTotals({
        totalRevenue: Number.isFinite(Number(data.totalRevenue)) ? Number(data.totalRevenue) : 0,
        totalProfit: Number.isFinite(Number(data.totalProfit)) ? Number(data.totalProfit) : 0,
        totalSales: Number.isFinite(Number(data.total ?? data.totalSales)) ? Number(data.total ?? data.totalSales) : 0,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sales');
    } finally {
      setIsLoading(false);
    }
  }, [endDateFilter, filterMode, getSales, limit, startDateFilter]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await getProducts({ limit: 100 });
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (err) {
      console.error(err);
    }
  }, [getProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchSales(page);
  }, [endDateFilter, fetchSales, filterMode, page, startDateFilter]);

  const openModal = () => {
    setForm({ productId: '', quantity: 1, sellingPrice: '', date: '', customer: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.sellingPrice) {
      toast.error('Please fill required fields');
      return;
    }
    setIsSaving(true);
    try {
      await createSale({
        productId: form.productId,
        quantity: form.quantity,
        sellingPrice: form.sellingPrice,
        date: form.date || undefined,
        customer: form.customer || undefined,
      });
      toast.success('Sale recorded');
      setShowModal(false);
      await fetchSales();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to record sale';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const exportSales = () => downloadCsv('spectra-stock-out-page.csv',
    ['Date', 'Product', 'Quantity', 'Selling price (NGN)', 'Revenue (NGN)', 'Profit (NGN)', 'Customer'],
    sales.map((sale) => [sale.date || sale.createdAt || '', sale.product?.name || 'Product', sale.quantity, Number.isFinite(Number(sale.sellingPrice)) ? Number(sale.sellingPrice).toFixed(2) : '', Number.isFinite(Number(sale.totalRevenue)) ? Number(sale.totalRevenue).toFixed(2) : '', Number.isFinite(Number(sale.profit)) ? Number(sale.profit).toFixed(2) : '', sale.customer || 'Walk-in Customer'])
  );

  return (
    <main className="w-full space-y-5 py-5 text-[var(--text)] sm:py-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Finance</p>
              <h1 className="app-page-title">Stock out</h1>
              <p className="app-page-copy mt-2">Record sales and keep the stock balance current.</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button onClick={exportSales} disabled={!sales.length} className="app-control flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium disabled:opacity-50 sm:flex-none">Export page</button>
              <button onClick={openModal} className="app-control flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white sm:flex-none">
                <Plus className="h-4 w-4" />
                Record Sale
              </button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SaleCard title="Total Revenue" value={formatCurrency(totals.totalRevenue)} />
          <SaleCard title="Total Profit" value={formatCurrency(totals.totalProfit)} />
          <SaleCard title="Total Sales" value={formatNumber(totals.totalSales)} />
        </div>

        <section className="app-card p-3 sm:p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">Recent sales</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setFilterMode('today'); setPage(1); }} className={filterButtonClass(filterMode === 'today')}>Today</button>
              <button onClick={() => { setFilterMode('last7'); setPage(1); }} className={filterButtonClass(filterMode === 'last7')}>Last 7 days</button>
              <button onClick={() => { setFilterMode('month'); setPage(1); }} className={filterButtonClass(filterMode === 'month')}>This month</button>
              <button onClick={() => { setFilterMode('custom'); setPage(1); }} className={filterButtonClass(filterMode === 'custom')}>Custom</button>
            </div>
          </div>

          {filterMode === 'custom' ? (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm text-[var(--muted)]">Start</label>
                <input type="date" className="theme-input app-control mt-2 px-3 py-2" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)]">End</label>
                <input type="date" className="theme-input app-control mt-2 px-3 py-2" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
              </div>
              <button onClick={() => { fetchSales(1); }} className="app-control rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white">Apply</button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-10 text-center text-[var(--muted)]"><Loader2 className="mx-auto animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {sales.length === 0 ? <div className="py-10 text-center text-sm text-[var(--muted)]">No sales in this period.</div> : sales.map((s) => (
                <div key={s._id} className="app-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--text)]">{s.product?.name || 'Product'}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{formatNumber(s.quantity)} units · {formatCurrency(s.sellingPrice)} each</div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <span className="text-sm font-semibold tabular-nums text-[var(--text)]">{formatCurrency(s.totalRevenue)}</span>
                    <span className="text-xs text-[var(--muted)]">{new Date(s.date || s.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}

              <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
                <button disabled={page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchSales(p); }} className="app-control border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium disabled:opacity-50">Previous</button>
                <div>Page {page} / {pages}</div>
                <button disabled={page >= pages} onClick={() => { const p = Math.min(pages, page + 1); setPage(p); fetchSales(p); }} className="app-control border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </section>

      {showModal ? (
        <Modal onClose={() => setShowModal(false)} widthClass="max-w-md" topOffset="pt-10">
          <div className="glass-modal max-h-[88dvh] w-full overflow-y-auto rounded-xl p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="text-lg font-semibold text-[var(--text)]">Record sale</h2><p className="mt-1 text-sm text-[var(--muted)]">Quantity reduces available stock immediately.</p></div>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">Close</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Product</label>
                  <select required className="theme-input app-control px-3" value={form.productId} onChange={(e) => {
                    const pid = e.target.value;
                    setForm((f) => ({ ...f, productId: pid }));
                    const product = products.find((x) => x._id === pid);
                    if (product) setForm((f) => ({ ...f, sellingPrice: product.sellingPrice }));
                  }}>
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} - {p.quantity} available</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Quantity</label>
                    <input required type="number" min={1} step={1} className="theme-input app-control px-3" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Selling Price</label>
                    <input required type="number" min="0.01" step="0.01" className="theme-input app-control px-3" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Customer (optional)</label>
                  <input type="text" maxLength={120} className="theme-input app-control px-3" value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="app-control theme-btn-secondary rounded-lg px-4">Cancel</button>
                  <button type="submit" disabled={isSaving} className="app-control theme-btn-primary rounded-lg px-4 disabled:opacity-50">{isSaving ? 'Saving...' : 'Record sale'}</button>
                </div>
              </form>
          </div>
        </Modal>
      ) : null}
    </main>
  );
};

export default StockOut;
