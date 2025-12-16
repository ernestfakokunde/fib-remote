import React, { useState, useEffect } from 'react';
import SalesChart from '../components/SalesChart';
import ExpensesByCategory from '../components/ExpensesByCategory';
import MonthlyProfitChart from '../components/MonthlyProfitChart';
import { useGlobalContext } from '../context/context';
import { formatCurrency, formatNumber } from '../utils/format';

const SummaryCard = ({ title, value }) => (
  <div className='bg-white p-4 rounded-lg shadow-sm'>
    <div className='text-sm text-gray-600'>{title}</div>
    <div className='text-xl font-semibold mt-2'>{value}</div>
  </div>
);

const ProductListItem = ({ title, sub, value }) => (
  <div className='bg-green-50 p-4 rounded-md mb-3 flex items-center justify-between'>
    <div>
      <div className='font-semibold'>{title}</div>
      <div className='text-sm text-gray-500'>{sub}</div>
    </div>
    <div className='text-green-700 font-semibold'>{value}</div>
  </div>
);

const Reports = () => {
  const { getReports, getExpensesSummary } = useGlobalContext();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ totalRevenue: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0 });
  const [best, setBest] = useState([]);
  const [slow, setSlow] = useState([]);

  const fetchReport = async () => {
    try {
      const reportParams = {};
      if (startDate) reportParams.start = startDate;
      if (endDate) reportParams.end = endDate;

      const expenseParams = {};
      if (startDate) expenseParams.start = startDate;
      if (endDate) expenseParams.end = endDate;

      const [reportRes, expenseRes] = await Promise.all([
        getReports(reportParams),
        getExpensesSummary(expenseParams),
      ]);

      const salesData = reportRes.data?.data || reportRes.data || {};
      const expenseData = expenseRes.data || {};

      const totalRevenue = Number(
        salesData.totalRevenue || salesData.totalRevenue === 0 ? salesData.totalRevenue : 0
      );
      const totalCost = Number(salesData.totalCost || 0);
      const grossProfit = Number(
        salesData.grossProfit || salesData.grossProfit === 0 ? salesData.grossProfit : totalRevenue - totalCost
      );
      const totalExpenses = Number(expenseData.totalExpenses || 0);
      const netProfit = grossProfit - totalExpenses;

      setSummary({
        totalRevenue,
        grossProfit,
        totalExpenses,
        netProfit,
      });

      setBest(salesData.bestSellingProducts || []);
      setSlow(salesData.slowSellingProducts || []);
    } catch (err) {
      console.error('Failed to load report', err);
    }
  };

  useEffect(() => { fetchReport(); }, [startDate, endDate]);

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold'>Reports</h1>
        <div className='flex gap-2'>
          <button className='bg-black text-white px-4 py-2 rounded-full'>Export Report</button>
        </div>
      </div>

      <div className='bg-white rounded-lg p-4 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='text-sm text-gray-500'>Start Date</label>
            <input type='date' className='w-full px-3 py-2 border rounded' value={startDate} onChange={(e)=> setStartDate(e.target.value)} />
          </div>
          <div>
            <label className='text-sm text-gray-500'>End Date</label>
            <input type='date' className='w-full px-3 py-2 border rounded' value={endDate} onChange={(e)=> setEndDate(e.target.value)} />
          </div>
          <div className='flex items-end justify-end'>
            <button onClick={fetchReport} className='px-4 py-2 bg-blue-600 text-white rounded-full'>Apply</button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <SummaryCard title='Total Revenue' value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title='Gross Profit' value={formatCurrency(summary.grossProfit)} />
        <SummaryCard title='Total Expenses' value={formatCurrency(summary.totalExpenses)} />
        <SummaryCard title='Net Profit' value={formatCurrency(summary.netProfit)} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2'>
          <SalesChart startDate={startDate} endDate={endDate} />
        </div>
        <div className='space-y-4'>
          <ExpensesByCategory startDate={startDate} endDate={endDate} />
          <MonthlyProfitChart months={6} />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
        <div className='bg-white rounded-lg p-6 shadow'>
          <h3 className='text-lg font-medium mb-4'>Best-Selling Products</h3>
          {best.length === 0 ? <div className='text-sm text-gray-500'>No data</div> : (
            best.map(item => (
              <ProductListItem key={item.productId} title={item.name || 'Unknown'} sub={`${formatNumber(item.quantitySold || 0)} units sold`} value={formatCurrency(item.revenue || 0)} />
            ))
          )}
        </div>

        <div className='bg-white rounded-lg p-6 shadow'>
          <h3 className='text-lg font-medium mb-4'>Slow-Selling Products</h3>
          {slow.length === 0 ? <div className='text-sm text-gray-500'>No data</div> : (
            slow.map(item => (
              <ProductListItem key={item.productId} title={item.name || 'Unknown'} sub={`Stock: ${formatNumber(item.product?.quantity || 0)} units`} value={`${formatNumber(item.quantitySold || 0)} sold`} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;