import React, { useCallback, useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
const ProfitChartView = lazy(() => import('./ProfitChartView.jsx'));
import { useGlobalContext } from '../context/context';
import { Card, EmptyState, Skeleton } from './ui';
import { Link } from 'react-router-dom';

const MonthlyProfitChart = ({ months = 6 }) => {
  const { getMonthlyProfit } = useGlobalContext();
  const [labels, setLabels] = useState([]);
  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonthlyProfit({ months, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const data = res.data?.months || [];
      setLabels(data.map((d) => `${d.month} '${String(d.year).slice(-2)}`));
      setProfits(data.map((d) => Number(d.profit || 0)));
    } catch (err) {
      console.error('Failed to load monthly profit', err);
      setLabels([]);
      setProfits([]);
    } finally {
      setLoading(false);
    }
  }, [getMonthlyProfit, months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card className="flex h-[300px] min-w-0 flex-col overflow-hidden p-4 sm:h-[340px] sm:p-5">
      <h3 className="mb-3 text-sm font-semibold">Monthly Profit</h3>
      {loading ? (
        <div className="flex-1"><Skeleton className="h-full min-h-48 w-full"/></div>
      ) : !profits.some((value)=>Number.isFinite(value) && value !== 0) ? (
        <EmptyState title="Profit trend will appear here" description="Completed sales will build your monthly profit view." action={<Link to="/stock-out" className="mt-3 text-xs font-semibold text-[var(--primary)]">Record a sale</Link>}/>
      ) : (
        <Suspense fallback={<div className="min-w-0 flex-1 animate-pulse rounded-lg bg-[var(--surface)]"/>}><ProfitChartView labels={labels} profits={profits} /></Suspense>
      )}
    </Card>
  );
};

export default MonthlyProfitChart;
