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
      setLabels(data.map(d => d.month));
      setProfits(data.map(d => Number(d.profit || 0)));
    } catch (err) {
      console.error('Failed to load monthly profit', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [months]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Profit',
        data: profits,
        backgroundColor: 'rgba(16,185,129,0.9)',
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
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
            return '$' + Number(v).toLocaleString();
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(15,23,42,0.05)' },
        ticks: {
          callback: function(value) { return '$' + Number(value).toLocaleString(); },
          color: '#6b7280'
        }
      }
    }
  };

  return (
    <div className='bg-white rounded-lg p-4 shadow' style={{ height: 340 }}>
      <h3 className='text-lg font-medium mb-3'>Monthly Profit</h3>
      {loading ? (
        <div className='py-8 text-center'>Loading...</div>
      ) : (
        <div style={{ width: '100%', height: '100%' }}>
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}

export default MonthlyProfitChart;
