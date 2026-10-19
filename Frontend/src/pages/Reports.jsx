import React, { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import SalesChart from '../components/SalesChart';
import ExpensesByCategory from '../components/ExpensesByCategory';
import MonthlyProfitChart from '../components/MonthlyProfitChart';
import { useGlobalContext } from '../context/context';
import { formatCurrency, formatNumber, localDateBoundary, localDateString } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const finiteNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const resolveReportRange = (start, end) => {
  const effectiveEnd = end || localDateString();
  const endDate = new Date(`${effectiveEnd}T00:00:00`);
  const effectiveStart = start || localDateString(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6));
  return { start: effectiveStart, end: effectiveEnd };
};

const SummaryCard = ({ title, value }) => (
  <div className="app-card min-w-0 p-4 sm:p-5">
    <div className="text-xs font-medium text-[var(--muted)]">{title}</div>
    <div className="money-value mt-3 truncate text-xl font-semibold text-[var(--text)] sm:text-2xl">{value}</div>
  </div>
);

const ProductListItem = ({ title, sub, value, tone = 'default' }) => (
  <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-4 ${tone === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-[var(--text)]">{title}</div>
      <div className="mt-0.5 text-xs text-[var(--muted)]">{sub}</div>
    </div>
    <div className={`shrink-0 text-sm font-semibold tabular-nums ${tone === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--text)]'}`}>{value}</div>
  </div>
);

const Reports = () => {
  const { getReports, getExpensesSummary } = useGlobalContext();
  const [initialRange] = useState(() => resolveReportRange('', ''));
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [summary, setSummary] = useState({ totalRevenue: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0 });
  const [best, setBest] = useState([]);
  const [slow, setSlow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeError, setRangeError] = useState('');

  const fetchReport = useCallback(async (range) => {
    setLoading(true);
    try {
      const params = { start: localDateBoundary(range.start), end: localDateBoundary(range.end, true) };
      const [reportRes, expenseRes] = await Promise.all([
        getReports(params),
        getExpensesSummary(params),
      ]);
      const salesData = reportRes.data?.data || reportRes.data || {};
      const expenseData = expenseRes.data || {};
      const totalRevenue = finiteNumber(salesData.totalRevenue);
      const totalCost = finiteNumber(salesData.totalCost);
      const grossProfit = Number.isFinite(Number(salesData.grossProfit))
        ? Number(salesData.grossProfit)
        : totalRevenue - totalCost;
      const totalExpenses = finiteNumber(expenseData.totalExpenses);
      const netProfit = Math.round((grossProfit - totalExpenses + Number.EPSILON) * 100) / 100;

      setSummary({ totalRevenue, grossProfit, totalExpenses, netProfit });
      setBest(Array.isArray(salesData.bestSellingProducts) ? salesData.bestSellingProducts : []);
      setSlow(Array.isArray(salesData.slowSellingProducts) ? salesData.slowSellingProducts : []);
    } catch (error) {
      console.error('Failed to load report', error);
    } finally {
      setLoading(false);
    }
  }, [getExpensesSummary, getReports]);

  useEffect(() => {
    fetchReport(appliedRange);
  }, [appliedRange, fetchReport]);

  const applyRange = () => {
    const range = resolveReportRange(startDate, endDate);
    if (range.start > range.end) {
      setRangeError('Start date must be on or before end date.');
      return;
    }
    setRangeError('');
    setAppliedRange(range);
  };

  const exportReport = () => {
    const range = appliedRange;
    downloadCsv('spectra-report.csv', ['Section', 'Metric', 'Value'], [
      ['Period', 'Start date', range.start],
      ['Period', 'End date', range.end],
      ['Summary', 'Total revenue (NGN)', summary.totalRevenue.toFixed(2)],
      ['Summary', 'Gross profit (NGN)', summary.grossProfit.toFixed(2)],
      ['Summary', 'Expenses (NGN)', summary.totalExpenses.toFixed(2)],
      ['Summary', 'Net profit (NGN)', summary.netProfit.toFixed(2)],
      ...best.map((item) => ['Best-selling products', item.name || 'Unknown', `${finiteNumber(item.quantitySold)} units; NGN ${finiteNumber(item.revenue).toFixed(2)}`]),
      ...slow.map((item) => ['Slow-selling products', item.name || 'Unknown', `${finiteNumber(item.quantitySold)} units sold`]),
    ]);
  };

  const selectedRange = appliedRange;

  return (
    <main className="w-full space-y-5 py-5 sm:py-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Finance</p>
          <h1 className="app-page-title text-[var(--text)]">Reports</h1>
          <p className="app-page-copy mt-2">A clear view of revenue, gross profit, and expenses for your selected period.</p>
        </div>
        <button onClick={exportReport} disabled={loading} className="mobile-action inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto">
          <Download size={16} /> Export CSV
        </button>
      </header>

      <section className="app-card p-4 sm:p-5" aria-label="Report date range">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="report-start" className="text-xs font-medium text-[var(--muted)]">From</label>
            <input id="report-start" type="date" className="theme-input app-control mt-1.5 px-3 py-2 text-sm" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div>
            <label htmlFor="report-end" className="text-xs font-medium text-[var(--muted)]">To</label>
            <input id="report-end" type="date" className="theme-input app-control mt-1.5 px-3 py-2 text-sm" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <button onClick={applyRange} disabled={loading} className="mobile-action app-control border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)] disabled:opacity-50 sm:w-auto">
            {loading ? 'Updating…' : 'Apply range'}
          </button>
        </div>
        {rangeError && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{rangeError}</p>}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Financial summary">
        <SummaryCard title="Total revenue" value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title="Gross profit" value={formatCurrency(summary.grossProfit)} />
        <SummaryCard title="Total expenses" value={formatCurrency(summary.totalExpenses)} />
        <SummaryCard title="Net profit" value={formatCurrency(summary.netProfit)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Financial trends">
        <div className="min-w-0 xl:col-span-2"><SalesChart startDate={localDateBoundary(selectedRange.start)} endDate={localDateBoundary(selectedRange.end, true)} /></div>
        <div className="min-w-0 space-y-4">
          <ExpensesByCategory startDate={localDateBoundary(selectedRange.start)} endDate={localDateBoundary(selectedRange.end, true)} />
          <MonthlyProfitChart months={6} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="app-card min-w-0 p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--text)]">Best-selling products</h2>
          {best.length === 0 ? <p className="text-sm text-[var(--muted)]">No sales in this period.</p> : <div className="space-y-2">{best.map((item) => <ProductListItem key={item.productId} title={item.name || 'Unknown'} sub={`${formatNumber(item.quantitySold)} units sold`} value={formatCurrency(item.revenue)} />)}</div>}
        </div>
        <div className="app-card min-w-0 p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--text)]">Slow-selling products</h2>
          {slow.length === 0 ? <p className="text-sm text-[var(--muted)]">No sales in this period.</p> : <div className="space-y-2">{slow.map((item) => <ProductListItem key={item.productId} title={item.name || 'Unknown'} sub={`${formatNumber(item.product?.quantity || 0)} units in stock`} value={`${formatNumber(item.quantitySold)} sold`} tone="warning" />)}</div>}
        </div>
      </section>
    </main>
  );
};

export default Reports;
