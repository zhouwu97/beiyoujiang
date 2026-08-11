'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { reset, setPlate, useForumStore } from '@/stores/forum';
import { PLATES } from '@/lib/types';
import type { Plate } from '@/lib/types';

type SidebarIconName = 'grid' | 'board' | 'message' | 'rank' | 'edit' | 'bell' | 'user';

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'grid') {
    return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  }

  if (name === 'board') {
    return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h5M8 17h3" /></svg>;
  }

  if (name === 'message') {
    return <svg {...common}><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-3.8 3v-3H7.5A2.5 2.5 0 0 1 5 12.5z" /></svg>;
  }

  if (name === 'rank') {
    return <svg {...common}><path d="M6 20V10M12 20V4M18 20v-7M4 20h16" /></svg>;
  }

  if (name === 'edit') {
    return <svg {...common}><path d="M13.5 5.5 18.5 10.5M5 19l3.5-.8L19.2 7.5a2.1 2.1 0 0 0-3-3L5.8 14.9z" /></svg>;
  }

  if (name === 'bell') {
    return <svg {...common}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
  }

  return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPlate = useForumStore((state) => state.plate);
  const currentUser = useAuthStore((state) => state.currentUser);

  const handlePlateClick = (plate: Plate) => {
    if (plate === currentPlate) return;
    setPlate(plate);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="sticky top-[92px] hidden xl:block">
      <div className="rail-panel sidebar-panel p-3">
        <div className="sidebar-heading px-2 pt-1">
          <span className="rail-kicker">社区导航</span>
          <h2 className="mt-1.5">探索社区</h2>
        </div>

        <button onClick={() => router.push('/postMessage')} className="sidebar-compose interactive-press mt-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-white/15"><SidebarIcon name="edit" /></span>
          <span>发布新帖</span>
          <svg className="ml-auto" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
        </button>

        <div className="mt-5 px-2 rail-kicker">版块</div>
        <div className="mt-2 space-y-1">
          {PLATES.map((plate) => {
            const isActive = currentPlate === plate.id;
            return (
              <button
                key={plate.id}
                onClick={() => handlePlateClick(plate.id)}
                className="side-link"
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-[var(--line)] bg-white text-[var(--muted)]">
                  <SidebarIcon name="board" />
                </span>
                <span>{plate.name}</span>
              </button>
            );
          })}
        </div>

        <div className="my-4 h-px bg-[var(--line)]" />

        <div className="px-2 rail-kicker">快捷入口</div>
        <div className="mt-2 space-y-1">
          <button onClick={() => router.push('/message')} className="side-link">
            <SidebarIcon name="message" />
            <span>回复我的</span>
          </button>
          <button onClick={() => router.push('/rankingList')} className="side-link" data-active={pathname.startsWith('/rankingList')}>
            <SidebarIcon name="rank" />
            <span>社区榜单</span>
          </button>
        </div>

        <div className="sidebar-account mt-4 rounded-[13px] px-3 py-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--ink-soft)]">
            <span className="text-[var(--muted)]"><SidebarIcon name={currentUser ? 'user' : 'bell'} /></span>
            <span>{currentUser ? '欢迎回来' : '登录后参与交流'}</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">
            {currentUser ? '管理你的帖子、收藏和互动。' : '登录后可同步个人资料与消息。'}
          </p>
          {!currentUser && (
            <button onClick={() => router.push('/login')} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-ink)] transition-colors duration-150 hover:text-[var(--accent)]">
              去登录
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
