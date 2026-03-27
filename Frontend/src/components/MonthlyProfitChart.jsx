import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../context/context';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Profit',
        data: profits,
        backgroundColor: 'rgba(16,185,129,0.9)',
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const v = context.parsed.y || 0;
            return 'NGN ' + Number(v).toLocaleString();
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(15,23,42,0.05)' },
        ticks: {
          callback: function(value) { return 'NGN ' + Number(value).toLocaleString(); },
          color: '#6b7280',
        },
      },
    },
  };

  return (
    <div className="glass-panel flex h-[300px] min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 p-3 shadow-xl sm:h-[340px] sm:rounded-[1.6rem] sm:p-4">
      <h3 className="mb-3 text-lg font-medium text-[var(--text)]">Monthly Profit</h3>
      {loading ? (
        <div className="py-8 text-center text-[var(--muted)]">Loading...</div>
      ) : (
        <div className="min-w-0 flex-1">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default MonthlyProfitChart;
