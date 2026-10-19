import React, { useCallback, useEffect, useState } from 'react';
import SaleCard from '../components/SaleCard';
import { useGlobalContext } from '../context/context';
import Modal from '../components/Modal';
import { Download, Plus, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber, localDateBoundary, localDateString } from '../utils/format';
import { downloadCsv } from '../utils/csv';
import { Button, EmptyState, Skeleton } from '../components/ui';

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
              <Button variant="secondary" onClick={exportSales} disabled={!sales.length} className="flex-1 sm:flex-none"><Download size={15}/> Export page</Button>
              <Button onClick={openModal} className="flex-1 sm:flex-none"><Plus size={16}/> Record sale</Button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SaleCard title="Total Revenue" value={formatCurrency(totals.totalRevenue)} />
          <SaleCard title="Total Profit" value={formatCurrency(totals.totalProfit)} />
          <SaleCard title="Total Sales" value={formatNumber(totals.totalSales)} />
        </div>

        <section className="app-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-sm font-semibold text-[var(--text)]">Recent transactions</h2><p className="mt-1 text-xs text-[var(--muted)]">{formatNumber(totals.totalSales)} sales in the selected period</p></div>
            <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--surface)] p-1">
              <button onClick={() => { setFilterMode('all'); setPage(1); }} className={filterButtonClass(filterMode === 'all')}>All time</button>
              <button onClick={() => { setFilterMode('today'); setPage(1); }} className={filterButtonClass(filterMode === 'today')}>Today</button>
              <button onClick={() => { setFilterMode('last7'); setPage(1); }} className={filterButtonClass(filterMode === 'last7')}>7 days</button>
              <button onClick={() => { setFilterMode('month'); setPage(1); }} className={filterButtonClass(filterMode === 'month')}>This month</button>
              <button onClick={() => { setFilterMode('custom'); setPage(1); }} className={filterButtonClass(filterMode === 'custom')}>Custom</button>
            </div>
          </div>

          {filterMode === 'custom' ? (
            <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">From</label>
                <input type="date" className="theme-input app-control px-3" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">To</label>
                <input type="date" className="theme-input app-control px-3" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
              </div>
              <Button onClick={() => fetchSales(1)}>Apply range</Button>
            </div>
          ) : null}

          {isLoading ? <div className="space-y-3 p-4">{[1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-14 w-full" />)}</div> : sales.length === 0 ? <EmptyState title="No sales in this period" description="Record a sale and it will appear here with its revenue and profit." action={<Button onClick={openModal} className="mt-4"><Plus size={15} /> Record a sale</Button>} /> : <>
            <div className="hidden overflow-x-auto lg:block"><table className="app-table min-w-[760px]"><thead><tr>{['Product', 'Customer', 'Date', 'Quantity', 'Unit price', 'Revenue', 'Profit'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{sales.map((sale) => <tr key={sale._id}>
              <td><div className="font-semibold text-[var(--text)]">{sale.product?.name || 'Product'}</div><div className="mt-0.5 text-xs text-[var(--muted)]">{sale.product?.sku || 'No SKU'}</div></td>
              <td><span className="inline-flex items-center gap-2 text-[var(--muted)]"><UserRound size={14} />{sale.customer || 'Walk-in Customer'}</span></td>
              <td className="whitespace-nowrap text-[var(--muted)]">{new Date(sale.date || sale.createdAt).toLocaleString()}</td>
              <td className="tabular-nums">{formatNumber(sale.quantity)}</td><td className="money-value whitespace-nowrap text-[var(--muted)]">{formatCurrency(sale.sellingPrice)}</td>
              <td className="money-value whitespace-nowrap font-semibold">{formatCurrency(sale.totalRevenue)}</td><td className="money-value whitespace-nowrap font-medium text-[var(--success)]">{formatCurrency(sale.profit)}</td>
            </tr>)}</tbody></table></div>
            <div className="space-y-2 p-3 lg:hidden">{sales.map((sale) => <article key={sale._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{sale.product?.name || 'Product'}</h3><p className="mt-1 text-xs text-[var(--muted)]">{sale.customer || 'Walk-in Customer'}</p></div><span className="money-value shrink-0 text-sm font-semibold">{formatCurrency(sale.totalRevenue)}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs"><span className="text-[var(--muted)]">{formatNumber(sale.quantity)} units · {new Date(sale.date || sale.createdAt).toLocaleDateString()}</span><span className="money-value font-medium text-[var(--success)]">{formatCurrency(sale.profit)} profit</span></div>
            </article>)}</div>
            <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-5"><span>Page {page} of {pages} · {formatNumber(totals.totalSales)} sales</span><div className="flex justify-end gap-2"><Button variant="secondary" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button variant="secondary" disabled={page >= pages || isLoading} onClick={() => setPage((current) => Math.min(pages, current + 1))}>Next</Button></div></div>
          </>}
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
