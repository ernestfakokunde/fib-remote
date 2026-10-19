import React, { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
const SalesChartView = lazy(() => import('./SalesChartView.jsx'));
import { useGlobalContext } from '../context/context';

const SalesChart = ({ startDate, endDate }) => {
  const { getSalesPerDay } = useGlobalContext();
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getSalesPerDay(params);
      const data = res.data?.data || [];

      let sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (!startDate && !endDate && sorted.length > 7) {
        sorted = sorted.slice(-7);
      }

      const formattedLabels = sorted.map((d) => {
        const dt = new Date(d.date);
        return dt.toLocaleDateString(undefined, { weekday: 'short' });
      });

      setLabels(formattedLabels);
      setValues(sorted.map((d) => Number(d.totalSales || 0)));
    } catch (err) {
      console.error('Failed to load sales per day', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  return (
    <div className="glass-panel flex h-[300px] min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 p-3 shadow-xl sm:h-[340px] sm:rounded-[1.6rem] sm:p-4">
      <h3 className="mb-3 text-lg font-medium text-[var(--text)]">Sales Analytics</h3>
      {loading ? (
        <div className="py-8 text-center text-[var(--muted)]">Loading...</div>
      ) : (
        <Suspense fallback={<div className="min-w-0 flex-1 animate-pulse rounded-lg bg-[var(--surface)]"/>}><SalesChartView labels={labels} values={values} /></Suspense>
      )}
    </div>
  );
};

export default SalesChart;
