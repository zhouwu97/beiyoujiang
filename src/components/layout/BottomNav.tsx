'use client';

import { usePathname, useRouter } from 'next/navigation';

function HomeIcon({ active }: { active: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9.5 21v-6h5v6" /></svg>;
}

function RankIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 20V10M12 20V4M18 20v-7M4 20h16" /></svg>;
}

function MessageIcon({ active }: { active: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-3.8 3v-3H7.5A2.5 2.5 0 0 1 5 12.5z" /></svg>;
}

function UserIcon({ active }: { active: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

/** 对称 5 槽：首页 回复 [＋] 榜单 我的，发帖按钮居中。 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className="mobile-bottom-nav lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="底部导航">
      <div className="flex h-[58px] items-stretch px-2">
        <button onClick={() => router.push('/')} className="mobile-nav-item interactive-press flex-1" data-active={isActive('/')}>
          <HomeIcon active={isActive('/')} />
          <span>首页</span>
        </button>

        <button onClick={() => router.push('/message')} className="mobile-nav-item interactive-press flex-1" data-active={isActive('/message')}>
          <MessageIcon active={isActive('/message')} />
          <span>回复</span>
        </button>

        <button onClick={() => router.push('/postMessage')} className="mobile-compose interactive-press" aria-label="发帖" data-active={isActive('/postMessage')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>

        <button onClick={() => router.push('/rankingList')} className="mobile-nav-item interactive-press flex-1" data-active={isActive('/rankingList')}>
          <RankIcon />
          <span>榜单</span>
        </button>

        <button onClick={() => router.push('/myuser')} className="mobile-nav-item interactive-press flex-1" data-active={isActive('/myuser')}>
          <UserIcon active={isActive('/myuser')} />
          <span>我的</span>
        </button>
      </div>
    </nav>
  );
}
