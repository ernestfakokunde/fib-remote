import BrandLogo from './BrandLogo';

export default function Footer() {
  return <footer className="mt-12 border-t border-[var(--border)] bg-[var(--card)] text-[var(--text)]">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-xs text-[var(--muted)] sm:flex-row sm:px-8">
      <a href="/" aria-label="Spectra Inventory home" className="text-[var(--text)]"><BrandLogo markClassName="h-9 w-9" wordmarkClassName="text-xs" /></a>
      <span>© {new Date().getFullYear()} Spectra Inventory</span>
    </div>
  </footer>;
}
