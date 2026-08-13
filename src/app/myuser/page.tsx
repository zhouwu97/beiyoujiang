'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserData, deletePost } from '@/lib/api';
import type { Post, UserData } from '@/lib/types';
import { getUserId, useAuthStore } from '@/stores/auth';
import { resolveAvatar, resolveImage } from '@/lib/utils';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';
import PostCard from '@/components/post/PostCard';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopPageShell from '@/components/layout/DesktopPageShell';

const TABS = [
  { id: 0, label: '我的帖子' },
  { id: 1, label: '我的收藏' },
  { id: 2, label: '我的足迹' },
];

/**
 * 个人中心：资料 + U酱币 + 经验条 + 我的帖子
 */
export default function MyUserPage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentTourist = useAuthStore((s) => s.currentTourist);
  const me = getUserId();

  const [data, setData] = useState<UserData | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(() => Boolean(me));
  const [showLoginTip, setShowLoginTip] = useState(() => !me);

  useEffect(() => {
    if (!me) {
      return;
    }
    // 切换个人中心 Tab 时，先给用户明确的加载反馈。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getUserData(me, tab)
      .then((d) => {
        setData(d);
        // 同步最新 token
        if (d.token && currentUser) {
          useAuthStore.setState({ currentUser: { ...currentUser, token: d.token } });
        }
      })
      .catch(() => showAlert('加载失败'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, tab]);

  const displayName = currentUser?.username ?? currentTourist?.username ?? data?.username ?? '杯友';
  const displayPhoto = currentUser?.photo ?? currentTourist?.photo ?? data?.photo ?? 'byj.webp';
  const level = data?.level ?? currentUser?.level ?? currentTourist?.level ?? 1;
  const experience = data?.experience ?? currentUser?.experience ?? currentTourist?.experience ?? 20;
  const isGuest = !currentUser && Boolean(currentTourist);

  const handleDelete = async (postId: number) => {
    if (!window.confirm('确定删除这篇帖子吗？')) return;
    try {
      await deletePost(postId);
      const d = await getUserData(me!, tab);
      setData(d);
      showAlert('删除成功');
    } catch {
      showAlert('删除失败');
    }
  };

  // getUserData 已按当前 tab 作为 type（0=帖子/1=收藏/2=足迹）请求，
  // 三种 tab 的数据都落在同一 post 字段，直接渲染即可。
  const posts = data?.post ?? [];

  return (
    <div className="page-shell min-h-screen">
      <Header />

      <DesktopPageShell
        left={<DesktopSidebar />}
        main={
          <div className="min-w-0">
      {/* 用户卡片 */}
      <section className="px-4 pt-5 lg:px-0 lg:pt-0">
        <div className="bg-gradient-to-br from-[#FFF0F3] to-[#FFE8EC] rounded-[20px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={resolveAvatar(displayPhoto)}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[var(--ink)]">{displayName}</span>
                <img
                  src={resolveImage(`/images/level/leve${level}.png`)}
                  alt={`Lv.${level}`}
                  className="w-5 h-5"
                />
              </div>
              {isGuest && (
                <button
                  onClick={() => router.push('/login')}
                  className="mt-1 text-[12px] text-[var(--accent)] font-medium"
                >
                  登录正式账号
                </button>
              )}
              <p className="text-[12px] text-[var(--muted)] mt-1">
                {data?.introduction ?? '快来写你的简介吧'}
              </p>
            </div>
          </div>

          {/* U酱币 + 经验条 */}
          <div className="flex items-center gap-2 mb-3">
            <img src={resolveImage('/images/u.webp')} alt="U酱币" className="w-5 h-5" />
            <span className="text-[15px] font-bold text-[#FF9800]">
              {data?.USauceBean ?? 0}
            </span>
            <span className="text-[11px] text-[var(--muted)]">U酱币</span>
            <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden ml-2">
              <div
                className="h-full w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#FFAFBD] to-[var(--accent)] transition-transform duration-200"
                style={{ transform: `scaleX(${Math.min(100, experience % 100) / 100})` }}
              />
            </div>
            <span className="text-[11px] text-[var(--muted)] whitespace-nowrap">
              经验 {experience}
            </span>
          </div>

          {/* 统计 */}
          <div className="flex items-center justify-around bg-white/60 rounded-[14px] py-3">
            <div className="text-center">
              <p className="text-[16px] font-bold text-[var(--ink)]">{data?.fans ?? 0}</p>
              <p className="text-[11px] text-[var(--muted)]">粉丝</p>
            </div>
            <div className="w-px h-8 bg-[#FFD6DE]" />
            <div className="text-center">
              <p className="text-[16px] font-bold text-[var(--ink)]">{data?.followersNumber ?? 0}</p>
              <p className="text-[11px] text-[var(--muted)]">关注</p>
            </div>
            <div className="w-px h-8 bg-[#FFD6DE]" />
            <div className="text-center">
              <p className="text-[16px] font-bold text-[var(--ink)]">{data?.invitationNumber ?? 0}</p>
              <p className="text-[11px] text-[var(--muted)]">帖子</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab 切换 */}
      <div className="flex items-center justify-around px-4 mt-5 border-b border-[var(--line)] lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 text-[14px] relative ${
              tab === t.id ? 'text-[var(--ink)] font-semibold' : 'text-[var(--muted)]'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>

      {/* 帖子列表 */}
      <div className="px-3 pt-3 lg:px-0">
        {loading && <p className="text-center text-[13px] text-[var(--muted)] py-10">加载中...</p>}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-[var(--muted)] mb-1">
              {tab === 0 ? '还没有发过帖子' : tab === 1 ? '还没有收藏' : '还没有足迹'}
            </p>
            {tab === 0 && (
              <button
                onClick={() => router.push('/postMessage')}
                className="interactive-press mt-3 rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-strong)]"
              >
                去发帖
              </button>
            )}
          </div>
        )}

        {!loading &&
          posts.map((p) => (
            <div key={p.id} className="relative">
              <PostCard post={p} />
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-3 right-3 z-10 text-[11px] text-[#DC2626] bg-white/90 px-2 py-1 rounded-full"
              >
                删除
              </button>
            </div>
          ))}
      </div>
          </div>
        }
      />

      <BottomNav />

      <LoginTipModal
        open={showLoginTip}
        onClose={() => {
          setShowLoginTip(false);
          router.push('/');
        }}
      />
    </div>
  );
}
