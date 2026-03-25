import React, { useEffect, useState } from 'react';
import SaleCard from '../components/SaleCard';
import { useGlobalContext } from '../context/context';
import Modal from '../components/Modal';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber } from '../utils/format';

const filterButtonClass = (active) =>
  `rounded-full px-3 py-2 text-sm transition ${
    active
      ? 'bg-[var(--primary)] text-white shadow-lg shadow-sky-500/20'
      : 'border border-white/10 bg-white/10 text-[var(--text)] hover:bg-white/15'
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
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [form, setForm] = useState({ productId: '', quantity: 1, sellingPrice: '', date: '', customer: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [totals, setTotals] = useState({ totalRevenue: 0, totalProfit: 0, totalSales: 0 });

  const fetchSales = async (p = 1) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit };
      const now = new Date();
      if (filterMode === 'today') {
        const d = now.toISOString().slice(0, 10);
        params.startDate = d;
        params.endDate = d;
      } else if (filterMode === 'last7') {
        const end = now.toISOString().slice(0, 10);
        const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        params.startDate = start;
        params.endDate = end;
      } else if (filterMode === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        params.startDate = start;
        params.endDate = end;
      } else if (filterMode === 'custom' && startDateFilter && endDateFilter) {
        params.startDate = startDateFilter.toISOString().slice(0, 10);
        params.endDate = endDateFilter.toISOString().slice(0, 10);
      }

      const res = await getSales(params);
      const data = res.data || {};
      setSales(Array.isArray(data.sales) ? data.sales : []);
      setPages(data.pages || 1);
      setPage(data.currentPage || p);
      setTotals({
        totalRevenue: Number(data.totalRevenue || 0),
        totalProfit: Number(data.totalProfit || 0),
        totalSales: Number(data.total || data.totalSales || 0),
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sales');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProducts({ limit: 100 });
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSales(page);
      await fetchProducts();
    };
    init();
  }, []);

  useEffect(() => {
    fetchSales(page);
  }, [filterMode, startDateFilter, endDateFilter, page]);

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

  return (
    <div className="min-h-screen overflow-x-hidden text-[var(--text)]">
      <div className="space-y-6 p-6">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_40%)]" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Stock Out</p>
              <h1 className="mt-3 text-3xl font-semibold">Track outgoing inventory and revenue movement</h1>
              <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">Review sales flow with the same glassy dashboard feel as the rest of the workspace.</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-[var(--text)] transition hover:bg-white/15">Export</button>
              <button onClick={openModal} className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm text-white shadow-lg shadow-sky-500/20">
                <Plus className="h-4 w-4" />
                Record Sale
              </button>
            </div>
          </div>
        </section>

        <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SaleCard title="Total Revenue" value={formatCurrency(totals.totalRevenue)} />
          <SaleCard title="Total Profit" value={formatCurrency(totals.totalProfit)} />
          <SaleCard title="Total Sales" value={formatNumber(totals.totalSales)} />
        </div>

        <section className="glass-panel rounded-[1.75rem] border border-white/10 p-4 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-[var(--text)]">Recent Sales</h2>
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
                <input type="date" className="theme-input mt-2 rounded-xl px-3 py-2" value={startDateFilter ? startDateFilter.toISOString().slice(0, 10) : ''} onChange={(e) => setStartDateFilter(e.target.value ? new Date(e.target.value) : null)} />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)]">End</label>
                <input type="date" className="theme-input mt-2 rounded-xl px-3 py-2" value={endDateFilter ? endDateFilter.toISOString().slice(0, 10) : ''} onChange={(e) => setEndDateFilter(e.target.value ? new Date(e.target.value) : null)} />
              </div>
              <button onClick={() => { fetchSales(1); }} className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-white">Apply</button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-10 text-center text-[var(--muted)]"><Loader2 className="mx-auto animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {sales.map((s) => (
                <div key={s._id} className="glass-panel flex items-center justify-between rounded-[1.25rem] border border-white/10 p-4 shadow-lg">
                  <div>
                    <div className="font-medium text-[var(--text)]">{s.product?.name || 'Product'}</div>
                    <div className="text-sm font-bold text-[var(--muted)]">
                      Qty: {formatNumber(s.quantity)} | Revenue: {formatCurrency(s.totalRevenue)} | Selling Price: {formatCurrency(s.sellingPrice)}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--muted)]">{new Date(s.date || s.createdAt).toLocaleString()}</div>
                </div>
              ))}

              <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
                <button disabled={page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchSales(p); }} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 disabled:opacity-50">Prev</button>
                <div>Page {page} / {pages}</div>
                <button disabled={page >= pages} onClick={() => { const p = Math.min(pages, page + 1); setPage(p); fetchSales(p); }} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 disabled:opacity-50">Next</button>
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
                <h2 className="text-xl font-bold text-[var(--text)]">Record Sale</h2>
                <button onClick={() => setShowModal(false)} className="text-[var(--muted)]">Close</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Product</label>
                  <select className="theme-input rounded px-3 py-2" value={form.productId} onChange={(e) => {
                    const pid = e.target.value;
                    setForm((f) => ({ ...f, productId: pid }));
                    const product = products.find((x) => x._id === pid);
                    if (product) setForm((f) => ({ ...f, sellingPrice: product.sellingPrice }));
                  }}>
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} - ({p.sku})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Quantity</label>
                    <input type="number" min={1} className="theme-input rounded px-3 py-2" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[var(--muted)]">Selling Price</label>
                    <input type="number" step="0.01" className="theme-input rounded px-3 py-2" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Customer (optional)</label>
                  <input type="text" className="theme-input rounded px-3 py-2" value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} />
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

export default StockOut;
