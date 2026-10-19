import React, { useCallback, useEffect, useState } from 'react';
import { useGlobalContext } from '../context/context';
import { Card, EmptyState, Skeleton } from './ui';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

const ExpensesByCategory = ({ startDate, endDate }) => {
  const { getExpensesSummary } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const fetchData = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const res = await getExpensesSummary(params);
      setItems(Array.isArray(res.data?.byCategory) ? res.data.byCategory : []);
    } catch (err) {
      console.error('Failed to load expenses for chart', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endDate, getExpensesSummary, startDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maximum = Math.max(...items.map((item) => Number.isFinite(Number(item.total)) ? Number(item.total) : 0), 0);

  return (
    <Card className="flex h-[250px] min-w-0 flex-col overflow-hidden p-4 sm:h-[280px] sm:p-5">
      <h3 className="mb-3 text-sm font-semibold">Expenses by category</h3>
      {loading ? (
        <Skeleton className="h-full min-h-48 w-full"/>
      ) : !items.length ? (
        <EmptyState title="Your expense breakdown will appear here" description="Record a business expense to see where your spending goes." action={<Link to="/expenses" className="mt-3 text-xs font-semibold text-[var(--primary)]">Add an expense</Link>}/>
      ) : (
        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {items.map((item) => {
            const total = Number.isFinite(Number(item.total)) ? Number(item.total) : 0;
            const share = maximum > 0 ? (total / maximum) * 100 : 0;
            return <div key={item.categoryId || item.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-[var(--text)]">{item.name}</span>
                <span className="shrink-0 tabular-nums text-[var(--muted)]">{formatCurrency(total)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${share}%` }} /></div>
            </div>;
          })}
        </div>
      )}
    </Card>
  );
};

export default ExpensesByCategory;
