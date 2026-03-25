import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Mail, Package, Settings, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useGlobalContext } from '../context/context';

const formatLimit = (limit) => {
  if (limit === null || limit === undefined) return 'Unlimited';
  if (!Number.isFinite(limit)) return 'Unlimited';
  return `${limit}`;
};

const Profile = () => {
  const { user, permissions, isSalesperson } = useGlobalContext();

  const planLabel = user?.subscriptionPlan
    ? `${user.subscriptionPlan.charAt(0).toUpperCase()}${user.subscriptionPlan.slice(1)}`
    : 'Free';
  const currentCount = user?.currentProductCount ?? 0;
  const productLimit = user?.productLimit ?? 20;
  const remainingProducts = user?.remainingProducts;
  const canCreateProduct = user?.canCreateProduct ?? true;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_38%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-[var(--text)] shadow-lg backdrop-blur-xl">
              <UserRound size={34} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Account Profile</p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--text)]">
                {user?.username || 'Spectra User'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  <Mail size={14} />
                  {user?.email || 'No email available'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1.5 text-amber-100">
                  <Crown size={14} />
                  {planLabel} Plan
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition hover:opacity-90"
            >
              <Sparkles size={16} />
              {permissions.canManagePremium ? 'Upgrade Plan' : 'View Plans'}
            </Link>
            {permissions.canAccessSettings ? (
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-[var(--text)] backdrop-blur-xl transition hover:bg-white/15"
              >
                <Settings size={16} />
                Edit Settings
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="glass-panel rounded-[1.75rem] border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Current Plan</p>
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[var(--text)]">{planLabel}</h2>
            <Crown className="text-amber-300" size={22} />
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Your inventory capacity and upgrade options follow this plan.
          </p>
        </article>

        <article className="glass-panel rounded-[1.75rem] border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Products Used</p>
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[var(--text)]">{currentCount}</h2>
            <Package className="text-sky-300" size={22} />
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Limit: {formatLimit(productLimit)} products
          </p>
        </article>

        <article className="glass-panel rounded-[1.75rem] border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Availability</p>
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[var(--text)]">
              {remainingProducts ?? 'Unlimited'}
            </h2>
            <ShieldCheck className={canCreateProduct ? 'text-emerald-300' : 'text-rose-300'} size={22} />
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {canCreateProduct
              ? 'You can still create new products with your current access.'
              : 'You have reached your current plan limit. Upgrade to continue adding products.'}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel rounded-[2rem] border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Workspace Snapshot</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Product Capacity</span>
                <span className="font-medium text-[var(--text)]">
                  {currentCount} / {formatLimit(productLimit)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
                  style={{
                    width:
                      productLimit && Number.isFinite(productLimit)
                        ? `${Math.min((currentCount / productLimit) * 100, 100)}%`
                        : '38%',
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-[var(--text)]">What this page is for</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {isSalesperson
                  ? 'Your salesperson sub-account works inside the admin workspace. You can record sales, update stock-in, and view products while restricted areas stay locked.'
                  : 'Use your profile page as the account overview: who the user is, which plan they are on, how much product capacity they have used, and where to go next when they want more room.'}
              </p>
            </div>
          </div>
        </article>

        <aside className="glass-panel rounded-[2rem] border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Quick Actions</p>
          <div className="mt-5 space-y-3">
            <Link
              to="/products"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-[var(--text)] transition hover:bg-white/10"
            >
              <span>Manage products</span>
              <Package size={16} />
            </Link>
            <Link
              to="/premium"
              className="flex items-center justify-between rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-4 text-sm text-sky-50 transition hover:bg-sky-300/15"
            >
              <span>See premium options</span>
              <Sparkles size={16} />
            </Link>
            {permissions.canAccessSettings ? (
              <Link
                to="/settings"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-[var(--text)] transition hover:bg-white/10"
              >
                <span>Update account settings</span>
                <Settings size={16} />
              </Link>
            ) : null}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Profile;
