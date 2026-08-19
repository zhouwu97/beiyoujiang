'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PLATES } from '@/lib/types';
import type { Plate } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useMessageStore } from '@/stores/message';
import { reset, setPlate, useForumStore } from '@/stores/forum';
import { getAllMessages } from '@/lib/api';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-3.8 3v-3H7.5A2.5 2.5 0 0 1 5 12.5z" />
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

interface HeaderProps {
  /** community：默认全站版（含移动端板块导航）；compact：详情页专用（移动端隐藏板块导航 + 返回按钮）；
   *  detail：详情页专用，在 compact 基础上桌面端也不显示「发布帖子」浮动按钮（详情页不需要全局发帖入口） */
  variant?: 'community' | 'compact' | 'detail';
}

/**
 * 全站页头：桌面端严格采用「品牌 / 搜索 / 操作」三段式，板块入口留给左侧导航。
 * 移动端保留已有的板块快捷导航和底部导航，避免改变小屏使用路径。
 * variant="compact"：详情类页面（帖子/玩具详情），移动端隐藏板块导航并显示返回。
 * variant="detail"：帖子详情页，在 compact 基础上桌面端隐藏「发布帖子」按钮，
 * 避免详情阅读流里出现多余的全局发帖入口。
 */
export default function Header({ variant = 'community' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPlate = useForumStore((state) => state.plate);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasUnread = useMessageStore((state) => state.hasUnread);
  const checked = useMessageStore((state) => state.checked);
  const setHasUnread = useMessageStore((state) => state.setHasUnread);
  const setChecked = useMessageStore((state) => state.setChecked);
  const isDetail = variant === 'detail';
  const isCompact = variant === 'compact' || isDetail;

  // 通知红点：会话内首次挂载查一次未读状态（成功后才置 checked，未登录/失败下次导航重试）。
  useEffect(() => {
    if (checked) return;
    let cancelled = false;
    getAllMessages(0)
      .then((msgs) => {
        if (cancelled) return;
        setHasUnread(msgs.some((m) => !m.isRead));
        setChecked();
      })
      .catch(() => {
        // 未登录/网络失败：保持未检查状态，等下次挂载再试
      });
    return () => {
      cancelled = true;
    };
  }, [checked, setHasUnread, setChecked]);

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
      <div
        className={`desktop-header-inner ${isDetail ? 'desktop-header-inner--detail' : ''}`}
        data-variant={variant}
      >
        <div className="desktop-header-left">
          {isCompact && (
            <button
              onClick={() => router.back()}
              className={`icon-button desktop-header-back ${!isDetail ? 'xl:hidden' : ''}`}
              aria-label="返回"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}

          <Link href="/" className="desktop-header-brand" aria-label="杯友酱首页">
            <span className="desktop-header-brand-mark" aria-hidden="true">
              <img src="/icon.png" alt="杯友酱" />
            </span>
            <span className="desktop-header-brand-text">杯友酱</span>
            <span className="desktop-header-brand-dot" aria-hidden="true" />
          </Link>
        </div>

        <div className="desktop-header-center">
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
        </div>

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
            <MessageIcon />
            {hasUnread && <span className="notification-dot" aria-hidden="true" />}
          </button>

          {/* 详情页不展示全局「发布帖子」入口，避免阅读流被无关 CTA 打断 */}
          {!isDetail && (
            <button type="button" onClick={() => router.push('/postMessage')} className="desktop-header-compose">
              <PlusIcon />
              <span>发布帖子</span>
            </button>
          )}

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

      {!isCompact && (
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
      )}
    </header>
  );
}
