import React, { useCallback, useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
const SalesChartView = lazy(() => import('./SalesChartView.jsx'));
import { useGlobalContext } from '../context/context';
import { Card, EmptyState, Skeleton } from './ui';
import { Link } from 'react-router-dom';

const SalesChart = ({ startDate, endDate }) => {
  const { getSalesPerDay } = useGlobalContext();
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setLabels([]);
      setValues([]);
      setProfits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      params.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getSalesPerDay(params);
      const data = res.data?.data || [];

      let sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (!startDate && !endDate && sorted.length > 7) {
        sorted = sorted.slice(-7);
      }

      const formattedLabels = sorted.map((d) => {
        const dt = new Date(d.date);
        return Number.isFinite(dt.getTime())
          ? dt.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', timeZone: 'UTC' })
          : d.date;
      });

      setLabels(formattedLabels);
      setValues(sorted.map((d) => Number(d.totalSales || 0)));
      setProfits(sorted.map((d) => Number(d.totalProfit || 0)));
    } catch (err) {
      console.error('Failed to load sales per day', err);
      setLabels([]);
      setValues([]);
      setProfits([]);
    } finally {
      setLoading(false);
    }
  }, [endDate, getSalesPerDay, startDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card className="flex h-[250px] min-w-0 flex-col overflow-hidden p-4 sm:h-[280px] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Revenue vs profit</h3><div className="flex gap-3 text-[10px] text-[var(--muted)]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--primary)]"/>Revenue</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--chart-secondary)]"/>Profit</span></div></div>
      {loading ? (
        <div className="flex-1 space-y-3"><Skeleton className="h-full min-h-48 w-full"/></div>
      ) : !values.some((value)=>Number.isFinite(value) && value>0) ? (
        <EmptyState title="Sales data will appear here" description="Record a sale to see revenue trends over time." action={<Link to="/stock-out" className="mt-3 text-xs font-semibold text-[var(--primary)]">Record a sale</Link>}/>
      ) : (
        <Suspense fallback={<div className="min-w-0 flex-1 animate-pulse rounded-lg bg-[var(--surface)]"/>}><SalesChartView labels={labels} values={values} profits={profits} /></Suspense>
      )}
    </Card>
  );
};

export default SalesChart;
