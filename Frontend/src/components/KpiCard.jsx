import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, Skeleton } from './ui';
import { formatCurrency, formatNumber } from '../utils/format';

function useCountUp(value, duration = 500) {
  const [shown, setShown] = useState(0);
  useEffect(()=>{
    const target=Number(value)||0;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return undefined;
    const start=performance.now();let frame;
    const tick=(now)=>{const progress=Math.min((now-start)/duration,1);const eased=1-Math.pow(1-progress,3);setShown(target*eased);if(progress<1)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[value,duration]);
  return shown;
}

export default function KpiCard({ title, value, money = false, delta, trend = [], loading = false, hint }) {
  const count = useCountUp(value);
  const displayedCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? Number(value)||0 : count;
  if(loading)return <Card className="flex h-[142px] flex-col p-4"><Skeleton className="h-3 w-28"/><Skeleton className="mt-4 h-7 w-36"/><Skeleton className="mt-auto h-5 w-24"/></Card>;
  const hasTrend=trend.length>1;
  const min=Math.min(...trend);const max=Math.max(...trend);const span=max-min||1;
  const points=trend.map((point,index)=>`${(index/(trend.length-1))*100},${32-((point-min)/span)*28}`).join(' ');
  return <Card className="flex h-[142px] flex-col p-4 transition duration-150 hover:-translate-y-0.5 sm:p-5"><p className="text-xs font-medium text-[var(--muted)]">{title}</p><div className="mt-2 flex items-end justify-between gap-2"><p data-currency={money?'true':undefined} className="min-w-0 truncate text-[1.55rem] font-semibold leading-tight tracking-[-.04em] tabular-nums">{money?formatCurrency(displayedCount):formatNumber(Math.round(displayedCount))}</p>{hasTrend&&<svg aria-hidden="true" viewBox="0 0 100 36" preserveAspectRatio="none" className="h-9 w-[76px] shrink-0 overflow-visible"><polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div><div className="mt-auto flex items-center justify-between pt-2"><span className="text-[10px] text-[var(--muted)]">{hint || 'Current period'}</span>{Number.isFinite(delta)&&<span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] font-semibold tabular-nums ${delta>=0?'bg-emerald-500/10 text-[var(--success)]':'bg-rose-500/10 text-[var(--danger)]'}`}>{delta>=0?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>} {Math.abs(delta).toFixed(1)}%</span>}</div></Card>;
}
