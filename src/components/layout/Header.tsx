'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useForumStore, setPlate, reset } from '@/stores/forum';
import { useAuthStore } from '@/stores/auth';
import { PLATES } from '@/lib/types';
import type { Plate } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" />
      <path d="m16.5 16.5 4.5 4.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPlate = useForumStore((s) => s.plate);
  const currentUser = useAuthStore((s) => s.currentUser);

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
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1420px] items-center gap-3 px-4 sm:px-6 xl:h-[68px] xl:min-h-0 xl:gap-6 xl:px-7">
        <Link href="/" className="brand-lockup shrink-0" aria-label="杯友酱首页">
          <span className="brand-mark" aria-hidden="true">杯</span>
          <span className="brand-wordmark">
            <strong>杯友酱</strong>
            <small>社区</small>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="主导航">
          <Link href="/" className="header-link header-link--home">
            首页
          </Link>
          <span className="header-link" data-active={pathname === '/'} aria-current={pathname === '/' ? 'page' : undefined}>论坛</span>
          <Link href="/rankingList" className="header-link" data-active={pathname.startsWith('/rankingList')}>
            排行榜
          </Link>
        </nav>

        <nav className="hidden min-w-0 flex-1 items-center gap-5 border-l border-[var(--line)] pl-6 xl:flex" aria-label="论坛板块">
          {PLATES.map((plateInfo) => {
            const isActive = currentPlate === plateInfo.id;
            return (
              <button
                key={plateInfo.id}
                onClick={() => handlePlateClick(plateInfo.id)}
                aria-current={isActive ? 'page' : undefined}
                className="header-section-link whitespace-nowrap"
                data-active={isActive}
              >
                {plateInfo.name}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 xl:gap-2.5">
          <button
            onClick={() => router.push('/search')}
            className="search-trigger desktop-search-trigger hidden xl:inline-flex"
            aria-label="搜索帖子、用户、话题"
          >
            <SearchIcon />
            <span>搜索帖子、用户、话题</span>
            <span className="search-shortcut">Ctrl K</span>
          </button>

          <button
            onClick={() => router.push('/search')}
            className="icon-button mobile-search-button xl:hidden"
            aria-label="搜索"
          >
            <SearchIcon />
          </button>

          <button onClick={() => router.push('/message')} className="icon-button" aria-label="消息">
            <BellIcon />
            <span className="notification-dot" />
          </button>

          <button
            onClick={() => router.push(currentUser ? '/myuser' : '/login')}
            className="hidden items-center gap-2 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-[var(--ink-soft)] transition-colors duration-150 hover:bg-[var(--surface-subtle)] xl:inline-flex"
            aria-label={currentUser ? '打开个人中心' : '登录'}
          >
            <img
              src={resolveAvatar(currentUser?.photo)}
              alt=""
              className="h-7 w-7 rounded-[10px] border border-[var(--line)] bg-[var(--surface-subtle)] object-cover"
            />
            <span className="max-w-[82px] truncate">{currentUser?.username ?? '登录'}</span>
          </button>
        </div>
      </div>

      <nav className="flex min-w-0 items-center gap-5 overflow-x-auto border-t border-[var(--line)] px-4 xl:hidden" aria-label="论坛板块">
        {PLATES.map((plateInfo) => {
          const isActive = currentPlate === plateInfo.id;
          return (
            <button
              key={plateInfo.id}
              onClick={() => handlePlateClick(plateInfo.id)}
              aria-current={isActive ? 'page' : undefined}
              className="header-section-link shrink-0"
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
