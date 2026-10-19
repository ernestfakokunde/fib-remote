import { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Box, CircleAlert, Plus, ReceiptText, ShoppingBag, Sparkles } from 'lucide-react';
import { useGlobalContext } from '../context/context';
import KpiCard from '../components/KpiCard';
const RevenueProfitChart = lazy(()=>import('../components/RevenueProfitChart.jsx'));
import { Badge, Card, EmptyState, Skeleton } from '../components/ui';
import { formatCurrency, formatNumber } from '../utils/format';

const ranges = [7, 30, 90];

function SectionHeader({ title, action, to }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{title}</h2>{action&&<Link to={to} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline">{action}<ArrowRight size={13}/></Link>}</div>;
}

function Dashboard() {
  const { getDashboardOverview, user } = useGlobalContext();
  const [days, setDays] = useState(7);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-overview', days],
    queryFn: async()=>{const response=await getDashboardOverview({days});return response.data?.data;},
    staleTime: 30_000,
  });
  const overview=data||{};
  const kpis=overview.kpis||{};
  const chart=overview.chart||[];
  const lowStock=overview.lowStock||[];
  const topProducts=overview.topProducts||[];
  const recentSales=overview.recentSales||[];
  const firstName=(user?.username||user?.name||'there').trim().split(/\s+/)[0];
  const dateLabel=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
  const revenueTrend=chart.slice(-7).map((point)=>point.revenue);
  const profitTrend=chart.slice(-7).map((point)=>point.profit);

  return <div className="space-y-5 text-[var(--text)]">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs text-[var(--muted)]">{dateLabel}</p><h1 className="mt-1 text-[22px] font-semibold tracking-tight">Good day, {firstName}<span className="ml-1">👋</span></h1><p className="mt-1 text-xs text-[var(--muted)]">Here’s what’s happening in your business.</p></div><div className="flex w-full items-center gap-2 sm:w-auto"><div className="flex flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 sm:flex-none" role="group" aria-label="Chart date range">{ranges.map((range)=><button type="button" key={range} aria-pressed={days===range} onClick={()=>setDays(range)} className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition duration-150 sm:flex-none ${days===range?'bg-[var(--primary-soft)] text-[var(--primary)]':'text-[var(--muted)] hover:text-[var(--text)]'}`}>{range}D</button>)}</div><Link to="/products" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white transition hover:brightness-105"><Plus size={15}/> Add product</Link></div></div>

    {isError?<Card className="flex flex-col items-center gap-3 p-8 text-center"><CircleAlert className="text-[var(--danger)]"/><div><p className="text-sm font-semibold">Dashboard data is unavailable</p><p className="mt-1 text-xs text-[var(--muted)]">Check your connection and try again.</p></div><button type="button" onClick={()=>refetch()} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface)]">Try again</button></Card>:<>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard title="Revenue today" value={kpis.revenueToday} money delta={kpis.revenueDelta} trend={revenueTrend} hint="Compared with yesterday" loading={isLoading}/><KpiCard title="Profit today" value={kpis.profitToday} money delta={kpis.profitDelta} trend={profitTrend} hint="Compared with yesterday" loading={isLoading}/><KpiCard title="Stock value" value={kpis.stockValue} money hint={`${formatNumber(kpis.productCount)} products at cost`} loading={isLoading}/><KpiCard title="Low stock" value={kpis.lowStockCount} hint="At or below reorder level" loading={isLoading}/></div>

      <Suspense fallback={<Card className="h-[350px] p-5"><Skeleton className="h-4 w-44"/><Skeleton className="mt-2 h-3 w-60"/><Skeleton className="mt-8 h-[240px] w-full"/></Card>}><RevenueProfitChart data={chart} loading={isLoading}/></Suspense>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4 sm:p-5"><SectionHeader title="Low stock" action="View inventory" to="/products"/>{isLoading?<div className="space-y-3">{[1,2,3].map((i)=><Skeleton key={i} className="h-[54px]"/>)}</div>:lowStock.length===0?<EmptyState title="Stock levels look healthy" description="Products at or below their reorder level will appear here." action={<Link to="/products" className="mt-3 text-xs font-semibold text-[var(--primary)]">Go to products</Link>}/>:<ul className="divide-y divide-[var(--border)]">{lowStock.map((product)=><li key={product._id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-[var(--warning)]"><Box size={16}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{product.sku||product.category?.name||'Inventory item'}</p></div><Badge tone={product.quantity===0?'danger':'warning'}>{product.quantity===0?'Out':`${product.quantity} left`}</Badge><Link to="/stock-in" aria-label={`Restock ${product.name}`} className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-semibold hover:bg-[var(--surface)]">Restock</Link></li>)}</ul>}</Card>

        <Card className="p-4 sm:p-5"><SectionHeader title={`Top selling · ${days} days`} action="View sales" to="/sales"/>{isLoading?<div className="space-y-3">{[1,2,3].map((i)=><Skeleton key={i} className="h-[54px]"/>)}</div>:topProducts.length===0?<EmptyState title="Your best sellers will show here" description="Product rankings appear once you record sales." action={<Link to="/stock-out" className="mt-3 text-xs font-semibold text-[var(--primary)]">Record a sale</Link>}/>:<ul className="divide-y divide-[var(--border)]">{topProducts.map((product,index)=><li key={product._id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${index===0?'bg-[var(--primary-soft)] text-[var(--primary)]':'bg-[var(--surface)] text-[var(--muted)]'}`}>{(product.name||'?').slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[10px] text-[var(--muted)]">{formatNumber(product.unitsSold)} units sold</p></div><div className="text-right"><p className="text-xs font-semibold tabular-nums">{formatCurrency(product.revenue)}</p><p className="mt-0.5 text-[10px] text-[var(--muted)]">Revenue</p></div></li>)}</ul>}</Card>
      </div>

      <Card className="p-4 sm:p-5"><SectionHeader title="Recent activity" action="All sales" to="/sales"/>{isLoading?<div className="space-y-3">{[1,2,3].map((i)=><Skeleton key={i} className="h-12"/>)}</div>:recentSales.length===0?<EmptyState title="No activity yet" description="Your latest sales will appear here as your team records them." action={<Link to="/stock-out" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">Record your first sale <ArrowRight size={13}/></Link>}/>:<ul className="divide-y divide-[var(--border)]">{recentSales.map((sale)=><li key={sale._id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><ShoppingBag size={15}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs"><span className="font-semibold">{sale.product?.name||'Product'}</span><span className="text-[var(--muted)]"> · {formatNumber(sale.quantity)} sold to {sale.customer||'Walk-in Customer'}</span></p><p className="mt-1 text-[10px] text-[var(--muted)]">{new Date(sale.date||sale.createdAt).toLocaleString()}</p></div><div className="text-right"><p className="text-xs font-semibold tabular-nums">{formatCurrency(sale.totalRevenue)}</p><p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[var(--success)]"><ReceiptText size={11}/> Sale recorded</p></div></li>)}</ul>}</Card>
    </>}
  </div>;
}

export default Dashboard;
