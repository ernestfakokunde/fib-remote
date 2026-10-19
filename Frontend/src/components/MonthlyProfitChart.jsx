import React, { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
const ProfitChartView = lazy(() => import('./ProfitChartView.jsx'));
import { useGlobalContext } from '../context/context';

const MonthlyProfitChart = ({ months = 6 }) => {
  const { getMonthlyProfit } = useGlobalContext();
  const [labels, setLabels] = useState([]);
  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMonthlyProfit({ months });
      const data = res.data?.months || [];
      setLabels(data.map((d) => d.month));
      setProfits(data.map((d) => Number(d.profit || 0)));
    } catch (err) {
      console.error('Failed to load monthly profit', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  return (
    <div className="glass-panel flex h-[300px] min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 p-3 shadow-xl sm:h-[340px] sm:rounded-[1.6rem] sm:p-4">
      <h3 className="mb-3 text-lg font-medium text-[var(--text)]">Monthly Profit</h3>
      {loading ? (
        <div className="py-8 text-center text-[var(--muted)]">Loading...</div>
      ) : (
        <Suspense fallback={<div className="min-w-0 flex-1 animate-pulse rounded-lg bg-[var(--surface)]"/>}><ProfitChartView labels={labels} profits={profits} /></Suspense>
      )}
    </div>
  );
};

export default MonthlyProfitChart;
