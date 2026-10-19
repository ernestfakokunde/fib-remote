import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../utils/format';

export default function ProfitChartView({ labels = [], profits = [] }) {
  const data = labels.map((label, index) => ({ month: label, profit: Number.isFinite(Number(profits[index])) ? Number(profits[index]) : 0 }));
  return <div className="min-w-0 flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}><CartesianGrid stroke="var(--border)" strokeDasharray="2 5" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} minTickGap={14} tick={{ fill: 'var(--muted)', fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} width={58} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickFormatter={(value) => new Intl.NumberFormat('en-NG',{notation:'compact',maximumFractionDigits:1}).format(value)}/><Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 10, color: 'var(--text)', boxShadow: 'var(--shadow)' }} formatter={(value)=>[formatCurrency(value),'Profit']}/><Line type="monotone" dataKey="profit" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}/></LineChart></ResponsiveContainer></div>;
}
