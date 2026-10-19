import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ChartNoAxesCombined } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { Card, EmptyState, Skeleton } from './ui';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-xl"><p className="mb-2 text-[11px] text-[var(--muted)]">{new Date(`${label}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p>{payload.map((item)=><p key={item.dataKey} className="flex items-center justify-between gap-6 py-0.5 text-xs"><span style={{color:item.color}}>{item.name}</span><span className="font-semibold tabular-nums">{formatCurrency(item.value)}</span></p>)}</div>;
};

export function ChartSkeleton() { return <Card className="h-[350px] p-5"><Skeleton className="h-4 w-44"/><Skeleton className="mt-2 h-3 w-60"/><Skeleton className="mt-8 h-[240px] w-full"/></Card>; }

export default function RevenueProfitChart({ data = [], loading = false }) {
  const hasSales = data.some((point)=>point.revenue!==0||point.profit!==0);
  if(loading)return <ChartSkeleton/>;
  return <Card className="min-w-0 p-4 sm:p-5"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-sm font-semibold">Revenue vs profit</h2><p className="mt-1 text-xs text-[var(--muted)]">Daily business performance</p></div><div className="flex gap-4 pt-1 text-[10px] text-[var(--muted)]"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--primary)]"/>Revenue</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--success)]"/>Profit</span></div></div>
    {!hasSales?<EmptyState title="Your sales trend will show here" description="Record a sale to start seeing revenue and profit over time." action={<Link to="/stock-out" className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white">Record a sale <ArrowRight size={14}/></Link>}/>:<div className="h-[280px] w-full" aria-label="Revenue and profit area chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:8,right:4,bottom:0,left:0}}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={.22}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient><linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={.15}/><stop offset="95%" stopColor="var(--success)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5"/><XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} tick={{fontSize:10,fill:'var(--muted)'}} tickFormatter={(value)=>new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'})}/><YAxis width={58} tickLine={false} axisLine={false} tickMargin={5} tick={{fontSize:10,fill:'var(--muted)'}} tickFormatter={(value)=>new Intl.NumberFormat('en-NG',{notation:'compact',maximumFractionDigits:1}).format(value)}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revenueFill)" activeDot={{r:4,strokeWidth:0}}/><Area type="monotone" dataKey="profit" name="Profit" stroke="var(--success)" strokeWidth={2} fill="url(#profitFill)" activeDot={{r:4,strokeWidth:0}}/></AreaChart></ResponsiveContainer></div>}</Card>;
}
