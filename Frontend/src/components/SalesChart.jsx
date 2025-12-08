import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../context/context';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

      // backend returns array of { date: 'YYYY-MM-DD', totalSales }
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));

      // use short weekday labels for compact display (Mon, Tue...)
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

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Sales',
        data: values,
        borderColor: 'rgba(59,130,246,1)',
        borderWidth: 3,
        // use a scriptable backgroundColor to create a vertical gradient fill
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(59,130,246,0.15)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59,130,246,0.05)');
          gradient.addColorStop(0.5, 'rgba(59,130,246,0.12)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.25)');
          return gradient;
        },
        tension: 0.45,
        cubicInterpolationMode: 'monotone',
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: 'rgba(59,130,246,1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 8
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
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(15,23,42,0.05)' },
        ticks: {
          callback: function(value) {
            return '$' + Number(value).toLocaleString();
          },
          color: '#6b7280'
        }
      }
    }
  };

  return (
    <div className='bg-white rounded-lg p-4 shadow' style={{ height: 340 }}>
      <h3 className='text-lg font-medium mb-3'>Sales Analytics</h3>
      {loading ? (
        <div className='py-8 text-center'>Loading...</div>
      ) : (
        <div style={{ width: '100%', height: '100%' }}>
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default SalesChart;
