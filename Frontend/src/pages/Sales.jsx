import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Search } from 'lucide-react';
import { useGlobalContext } from '../context/context';
import { formatCurrency, formatNumber } from '../utils/format';
import { Badge, Card, EmptyState, Input, Skeleton, Table } from '../components/ui';

export default function Sales() {
  const { getSales } = useGlobalContext();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['sales', 'list', date],
    queryFn: async () => {
      const params = { page: 1, limit: 100 };
      if (date) { params.startDate = date; params.endDate = date; }
      const response = await getSales(params);
      return response.data;
    },
  });
  const sales = data?.sales || [];
  const shown = sales.filter((sale) => !search || `${sale.product?.name || ''} ${sale.customer || ''}`.toLowerCase().includes(search.toLowerCase()));
  const totals = { totalRevenue: data?.totalRevenue || 0, totalProfit: data?.totalProfit || 0, total: data?.total || sales.length };

  return <div className="page-shell text-[var(--text)]">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-[var(--muted)]">Track transactions and performance</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Sales</h1></div><label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3"><CalendarDays size={16} className="text-[var(--muted)]"/><input aria-label="Filter sales by date" type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="h-10 bg-transparent text-sm outline-none"/></label></div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">{[['Revenue',formatCurrency(totals.totalRevenue)],['Profit',formatCurrency(totals.totalProfit)],['Transactions',formatNumber(totals.total)]].map(([label,value])=><Card key={label} className="p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></Card>)}</div>
    <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4"><div><h2 className="font-semibold">Transactions</h2><p className="mt-1 text-xs text-[var(--muted)]">Recent recorded sales</p></div><div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search sales" className="pl-9"/></div></div>
      {isLoading ? <div className="space-y-3 p-4">{[1,2,3].map((x)=><Skeleton key={x} className="h-12 w-full"/>)}</div> : shown.length === 0 ? <EmptyState title="No sales found" description="Sales will appear here after a transaction is recorded."/> : <Table><thead className="bg-[var(--surface)] text-xs text-[var(--muted)]"><tr>{['Product','Customer','Date','Quantity','Revenue','Profit'].map((label)=><th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{shown.map((sale)=><tr key={sale._id} className="border-t border-[var(--border)]"><td className="px-4 py-3 font-medium">{sale.product?.name || 'Product'}</td><td className="px-4 py-3 text-[var(--muted)]">{sale.customer || 'Walk-in Customer'}</td><td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</td><td className="px-4 py-3"><Badge>{formatNumber(sale.quantity)}</Badge></td><td className="whitespace-nowrap px-4 py-3">{formatCurrency(sale.totalRevenue)}</td><td className="whitespace-nowrap px-4 py-3 text-[var(--success)]">{formatCurrency(sale.profit)}</td></tr>)}</tbody></Table>}</Card>
  </div>;
}
