'use client';

import { useRouter } from 'next/navigation';

interface LoginTipModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginTipModal({ open, onClose }: LoginTipModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="login-tip-title">
      <div className="verify-modal max-w-[340px]">
        <span className="verify-symbol" aria-hidden="true">U</span>
        <h2 id="login-tip-title" className="mt-5 text-[18px] font-bold tracking-[-0.03em] text-[var(--ink)]">登录后继续</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--ink-soft)]">该功能仅正式会员可用，请先登录~</p>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={onClose} className="interactive-press flex h-11 flex-1 items-center justify-center rounded-[13px] bg-[var(--surface-subtle)] text-[13px] font-semibold text-[var(--ink-soft)] transition-colors duration-150 hover:bg-[var(--line)]">
            取消
          </button>
          <button onClick={handleLogin} className="btn-gradient interactive-press flex h-11 flex-1 items-center justify-center text-[13px] font-bold">
            去登录
          </button>
        </div>
      </div>
    </div>
  );
}
