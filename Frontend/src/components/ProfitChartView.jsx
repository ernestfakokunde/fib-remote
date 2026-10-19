import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ProfitChartView({ labels = [], profits = [] }) {
  const data = labels.map((label, index) => ({ month: label, profit: Number(profits[index] || 0) }));
  return <div className="min-w-0 flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} width={55} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickFormatter={(value) => new Intl.NumberFormat(undefined,{notation:'compact'}).format(value)}/><Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 10, color: 'var(--text)' }} formatter={(value)=>[`₦${Number(value).toLocaleString()}`,'Profit']}/><Bar dataKey="profit" fill="var(--primary)" radius={[4,4,0,0]} maxBarSize={42}/></BarChart></ResponsiveContainer></div>;
}
