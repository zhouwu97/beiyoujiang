'use client';

interface AdultVerifyModalProps {
  open: boolean;
  onConfirm: () => void;
}

export default function AdultVerifyModal({ open, onConfirm }: AdultVerifyModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="adult-verify-title">
      <div className="verify-modal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="verify-symbol" aria-hidden="true">18+</span>
            <h2 id="adult-verify-title" className="mt-5 text-[20px] font-bold tracking-[-0.035em] text-[var(--ink)]">
              欢迎来到杯友酱
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">一个认真分享体验、尊重彼此边界的社区。</p>
          </div>
          <span className="pt-1 text-[11px] font-bold tracking-[0.16em] text-[var(--muted-light)]">WELCOME</span>
        </div>

        <div className="mt-6 rounded-[15px] border border-[var(--line)] bg-[var(--surface-subtle)] p-4">
          <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
            本论坛包含成人内容，请确认您已年满<span className="font-bold text-[var(--accent)]">18周岁</span>并同意遵守以下版规：
          </p>
          <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[var(--muted)]">
            <li className="flex gap-2"><span className="text-[var(--accent)]">01</span>禁止发布违反中国法律法规的内容</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">02</span>禁止人身攻击、恶意骚扰他人</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">03</span>禁止传播色情低俗信息</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">04</span>尊重他人隐私，文明交流</li>
          </ul>
        </div>

        <button onClick={onConfirm} className="interactive-press mt-5 flex h-12 w-full items-center justify-center rounded-[13px] bg-[var(--accent)] text-[14px] font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-strong)]">
          我已满18岁，同意版规
        </button>
      </div>
    </div>
  );
}
