import React, { useEffect, useState } from 'react';
import SalesChart from '../components/SalesChart';
import ExpensesByCategory from '../components/ExpensesByCategory';
import MonthlyProfitChart from '../components/MonthlyProfitChart';
import { useGlobalContext } from '../context/context';
import { formatCurrency, formatNumber } from '../utils/format';

const SummaryCard = ({ title, value }) => (
  <div className="glass-panel rounded-[1.5rem] border border-white/10 p-5 shadow-xl">
    <div className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{title}</div>
    <div className="mt-3 text-2xl font-semibold text-[var(--text)]">{value}</div>
  </div>
);

const ProductListItem = ({ title, sub, value, tone = 'sky' }) => (
  <div className={`flex items-center justify-between rounded-[1.2rem] border p-4 ${
    tone === 'amber' ? 'border-amber-300/15 bg-amber-300/10' : 'border-sky-300/15 bg-sky-300/10'
  }`}>
    <div>
      <div className="font-semibold text-[var(--text)]">{title}</div>
      <div className="text-sm text-[var(--muted)]">{sub}</div>
    </div>
    <div className={`font-semibold ${tone === 'amber' ? 'text-amber-100' : 'text-sky-100'}`}>{value}</div>
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

      setSummary({
        totalRevenue,
        grossProfit,
        totalExpenses,
        netProfit: grossProfit - totalExpenses,
      });
      setBest(salesData.bestSellingProducts || []);
      setSlow(salesData.slowSellingProducts || []);
    } catch (err) {
      console.error('Failed to load report', err);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Reports Studio</p>
            <h1 className="mt-4 text-3xl font-semibold text-[var(--text)]">Revenue, profit and category flow at a glance.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Filter your reporting window, review sales momentum, and track where expenses are stacking up.
            </p>
          </div>
          <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition hover:opacity-90">
            Export Report
          </button>
        </div>
      </section>

      <section className="glass-panel rounded-[1.75rem] border border-white/10 p-4 shadow-xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-[var(--muted)]">Start Date</label>
            <input type="date" className="theme-input mt-2 w-full rounded-xl px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]">End Date</label>
            <input type="date" className="theme-input mt-2 w-full rounded-xl px-3 py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end justify-end">
            <button onClick={fetchReport} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-white/15">Apply</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title="Gross Profit" value={formatCurrency(summary.grossProfit)} />
        <SummaryCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} />
        <SummaryCard title="Net Profit" value={formatCurrency(summary.netProfit)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <SalesChart startDate={startDate} endDate={endDate} />
        </div>
        <div className="min-w-0 space-y-4">
          <ExpensesByCategory startDate={startDate} endDate={endDate} />
          <MonthlyProfitChart months={6} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-[1.75rem] border border-white/10 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-medium text-[var(--text)]">Best-Selling Products</h3>
          {best.length === 0 ? <div className="text-sm text-[var(--muted)]">No data</div> : (
            <div className="space-y-3">
              {best.map((item) => (
                <ProductListItem key={item.productId} title={item.name || 'Unknown'} sub={`${formatNumber(item.quantitySold || 0)} units sold`} value={formatCurrency(item.revenue || 0)} />
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-[1.75rem] border border-white/10 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-medium text-[var(--text)]">Slow-Selling Products</h3>
          {slow.length === 0 ? <div className="text-sm text-[var(--muted)]">No data</div> : (
            <div className="space-y-3">
              {slow.map((item) => (
                <ProductListItem key={item.productId} title={item.name || 'Unknown'} sub={`Stock: ${formatNumber(item.product?.quantity || 0)} units`} value={`${formatNumber(item.quantitySold || 0)} sold`} tone="amber" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
