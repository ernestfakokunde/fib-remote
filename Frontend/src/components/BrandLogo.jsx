/** Spectra's cube mark and wordmark, drawn as vectors for crisp rendering. */
export default function BrandLogo({ className = '', markClassName = 'h-9 w-9', wordmarkClassName = '', markOnly = false }) {
  return <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
    <svg className={`${markClassName} shrink-0`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 3 59 18.5 32 34 5 18.5 32 3Z" fill="#818CF8" />
      <path d="M5 18.5 32 34v27L5 45.5v-27Z" fill="#4F46E5" />
      <path d="M59 18.5 32 34v27l27-15.5v-27Z" fill="#6366F1" />
      <path d="m32 13 15 8.7L32 30.3l-15-8.6L32 13Z" fill="#C7D2FE" />
      <path d="m5 34 27 15.6v5.2L5 39.2V34Z" fill="#818CF8" />
      <path d="m59 34-27 15.6v5.2l27-15.6V34Z" fill="#22D3EE" />
    </svg>
    {!markOnly && <span className={`flex min-w-0 flex-col leading-none ${wordmarkClassName}`}>
      <span className="text-[1.25em] font-semibold tracking-[-.045em]">Spectra</span>
      <span className="mt-1 text-[.78em] font-medium tracking-[.015em] text-[var(--muted)]">Inventory</span>
    </span>}
  </span>;
}
