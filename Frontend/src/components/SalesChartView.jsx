import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../utils/format';

const compactCurrency = (value) => new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function SalesChartView({ rows = [] }) {
  const point = rows.length === 1 ? { r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 } : false;
  return <div className="min-h-0 min-w-0 flex-1 pt-2"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 4, bottom: 0, left: -14 }}>
    <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false}/>
    <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={20} tick={{ fill: 'var(--muted)', fontSize: 10 }}/>
    <YAxis yAxisId="revenue" axisLine={false} tickLine={false} width={52} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={compactCurrency}/>
    <YAxis yAxisId="profit" orientation="right" axisLine={false} tickLine={false} width={48} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={compactCurrency}/>
    <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 9, color: 'var(--text)', boxShadow: 'var(--shadow)', fontSize: 12 }} labelStyle={{ color: 'var(--muted)', marginBottom: 4 }} formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Gross profit']}/>
    <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="revenue" stroke="var(--primary)" strokeWidth={2.5} dot={point} activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }} connectNulls/>
    <Line yAxisId="profit" type="monotone" dataKey="profit" name="profit" stroke="var(--chart-secondary)" strokeWidth={2.5} dot={rows.length === 1 ? { ...point, fill: 'var(--chart-secondary)' } : false} activeDot={{ r: 4, fill: 'var(--chart-secondary)', stroke: 'var(--card)', strokeWidth: 2 }} connectNulls/>
  </LineChart></ResponsiveContainer></div>;
}
