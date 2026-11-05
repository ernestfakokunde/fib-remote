import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Crown, Package } from 'lucide-react';
import { useGlobalContext } from '../context/context';
import { toast } from 'react-toastify';

const plans = [
  { name: 'Free', limit: '20 products', description: 'For getting started with essential inventory tracking.', perks: ['Up to 5 team members', 'Basic inventory access', 'Manual product entry'], price: 'Free' },
  { name: 'Pro', limit: '150 products', description: 'More room for a growing catalog and team.', perks: ['Up to 20 team members', '50 product snaps per day', 'Billed every 2 months'], price: '$3.50 for 2 months, then $5 every 2 months', featured: true },
  { name: 'Enterprise', limit: 'Unlimited products', description: 'Flexible capacity for larger operations.', perks: ['Unlimited team members', '50 product snaps per day', 'Billed every 2 months'], price: '$7 for 2 months, then $9 every 2 months' },
];

const Premium = () => {
  const { user, permissions, isSalesperson, initializeSubscription, verifySubscription, fetchUserProfile } = useGlobalContext();
  const [searchParams] = useSearchParams();
  const currentPlan = user?.subscriptionPlan || 'free';
  const currentCount = user?.currentProductCount ?? 0;
  const limit = user?.productLimit;
  const usagePercent = limit ? Math.min(100, Math.round((currentCount / limit) * 100)) : 0;

  useEffect(() => {
    if (searchParams.get('payment') !== 'complete') return;
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) return;
    verifySubscription(reference).then(async () => { await fetchUserProfile(); toast.success('Subscription activated.'); }).catch(() => {}).finally(() => window.history.replaceState({}, '', '/premium'));
  }, [fetchUserProfile, searchParams, verifySubscription]);

  const beginCheckout = async (plan) => {
    try {
      const { data } = await initializeSubscription(plan);
      if (data.alreadyPaid || !data.authorizationUrl) {
        if (data.reference && !data.alreadyPaid) { await verifySubscription(data.reference); await fetchUserProfile(); toast.success('Subscription activated.'); }
        return;
      }
      window.location.assign(data.authorizationUrl);
    } catch (error) { toast.error(error.response?.data?.message || 'Could not begin checkout.'); }
  };

  return <main className="w-full space-y-6 py-5 sm:py-7">
    <header className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Workspace plan</p><h1 className="app-page-title text-[var(--text)]">Plans & pricing</h1><p className="app-page-copy mt-1">Choose the right amount of room for your growing catalog.</p></div>
      <div className="flex items-center gap-3 rounded-lg bg-[var(--surface)] px-3 py-2.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]"><Crown size={17}/></span><div><p className="text-[10px] text-[var(--muted)]">Current plan</p><p className="text-xs font-semibold capitalize text-[var(--text)]">{currentPlan}</p></div></div>
    </header>

    <section className="app-card grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5" aria-label="Product usage">
      <div><div className="flex items-center justify-between gap-4"><div><h2 className="text-sm font-semibold text-[var(--text)]">Product usage</h2><p className="mt-1 text-xs text-[var(--muted)]">{currentCount} products {limit !== null && limit !== undefined ? `of ${limit}` : 'used'}</p></div><span className="text-xs font-semibold tabular-nums text-[var(--primary)]">{limit ? `${usagePercent}%` : 'No limit'}</span></div>{limit !== null && limit !== undefined && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]"><div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${usagePercent}%` }}/></div>}</div>
      <Link to="/products" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--surface)]"><Package size={14}/>{isSalesperson ? 'View products' : 'Manage products'}</Link>
    </section>

    <section className="grid gap-4 lg:grid-cols-3" aria-label="Available plans">
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.name.toLowerCase();
        return <article key={plan.name} className={`app-card flex min-w-0 flex-col p-4 sm:p-5 ${plan.featured ? 'pricing-card-featured' : ''}`}>
          <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[var(--text)]">{plan.name}</h2>{plan.featured && <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)]">Popular</span>}{isCurrent && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--success)]">Current plan</span>}</div>
          <p className="mt-3 min-h-10 text-xs leading-5 text-[var(--muted)]">{plan.description}</p>
          <p className="mt-4 border-t border-[var(--border)] pt-4 text-lg font-semibold leading-snug tracking-tight text-[var(--text)]">{plan.price}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{plan.limit}</p>
          <ul className="mt-4 flex-1 space-y-2.5">{plan.perks.map((perk) => <li key={perk} className="flex items-center gap-2 text-xs text-[var(--text)]"><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><Check size={10}/></span>{perk}</li>)}</ul>
          <div className="mt-5">{isCurrent ? <div className="flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--muted)]">Your active plan</div> : permissions.canManagePremium ? <button onClick={() => beginCheckout(plan.name.toLowerCase())} className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${plan.featured ? 'bg-[var(--primary)] text-white hover:brightness-105' : 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--surface)]'}`}>Choose {plan.name}<ArrowRight size={14}/></button> : <div className="flex min-h-9 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-center text-[11px] text-[var(--muted)]">Ask your manager to change the plan</div>}</div>
        </article>;
      })}
    </section>

    <p className="text-center text-[11px] text-[var(--muted)]">Paid plans renew every 60 days through Paystack. Introductory pricing applies to the first billing period.</p>
  </main>;
};

export default Premium;
