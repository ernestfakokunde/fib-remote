import { ArrowUpRight, BarChart3, Boxes, Check, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function AuthShell({ title, subtitle, children, footer }) {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] lg:grid lg:grid-cols-[minmax(360px,.9fr)_1.1fr]">
    <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#10182b] px-10 py-9 text-white lg:flex xl:px-16">
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full border border-white/10"/><div className="pointer-events-none absolute -right-24 top-[32%] h-[22rem] w-[22rem] rounded-full border border-white/10"/><div className="pointer-events-none absolute -right-8 top-[39%] h-[16rem] w-[16rem] rounded-full border border-white/10"/>
      <Link to="/welcome" aria-label="Spectra Inventory home" className="relative text-white"><BrandLogo markClassName="h-10 w-10" wordmarkClassName="text-base" /></Link>
      <div className="relative max-w-xl py-14"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"><ShieldCheck size={14} className="text-[#9eaeff]"/>A clearer view of your business</div><h1 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">Good decisions start with knowing your numbers.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/60">Bring stock, sales, and business performance into one focused workspace.</p>
        <div className="mt-10 grid max-w-md grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center gap-2 text-xs text-white/55"><Boxes size={14}/> Inventory</div><p className="mt-3 text-sm font-medium">Know what is in stock</p></div><div className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center gap-2 text-xs text-white/55"><BarChart3 size={14}/> Performance</div><p className="mt-3 text-sm font-medium">Track sales and profit</p></div></div>
        <div className="mt-8 flex items-center gap-2 text-xs text-white/55"><Check size={14} className="text-[#9eaeff]"/>Made for the people running the business</div>
      </div>
      <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Spectra Inventory</p>
    </aside>
    <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-10 xl:px-16">
      <header className="flex items-center justify-between lg:justify-end"><Link to="/welcome" aria-label="Spectra Inventory home" className="text-[var(--text)] lg:hidden"><BrandLogo markClassName="h-8 w-8" wordmarkClassName="text-xs" /></Link><Link to="/welcome" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--text)]">Back to home <ArrowUpRight size={14}/></Link></header>
      <div className="mx-auto my-auto w-full max-w-[26rem] py-10"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--primary)]">Your workspace</p><h2 className="mt-3 text-3xl font-bold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{subtitle}</p></div>{children}<div className="mt-7 border-t border-[var(--border)] pt-5 text-center text-xs text-[var(--muted)]">{footer}</div></div>
      <div className="text-center text-[11px] text-[var(--muted)] lg:text-right">Secure access to your Spectra workspace</div>
    </section>
  </main>;
}
