'use client';

import type { ToyDetail } from '@/lib/types';
import { formatCount } from '@/lib/utils';
import styles from './toy-detail.module.css';

interface ToyActionsProps {
  toy: ToyDetail;
  onWant: () => void;
  onBuy: () => void;
}

/**
 * 想冲 / 我买过：乐观更新由页面处理，组件只负责视觉与点击。
 * hover 仅改背景，active scale(.975)，不弹跳不抬升。
 */
export default function ToyActions({ toy, onWant, onBuy }: ToyActionsProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        onClick={onWant}
        className={`${styles.action}${toy.isWant ? ` ${styles.actionOn}` : ''}`}
        aria-pressed={toy.isWant}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={toy.isWant ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
        </svg>
        {toy.isWant ? `已想冲 · ${formatCount(toy.wantCount)}` : `想冲 · ${formatCount(toy.wantCount)}`}
      </button>
      <button
        type="button"
        onClick={onBuy}
        className={`${styles.action} ${styles.actionPrimary}${toy.isBuy ? ` ${styles.actionOn}` : ''}`}
        aria-pressed={toy.isBuy}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {toy.isBuy ? '已买过' : '我买过'}
      </button>
    </div>
  );
}
