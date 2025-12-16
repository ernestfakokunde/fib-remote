import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useGlobalContext } from '../context/context';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensesByCategory = ({ startDate, endDate }) => {
  const { getExpenses } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      // fetch many expenses for the date range
      const params = { page: 1, limit: 1000 };
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const res = await getExpenses(params);
      const expenses = res.data?.expenses || [];

      // aggregate by category name/color
      const map = new Map();
      expenses.forEach((e) => {
        const cat = e.category || { name: 'Uncategorized', color: 'blue' };
        const key = cat._id || cat.name;
        const prev = map.get(key) || { name: cat.name || 'Uncategorized', color: cat.color || 'blue', total: 0 };
        prev.total += Number(e.amount || 0);
        map.set(key, prev);
      });

      const items = Array.from(map.values()).sort((a, b) => b.total - a.total);
      const labels = items.map(i => i.name);
      const data = items.map(i => i.total);
      const bg = items.map(i => i.color || 'blue');

      setChartData({ labels, datasets: [{ data, backgroundColor: bg, borderWidth: 0 }] });
    } catch (err) {
      console.error('Failed to load expenses for chart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  return (
    <div className='bg-white rounded-lg p-4 shadow' style={{ height: 340 }}>
      <h3 className='text-lg font-medium mb-3'>Expenses by Category</h3>
      {loading ? (
        <div className='py-12 text-center'>Loading...</div>
      ) : (
        <div style={{ width: '100%', height: '100%' }}>
          <Doughnut data={chartData} options={{ plugins: { legend: { position: 'right' } } }} />
        </div>
      )}
    </div>
  );
};

export default ExpensesByCategory;
