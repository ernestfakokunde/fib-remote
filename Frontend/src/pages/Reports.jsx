import React, { useCallback, useEffect, useState } from 'react';
import { FileText, FileSpreadsheet, CalendarRange, TrendingUp } from 'lucide-react';
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

const SummaryCard = ({ title, value, note, tone = 'default' }) => (
  <div className="app-card min-w-0 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2"><div className="text-xs font-medium text-[var(--muted)]">{title}</div>{tone === 'positive' && <TrendingUp size={14} className="text-[var(--success)]"/>}</div>
    <div className="money-value mt-2 truncate text-lg font-semibold text-[var(--text)] sm:text-xl">{value}</div>
    {note && <p className="mt-1 text-[10px] text-[var(--muted)]">{note}</p>}
  </div>
);

const buildReportPeriods = (trend, range) => {
  const parseDate = (value) => new Date(`${value}T00:00:00Z`);
  const start = parseDate(range.start);
  const end = parseDate(range.end);
  const dayCount = Math.max(1, Math.floor((end - start) / 86400000) + 1);
  const byDate = new Map((Array.isArray(trend) ? trend : []).map((item) => [String(item._id).slice(0, 10), item]));

  if (dayCount <= 45) {
    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const item = byDate.get(key) || {};
      return { key, label: date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', timeZone: 'UTC' }), revenue: finiteNumber(item.revenue), profit: finiteNumber(item.profit), transactions: finiteNumber(item.transactions) };
    });
  }

  const startMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const buckets = new Map();
  (Array.isArray(trend) ? trend : []).forEach((item) => {
    const date = new Date(`${String(item._id).slice(0, 10)}T00:00:00Z`);
    const key = date.toISOString().slice(0, 7);
    const bucket = buckets.get(key) || { revenue: 0, profit: 0, transactions: 0 };
    bucket.revenue += finiteNumber(item.revenue);
    bucket.profit += finiteNumber(item.profit);
    bucket.transactions += finiteNumber(item.transactions);
    buckets.set(key, bucket);
  });
  const periods = [];
  for (const date = new Date(startMonth); date <= endMonth; date.setUTCMonth(date.getUTCMonth() + 1)) {
    const key = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-NG', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    periods.push({ key, label, ...(buckets.get(key) || { revenue: 0, profit: 0, transactions: 0 }) });
  }
  return periods;
};

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
  const [summary, setSummary] = useState({ totalRevenue: 0, totalCost: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0, totalTransactions: 0, profitMargin: 0 });
  const [periodRows, setPeriodRows] = useState([]);
  const [best, setBest] = useState([]);
  const [slow, setSlow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeError, setRangeError] = useState('');
  const [reportError, setReportError] = useState('');

  const fetchReport = useCallback(async (range) => {
    setLoading(true);
    setReportError('');
    try {
      const params = { start: localDateBoundary(range.start), end: localDateBoundary(range.end, true), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
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

      const totalTransactions = finiteNumber(salesData.totalTransactions);
      const profitMargin = Number.isFinite(Number(salesData.profitMargin)) ? Number(salesData.profitMargin) : totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
      setSummary({ totalRevenue, totalCost, grossProfit, totalExpenses, netProfit, totalTransactions, profitMargin });
      setPeriodRows(buildReportPeriods(salesData.trend, range));
      setBest(Array.isArray(salesData.bestSellingProducts) ? salesData.bestSellingProducts : []);
      setSlow(Array.isArray(salesData.slowSellingProducts) ? salesData.slowSellingProducts : []);
    } catch (error) {
      console.error('Failed to load report', error);
      setReportError(error.response?.data?.message || 'Could not load this report. Check your connection and try again.');
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

  const buildExportRows = () => {
    const range = appliedRange;
    return [
      ['Period', 'Start date', range.start],
      ['Period', 'End date', range.end],
      ['Summary', 'Total revenue (NGN)', summary.totalRevenue.toFixed(2)],
      ['Summary', 'Total cost of goods (NGN)', summary.totalCost.toFixed(2)],
      ['Summary', 'Gross profit (NGN)', summary.grossProfit.toFixed(2)],
      ['Summary', 'Expenses (NGN)', summary.totalExpenses.toFixed(2)],
      ['Summary', 'Net profit (NGN)', summary.netProfit.toFixed(2)],
      ['Summary', 'Profit margin (%)', summary.profitMargin.toFixed(1)],
      ['Summary', 'Sales transactions', String(summary.totalTransactions)],
      ...periodRows.map((item) => ['Period breakdown', item.label, `${item.transactions} sales; NGN ${item.revenue.toFixed(2)} revenue; NGN ${(item.revenue - item.profit).toFixed(2)} cost; NGN ${item.profit.toFixed(2)} profit`]),
      ...best.map((item) => ['Best-selling products', item.name || 'Unknown', `${finiteNumber(item.quantitySold)} units; NGN ${finiteNumber(item.revenue).toFixed(2)}`]),
      ...slow.map((item) => ['Slow-selling products', item.name || 'Unknown', `${finiteNumber(item.quantitySold)} units sold`]),
    ];
  };

  const exportCsv = () => downloadCsv('spectra-report.csv', ['Section', 'Metric', 'Value'], buildExportRows());
  const exportPdf = () => {
    const rows = buildExportRows();
    const reportRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</td>`).join('')}</tr>`).join('');
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Spectra report</title><style>body{font:14px Arial,sans-serif;color:#172033;margin:40px}h1{margin-bottom:4px}p{color:#64748b;margin-top:0}table{border-collapse:collapse;width:100%;margin-top:28px}th,td{border:1px solid #dbe2ea;padding:9px;text-align:left}th{background:#f1f5f9}tr:nth-child(even){background:#f8fafc}</style></head><body><h1>Spectra Inventory Report</h1><p>${appliedRange.start} — ${appliedRange.end} · Generated ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Section</th><th>Metric</th><th>Value</th></tr></thead><tbody>${reportRows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  const selectedRange = appliedRange;

  return (
    <main className="w-full space-y-5 py-5 sm:py-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Finance · Report</p>
          <h1 className="app-page-title text-[var(--text)]">Reports</h1>
          <p className="app-page-copy mt-1">A complete business performance report for the period you choose.</p>
        </div>
        <div className="flex flex-wrap gap-2"><button onClick={exportCsv} disabled={loading} className="mobile-action inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"><FileSpreadsheet size={14} /> Export CSV</button><button onClick={exportPdf} disabled={loading} className="mobile-action inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--primary)] disabled:opacity-50 sm:w-auto"><FileText size={14} /> Save / print PDF</button></div>
      </header>

      <section className="app-card p-4 sm:p-5" aria-label="Report date range">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--text)]"><CalendarRange size={15} className="text-[var(--primary)]"/>Report period<span className="ml-auto font-normal text-[var(--muted)]">{appliedRange.start} to {appliedRange.end}</span></div>
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="report-start" className="text-xs font-medium text-[var(--muted)]">From</label>
            <input id="report-start" type="date" className="theme-input app-control mt-1.5 px-3 text-xs" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div>
            <label htmlFor="report-end" className="text-xs font-medium text-[var(--muted)]">To</label>
            <input id="report-end" type="date" className="theme-input app-control mt-1.5 px-3 text-xs" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <button onClick={applyRange} disabled={loading} className="mobile-action app-control rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-white transition hover:brightness-105 disabled:opacity-50 sm:w-auto">
            {loading ? 'Updating…' : 'Run report'}
          </button>
        </div>
        {rangeError && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{rangeError}</p>}
      </section>

      {reportError && <div role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-[var(--danger)]">{reportError}</div>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-label="Report summary">
        <SummaryCard title="Revenue" value={formatCurrency(summary.totalRevenue)} note="Sales income" />
        <SummaryCard title="Cost of goods" value={formatCurrency(summary.totalCost)} note="Product cost" />
        <SummaryCard title="Gross profit" value={formatCurrency(summary.grossProfit)} note="Revenue less product cost" />
        <SummaryCard title="Expenses" value={formatCurrency(summary.totalExpenses)} note="Operating costs" />
        <SummaryCard title="Net profit" value={formatCurrency(summary.netProfit)} note="After expenses" tone="positive" />
        <SummaryCard title="Profit margin" value={`${summary.profitMargin.toFixed(1)}%`} note={`${formatNumber(summary.totalTransactions)} sales`} />
      </section>

      <SalesChart rows={periodRows} loading={loading}/>

      <section className="app-card overflow-hidden" aria-label="Period report breakdown">
        <div className="flex flex-col gap-1 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-semibold text-[var(--text)]">Period breakdown</h2><p className="mt-0.5 text-[11px] text-[var(--muted)]">{periodRows.length > 45 ? 'Monthly totals' : 'Daily totals'} for the selected report</p></div><span className="text-[10px] text-[var(--muted)]">{summary.totalTransactions} sales · {appliedRange.start} to {appliedRange.end}</span></div>
        {loading ? <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">Preparing report…</p> : <div className="overflow-x-auto"><table className="app-table min-w-[680px]"><thead><tr><th>Period</th><th>Sales</th><th>Revenue</th><th>Cost of goods</th><th>Gross profit</th><th>Margin</th></tr></thead><tbody>{periodRows.map((item) => { const cost = item.revenue - item.profit; const margin = item.revenue ? (item.profit / item.revenue) * 100 : 0; return <tr key={item.key}><td className="font-medium text-[var(--text)]">{item.label}</td><td className="tabular-nums">{formatNumber(item.transactions)}</td><td className="money-value whitespace-nowrap">{formatCurrency(item.revenue)}</td><td className="money-value whitespace-nowrap text-[var(--muted)]">{formatCurrency(cost)}</td><td className={`money-value whitespace-nowrap font-medium ${item.profit < 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{formatCurrency(item.profit)}</td><td className="tabular-nums">{margin.toFixed(1)}%</td></tr>; })}</tbody></table></div>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[11px] sm:px-5"><span className="text-[var(--muted)]">Total revenue <strong className="ml-1 font-semibold text-[var(--text)]">{formatCurrency(summary.totalRevenue)}</strong></span><span className="text-[var(--muted)]">Gross profit <strong className="ml-1 font-semibold text-[var(--success)]">{formatCurrency(summary.grossProfit)}</strong></span><span className="text-[var(--muted)]">Net profit <strong className="ml-1 font-semibold text-[var(--primary)]">{formatCurrency(summary.netProfit)}</strong></span></div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Additional report analysis">
        <ExpensesByCategory startDate={localDateBoundary(selectedRange.start)} endDate={localDateBoundary(selectedRange.end, true)} />
        <MonthlyProfitChart months={6} />
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
