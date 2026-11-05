import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, Download, Search, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context';
import { Badge, Button, Card, EmptyState, Input, Skeleton } from '../components/ui';
import { formatCurrency, formatNumber, localDateBoundary } from '../utils/format';
import { downloadCsv } from '../utils/csv';
import Modal from '../components/Modal';

const PAGE_SIZE = 15;

export default function Sales() {
  const { getSales, createSalesReturn } = useGlobalContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [returnSale, setReturnSale] = useState(null), [returnForm, setReturnForm] = useState({ quantity: "1", disposition: "restock", reason: "" }), [savingReturn, setSavingReturn] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sales', 'list', date, page],
    queryFn: async () => {
      const params = { page, limit: PAGE_SIZE };
      if (date) {
        params.startDate = localDateBoundary(date);
        params.endDate = localDateBoundary(date, true);
      }
      const response = await getSales(params);
      return response.data;
    },
  });
  const sales = data?.sales || [];
  const shown = sales.filter((sale) => !search || `${sale.product?.name || ''} ${sale.product?.sku || ''} ${sale.customer || ''}`.toLowerCase().includes(search.toLowerCase()));
  const totals = { totalRevenue: data?.totalRevenue || 0, totalProfit: data?.totalProfit || 0, total: data?.total || sales.length };
  const totalPages = data?.pages || 1;
  const submitReturn = async (event) => {
    event.preventDefault();
    setSavingReturn(true);
    try { await createSalesReturn({ saleId: returnSale._id, ...returnForm }); toast.success("Sales return recorded"); setReturnSale(null); queryClient.invalidateQueries({ queryKey: ['sales', 'list'] }); }
    catch (error) { toast.error(error.response?.data?.message || "Could not record this return"); }
    finally { setSavingReturn(false); }
  };

  const exportSales = () => downloadCsv('spectra-sales-page.csv',
    ['Date', 'Product', 'SKU', 'Customer', 'Quantity', 'Revenue (NGN)', 'Profit (NGN)'],
    shown.map((sale) => [sale.date || sale.createdAt || '', sale.product?.name || 'Product', sale.product?.sku || '', sale.customer || 'Walk-in Customer', sale.quantity, Number(sale.totalRevenue || 0).toFixed(2), Number(sale.profit || 0).toFixed(2)])
  );

  return <main className="w-full space-y-5 py-5 text-[var(--text)] sm:py-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Finance</p><h1 className="app-page-title">Sales</h1><p className="app-page-copy mt-2">Review recorded transactions, revenue, and profit.</p></div>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button variant="secondary" onClick={exportSales} disabled={!shown.length} className="flex-1 sm:flex-none"><Download size={15}/> Export page</Button>
        <Button onClick={() => navigate('/stock-out')} className="flex-1 sm:flex-none"><ArrowUpRight size={15}/> Record sale</Button>
      </div>
    </header>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Sales summary">
      {[['Revenue', formatCurrency(totals.totalRevenue)], ['Profit', formatCurrency(totals.totalProfit)], ['Transactions', formatNumber(totals.total)]].map(([label, value]) => <Card key={label} className="min-w-0 p-4 sm:p-5"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="money-value mt-2 truncate text-xl font-semibold sm:text-2xl">{value}</p></Card>)}
    </section>

    <section className="app-card overflow-hidden" aria-label="Sales transactions">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div><h2 className="text-sm font-semibold">Transactions</h2><p className="mt-1 text-xs text-[var(--muted)]">{formatNumber(totals.total)} recorded sales</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 sm:w-60"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page" className="pl-9"/></label>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--muted)]"><CalendarDays size={15}/><input aria-label="Filter sales by date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} className="w-full bg-transparent text-sm text-[var(--text)] outline-none"/></label>
        </div>
      </div>

      {isLoading ? <div className="space-y-3 p-4">{[1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-12 w-full"/>)}</div> : isError ? <EmptyState title="Sales couldn’t load" description="Check your connection and try again."/> : shown.length === 0 ? <EmptyState title={search ? 'No matching sales' : 'No sales yet'} description={search ? 'Try another product name, SKU, or customer.' : 'Recorded sales will appear here.'} action={!search ? <Button onClick={() => navigate('/stock-out')} className="mt-4">Record your first sale</Button> : null}/> : <>
        <div className="hidden overflow-x-auto lg:block"><table className="app-table min-w-[850px]"><thead><tr>{['Product', 'Customer', 'Date', 'Quantity', 'Revenue', 'Profit', ''].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{shown.map((sale) => <tr key={sale._id}>
          <td><div className="font-semibold text-[var(--text)]">{sale.product?.name || 'Product'}</div><div className="mt-0.5 text-xs text-[var(--muted)]">{sale.product?.sku || 'No SKU'}</div></td>
          <td className="text-[var(--muted)]">{sale.customer || 'Walk-in Customer'}</td><td className="whitespace-nowrap text-[var(--muted)]">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</td>
          <td><Badge>{formatNumber(sale.quantity)} units</Badge></td><td className="money-value whitespace-nowrap font-medium">{formatCurrency(sale.totalRevenue)}</td><td className="money-value whitespace-nowrap font-semibold text-[var(--success)]">{formatCurrency(sale.profit)}</td><td><button type="button" onClick={() => { setReturnSale(sale); setReturnForm({ quantity: "1", disposition: "restock", reason: "" }); }} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs"><RotateCcw size={13}/> Return</button></td>
        </tr>)}</tbody></table></div>
        <div className="space-y-2 p-3 lg:hidden">{shown.map((sale) => <article key={sale._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{sale.product?.name || 'Product'}</h3><p className="mt-1 truncate text-xs text-[var(--muted)]">{sale.customer || 'Walk-in Customer'} · {new Date(sale.date || sale.createdAt).toLocaleDateString()}</p></div><span className="money-value shrink-0 text-sm font-semibold">{formatCurrency(sale.totalRevenue)}</span></div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs"><span className="text-[var(--muted)]">{formatNumber(sale.quantity)} units</span><span className="money-value font-medium text-[var(--success)]">Profit {formatCurrency(sale.profit)}</span></div><button type="button" onClick={() => { setReturnSale(sale); setReturnForm({ quantity: "1", disposition: "restock", reason: "" }); }} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs"><RotateCcw size={13}/> Record return</button>
        </article>)}</div>
        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>Page {page} of {totalPages} · {formatNumber(totals.total)} sales</span><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isLoading}>Previous</Button><Button variant="secondary" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || isLoading}>Next</Button></div>
        </div>
      </>}
    </section>
    {returnSale && <Modal onClose={() => setReturnSale(null)} title="Record sales return" widthClass="max-w-md"><form onSubmit={submitReturn} className="glass-modal space-y-4 rounded-xl p-5"><div><h2 className="font-semibold">{returnSale.product?.name || "Product"}</h2><p className="mt-1 text-xs text-[var(--muted)]">Returned quantity cannot exceed {Math.max(0, returnSale.quantity - (returnSale.quantityReturned || 0))} unreturned units.</p></div><label className="block text-sm">Quantity<input required type="number" min="1" max={Math.max(1, returnSale.quantity - (returnSale.quantityReturned || 0))} step="1" className="theme-input app-control mt-1 px-3" value={returnForm.quantity} onChange={(event) => setReturnForm({ ...returnForm, quantity: event.target.value })}/></label><label className="block text-sm">Disposition<select className="theme-input app-control mt-1 px-3" value={returnForm.disposition} onChange={(event) => setReturnForm({ ...returnForm, disposition: event.target.value })}><option value="restock">Return to available stock</option><option value="damaged">Damaged, do not restock</option></select></label><label className="block text-sm">Reason<input required maxLength={500} className="theme-input app-control mt-1 px-3" value={returnForm.reason} onChange={(event) => setReturnForm({ ...returnForm, reason: event.target.value })}/></label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setReturnSale(null)}>Cancel</Button><Button type="submit" disabled={savingReturn}>{savingReturn ? "Saving…" : "Save return"}</Button></div></form></Modal>}
  </main>;
}
