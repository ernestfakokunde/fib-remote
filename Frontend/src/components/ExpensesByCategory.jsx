import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useGlobalContext } from '../context/context';
import { Card, EmptyState, Skeleton } from './ui';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartPalette = ['#38bdf8', '#22c55e', '#f59e0b', '#f97316', '#a78bfa', '#f43f5e', '#14b8a6', '#eab308'];

const ExpensesByCategory = ({ startDate, endDate }) => {
  const { getExpenses } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 1000 };
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const res = await getExpenses(params);
      const expenses = res.data?.expenses || [];

      const map = new Map();
      expenses.forEach((e) => {
        const cat = e.category || { name: 'Uncategorized', color: null };
        const key = cat._id || cat.name;
        const prev = map.get(key) || { name: cat.name || 'Uncategorized', color: cat.color || null, total: 0 };
        prev.total += Number(e.amount || 0);
        map.set(key, prev);
      });

      const items = Array.from(map.values()).sort((a, b) => b.total - a.total);
      const labels = items.map((i) => i.name);
      const data = items.map((i) => i.total);
      const backgroundColor = items.map((i, index) => {
        const color = i.color;
        if (typeof color === 'string' && (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl'))) {
          return color;
        }
        return chartPalette[index % chartPalette.length];
      });

      setChartData({
        labels,
        datasets: [{ data, backgroundColor, borderWidth: 0, hoverOffset: 8 }],
      });
    } catch (err) {
      console.error('Failed to load expenses for chart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <Card className="flex h-[300px] min-w-0 flex-col overflow-hidden p-4 sm:h-[340px] sm:p-5">
      <h3 className="mb-3 text-sm font-semibold">Expenses by Category</h3>
      {loading ? (
        <Skeleton className="h-full min-h-48 w-full"/>
      ) : !chartData.datasets[0]?.data?.length ? (
        <EmptyState title="Your expense breakdown will appear here" description="Record a business expense to see where your spending goes." action={<Link to="/expenses" className="mt-3 text-xs font-semibold text-[var(--primary)]">Add an expense</Link>}/>
      ) : (
        <div className="min-w-0 flex-1">
          <Doughnut
            data={chartData}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: isSmallScreen ? 'bottom' : 'right',
                  labels: {
                    color: '#94a3b8',
                    boxWidth: 12,
                    padding: isSmallScreen ? 12 : 16,
                  },
                },
              },
            }}
          />
        </div>
      )}
    </Card>
  );
};

export default ExpensesByCategory;
