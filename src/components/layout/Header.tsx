'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PLATES } from '@/lib/types';
import type { Plate } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { reset, setPlate, useForumStore } from '@/stores/forum';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * 全站页头：桌面端严格采用「品牌 / 搜索 / 操作」三段式，板块入口留给左侧导航。
 * 移动端保留已有的板块快捷导航和底部导航，避免改变小屏使用路径。
 */
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPlate = useForumStore((state) => state.plate);
  const currentUser = useAuthStore((state) => state.currentUser);

  const handlePlateClick = useCallback(
    (plate: Plate) => {
      if (plate === currentPlate) return;
      setPlate(plate);
      reset();

      // 首页内切换：更新 store + 地址栏 ?plate=x；其他页面：跳回首页对应板块。
      if (pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const params = new URLSearchParams(window.location.search);
        params.set('plate', String(plate));
        router.push(`/?${params.toString()}`, { scroll: false });
      } else {
        router.push(`/?plate=${plate}`);
      }
    },
    [currentPlate, pathname, router]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plateParam = params.get('plate');
    if (plateParam) {
      const plate = Number(plateParam) as Plate;
      const valid = PLATES.some((item) => item.id === plate);
      if (valid) setPlate(plate);
    }
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        router.push('/search');
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, [router]);

  return (
    <header className="site-header">
      <div className="desktop-header-inner">
        <Link href="/" className="desktop-header-brand" aria-label="杯友酱首页">
          <span className="desktop-header-brand-mark" aria-hidden="true">
            <img src="/images/load.gif" alt="" />
          </span>
          <span className="desktop-header-brand-text">杯友酱</span>
          <span className="desktop-header-brand-dot" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={() => router.push('/search')}
          className="desktop-header-search"
          aria-label="搜索玩具、帖子、用户"
        >
          <SearchIcon />
          <span>搜索玩具、帖子、用户</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="desktop-header-actions">
          <button
            type="button"
            onClick={() => router.push('/search')}
            className="desktop-header-mobile-search icon-button xl:hidden"
            aria-label="搜索"
          >
            <SearchIcon />
          </button>

          <button type="button" onClick={() => router.push('/message')} className="desktop-header-icon-button" aria-label="消息">
            <BellIcon />
          </button>

          <button type="button" onClick={() => router.push('/postMessage')} className="desktop-header-compose">
            <PlusIcon />
            <span>发布帖子</span>
          </button>

          <button
            type="button"
            onClick={() => router.push(currentUser ? '/myuser' : '/login')}
            className="desktop-header-avatar"
            aria-label={currentUser ? '打开个人中心' : '登录'}
          >
            <img src={resolveAvatar(currentUser?.photo)} alt="" />
          </button>
        </div>
      </div>

      <nav className="flex min-w-0 items-stretch border-t border-[var(--line)] px-1 xl:hidden" aria-label="论坛板块">
        {PLATES.map((plateInfo) => {
          const isActive = currentPlate === plateInfo.id;
          return (
            <button
              key={plateInfo.id}
              type="button"
              onClick={() => handlePlateClick(plateInfo.id)}
              aria-current={isActive ? 'page' : undefined}
              className="header-section-link flex-1 justify-center"
              data-active={isActive}
            >
              {plateInfo.name}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
