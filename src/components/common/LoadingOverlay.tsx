interface LoadingOverlayProps {
  show: boolean;
}

export default function LoadingOverlay({ show }: LoadingOverlayProps) {
  return (
    <div className={`loading-overlay fixed inset-0 z-50 ${show ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} aria-live="polite" aria-label="加载中">
      <img src="/images/load.gif" alt="加载中" className="h-20 w-20 object-contain" />
      <p className="mt-4 text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">正在打开社区</p>
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">请稍等片刻</p>
    </div>
  );
}
