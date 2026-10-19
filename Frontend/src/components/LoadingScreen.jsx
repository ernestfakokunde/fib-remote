import BrandLogo from './BrandLogo';

export default function LoadingScreen({ label = 'Loading your workspace' }) {
  return (
    <div className="brand-loading-screen" role="status" aria-live="polite">
      <div className="brand-loading-mark">
        <BrandLogo markOnly markClassName="h-16 w-16" />
      </div>
      <span className="brand-loading-label">{label}</span>
      <span className="sr-only">Please wait</span>
    </div>
  );
}
