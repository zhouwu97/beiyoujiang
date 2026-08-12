'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATES, Plate } from '@/lib/types';
import { reset, setPlate } from '@/stores/forum';

/** 全部版块 = 回到首页默认流（与 forum store 初始默认板块一致，不改动 plate 契约）。 */
const HOME_PLATE: Plate = Plate.CupForum;

/**
 * 首页 Feed 工具栏板块筛选下拉。
 * 与左栏板块导航共用同一套 store（setPlate + reset），选中态与 URL ?plate= 双向同步；
 * 「全部版块」= 社区首页（清空 ?plate，回到默认板块流）。
 */
export default function PlateFilterDropdown() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Plate | null>(null);

  // 与左栏一致：通过 URL ?plate 反映选中态，popstate 兜底浏览器前进/后退。
  useEffect(() => {
    const syncFromUrl = () => {
      const param = new URLSearchParams(window.location.search).get('plate');
      setSelected(param ? (Number(param) as Plate) : null);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const label =
    selected != null
      ? (PLATES.find((plate) => plate.id === selected)?.name ?? '全部版块')
      : '全部版块';

  const selectPlate = (plate: Plate | null) => {
    setOpen(false);
    if (plate === selected) return;
    setSelected(plate);

    if (plate === null) {
      // 全部版块 → 社区首页默认流（清空地址栏板块参数）
      setPlate(HOME_PLATE);
      reset();
      router.push('/', { scroll: false });
    } else {
      setPlate(plate);
      reset();
      router.push(`/?plate=${plate}`, { scroll: false });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ghost-btn"
        data-open={open}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="选择版块"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8M8 13h5M8 17h3" />
        </svg>
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="chevron"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="plate-dropdown" role="listbox" aria-label="全部版块">
          <button
            type="button"
            role="option"
            aria-selected={selected === null}
            data-active={selected === null}
            onClick={() => selectPlate(null)}
          >
            全部版块
          </button>
          {PLATES.map((plate) => (
            <button
              key={plate.id}
              type="button"
              role="option"
              aria-selected={selected === plate.id}
              data-active={selected === plate.id}
              onClick={() => selectPlate(plate.id)}
            >
              {plate.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
