'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PLATES } from '@/lib/types';
import type { Plate, UserData } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { useAuthStore, useCurrentUserId } from '@/stores/auth';
import { getUserData } from '@/lib/api';
import { reset, setPlate, useForumStore } from '@/stores/forum';
import SafeImage from '@/components/common/SafeImage';

type SidebarIconName = 'grid' | 'board' | 'message' | 'rank' | 'edit' | 'user';

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
    return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1.4" /><rect x="14" y="4" width="6" height="6" rx="1.4" /><rect x="4" y="14" width="6" height="6" rx="1.4" /><rect x="14" y="14" width="6" height="6" rx="1.4" /></svg>;
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

  return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

/**
 * 首页桌面左栏：严格使用独立个人资料卡、两组开放式导航和底部发布按钮。
 * 登录状态下通过 getUserData 拉取真实 profile，禁止继续显示 Lv.undefined 与假数据。
 */
export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPlate = useForumStore((state) => state.plate);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [activePlateParam, setActivePlateParam] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const isCommunityHomeActive = pathname === '/' && !activePlateParam;
  const userId = useCurrentUserId();
  const isLoggedIn = Boolean(userId);

  useEffect(() => {
    const syncActivePlate = () => {
      setActivePlateParam(new URLSearchParams(window.location.search).get('plate'));
    };

    syncActivePlate();
    window.addEventListener('popstate', syncActivePlate);
    return () => window.removeEventListener('popstate', syncActivePlate);
  }, [pathname]);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    getUserData(userId, 0)
      .then((data) => setProfile(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const handlePlateClick = (plate: Plate) => {
    if (plate === currentPlate && activePlateParam === String(plate)) return;

    setPlate(plate);
    reset();

    // 首页内切换：更新 store + 地址栏 ?plate=x；其他页面：跳回首页对应板块。
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const params = new URLSearchParams(window.location.search);
      params.set('plate', String(plate));
      setActivePlateParam(String(plate));
      router.push(`/?${params.toString()}`, { scroll: false });
      return;
    }

    router.push(`/?plate=${plate}`);
  };

  const handleCommunityHome = () => {
    setActivePlateParam(null);
    if (pathname !== '/' || activePlateParam) router.push('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const name = profile?.username ?? currentUser?.username ?? '杯友';
  const photo = profile?.photo ?? currentUser?.photo;
  const level = profile?.level ?? currentUser?.level ?? 1;

  const posts = profile?.invitationNumber;
  const likes = profile?.likeNumber;
  const collections = profile?.collectNumber;

  return (
    <aside className="desktop-sidebar">
      <section className="profile-card">
        {isLoggedIn ? (
          error ? (
            <div className="profile-top">
              <span className="profile-avatar" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="profile-name truncate">加载失败</div>
                <div className="profile-meta truncate">请检查网络后重试</div>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-top">
                <span className="profile-avatar" aria-hidden="true">
                  <SafeImage src={resolveAvatar(photo)} alt="" />
                </span>
                <div className="min-w-0">
                  <div className="profile-name truncate">晚上好，{name}</div>
                  <div className="profile-meta truncate">Lv.{level}</div>
                </div>
              </div>

              <div className="profile-stats" aria-label="个人统计">
                <div><strong>{loading ? '—' : (posts ?? '—')}</strong><span>帖子</span></div>
                <div><strong>{loading ? '—' : (likes ?? '—')}</strong><span>获赞</span></div>
                <div><strong>{loading ? '—' : (collections ?? '—')}</strong><span>收藏</span></div>
              </div>
            </>
          )
        ) : (
          <div className="profile-top">
            <span className="profile-avatar" aria-hidden="true">
              <SafeImage src={resolveAvatar(undefined)} alt="" />
            </span>
            <div className="min-w-0">
              <div className="profile-name truncate">登录后查看个人资料</div>
              <div className="profile-meta truncate">同步你的帖子与收藏</div>
            </div>
          </div>
        )}
      </section>

      <nav className="side-section" aria-label="社区导航">
        <div className="side-label">社区</div>
        <button
          type="button"
          onClick={handleCommunityHome}
          className="side-link"
          data-active={isCommunityHomeActive}
          aria-current={isCommunityHomeActive ? 'page' : undefined}
        >
          <SidebarIcon name="grid" />
          <span>社区首页</span>
        </button>

        {PLATES.map((plate) => {
          const isActive = pathname === '/' && activePlateParam === String(plate.id);
          return (
            <button
              key={plate.id}
              type="button"
              onClick={() => handlePlateClick(plate.id)}
              className="side-link"
              data-active={isActive}
              aria-current={isActive ? 'page' : undefined}
            >
              <SidebarIcon name="board" />
              <span>{plate.name}</span>
            </button>
          );
        })}
      </nav>

      <nav className="side-section" aria-label="发现入口">
        <div className="side-label">发现</div>
        <button type="button" onClick={() => router.push('/rankingList')} className="side-link" data-active={pathname.startsWith('/rankingList')}>
          <SidebarIcon name="rank" />
          <span>玩具榜单</span>
        </button>
        <button type="button" onClick={() => router.push('/message')} className="side-link" data-active={pathname.startsWith('/message')}>
          <SidebarIcon name="message" />
          <span>回复我的</span>
        </button>
        <button type="button" onClick={() => router.push(currentUser ? '/myuser' : '/login')} className="side-link" data-active={pathname.startsWith('/myuser')}>
          <SidebarIcon name="user" />
          <span>个人中心</span>
        </button>
      </nav>

      <button type="button" onClick={() => router.push('/postMessage')} className="side-compose">
        <SidebarIcon name="edit" />
        <span>发布新帖</span>
      </button>
    </aside>
  );
}
