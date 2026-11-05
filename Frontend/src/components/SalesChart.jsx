import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, Skeleton } from './ui';

const SalesChartView = lazy(() => import('./SalesChartView.jsx'));

const SalesChart = ({ rows = [], loading = false }) => {
  const hasSales = rows.some((row) => Number(row.revenue) > 0 || Number(row.profit) !== 0);
  return <Card className="flex h-[340px] min-w-0 flex-col overflow-hidden p-4 sm:h-[390px] sm:p-5">
    <div className="mb-2 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-[var(--text)]">Revenue vs profit</h2><p className="mt-1 text-[11px] text-[var(--muted)]">Sales trend for the selected report period</p></div><div className="flex gap-3 pt-1 text-[10px] text-[var(--muted)]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--primary)]"/>Revenue</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--chart-secondary)]"/>Gross profit</span></div></div>
    {loading ? <div className="min-h-0 flex-1"><Skeleton className="h-full w-full"/> </div> : !hasSales ? <EmptyState title="No sales in this period" description="Record a sale to build your revenue and profit report." action={<Link to="/stock-out" className="mt-3 text-xs font-semibold text-[var(--primary)]">Record a sale</Link>}/> : <Suspense fallback={<div className="min-h-0 flex-1"><Skeleton className="h-full w-full"/></div>}><SalesChartView rows={rows}/></Suspense>}
  </Card>;
};

export default SalesChart;
