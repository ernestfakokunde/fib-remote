import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Crown, Package, Sparkles, Star } from 'lucide-react';
import { useGlobalContext } from '../context/context';

const plans = [
  {
    name: 'Free',
    limit: '20 products',
    description: 'Good for getting started with lightweight inventory tracking.',
    perks: ['Basic inventory access', 'Product cap for small shops', 'Manual growth path'],
  },
  {
    name: 'Pro',
    limit: '100 products',
    description: 'Built for growing teams that need more catalog room and fewer limits.',
    perks: ['Expanded product capacity', 'Better room for scaling', 'Upgrade-friendly workflow'],
    featured: true,
  },
  {
    name: 'Enterprise',
    limit: 'Unlimited products',
    description: 'For bigger operations that want breathing room and no practical ceiling.',
    perks: ['Unlimited product slots', 'Best fit for large inventory', 'Flexible long-term growth'],
  },
];

const Premium = () => {
  const { user, permissions, isSalesperson } = useGlobalContext();

  const currentPlan = user?.subscriptionPlan || 'free';
  const currentCount = user?.currentProductCount ?? 0;
  const limit = user?.productLimit;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_35%)]" />
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Premium Access</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[var(--text)]">
              Unlock more product space with a sharper upgrade path.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Your current plan is <span className="font-medium text-[var(--text)]">{currentPlan}</span>.
              You are using <span className="font-medium text-[var(--text)]">{currentCount}</span> product slots
              {limit !== null && limit !== undefined ? (
                <>
                  {' '}out of <span className="font-medium text-[var(--text)]">{limit}</span>.
                </>
              ) : (
                '.'
              )}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition hover:opacity-90"
              >
                <Package size={16} />
                {isSalesperson ? 'View Products' : 'Manage Products'}
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-[var(--text)] backdrop-blur-xl transition hover:bg-white/15"
              >
                <Crown size={16} />
                Back to Profile
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-sky-300/20 bg-white/10 p-5 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text)]">Upgrade Snapshot</p>
              <Sparkles className="text-cyan-300" size={18} />
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Current plan</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text)] capitalize">{currentPlan}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Best next move</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  If your catalog is growing fast, Pro gives you more room immediately. If you are building
                  for scale without worrying about limits, Enterprise is the cleanest long-term path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.name.toLowerCase();

          return (
            <article
              key={plan.name}
              className={`rounded-[1.9rem] border p-6 backdrop-blur-2xl ${
                plan.featured
                  ? 'glass-panel border-cyan-300/25 bg-cyan-200/10 shadow-2xl shadow-cyan-500/10'
                  : 'glass-panel border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{plan.name} Plan</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--text)]">{plan.limit}</h2>
                </div>
                {plan.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-medium text-cyan-100">
                    <Star size={12} />
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>

              <div className="mt-5 space-y-3">
                {plan.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-3 text-sm text-[var(--text)]">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
                      <Check size={12} />
                    </span>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-[var(--text)]">
                    You are currently on this plan
                  </div>
                ) : (
                  permissions.canManagePremium ? (
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition hover:opacity-90">
                      Choose {plan.name}
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-[var(--text)]">
                      View only. Ask your manager to upgrade this workspace.
                    </div>
                  )
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%,rgba(34,211,238,0.1))]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Ready To Upgrade</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">
              Let your catalog grow without friction.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Start with a clean premium CTA now, then connect this button to your billing or manager plan-change
              flow when you are ready.
            </p>
          </div>

          {permissions.canManagePremium ? (
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-6 py-3 text-sm font-medium text-cyan-50 shadow-xl backdrop-blur-xl transition hover:bg-cyan-300/20">
              <Sparkles size={16} />
              Contact Sales / Upgrade
            </button>
          ) : (
            <div className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm text-[var(--text)]">
              Premium is view-only for salesperson accounts.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Premium;
