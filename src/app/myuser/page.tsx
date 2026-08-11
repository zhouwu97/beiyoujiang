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

  const posts = tab === 0 ? (data?.post ?? []) : [];

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-[#e8e8ec] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-0">
          <button onClick={() => router.back()} className="p-2" aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[16px] font-semibold text-[#2C2C2C]">我的</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] pb-12 lg:my-6">
      {/* 用户卡片 */}
      <section className="px-4 pt-5">
        <div className="bg-gradient-to-br from-[#FFF0F3] to-[#FFE8EC] rounded-[20px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={resolveAvatar(displayPhoto)}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#2C2C2C]">{displayName}</span>
                <img
                  src={resolveImage(`/images/level/leve${level}.png`)}
                  alt={`Lv.${level}`}
                  className="w-5 h-5"
                />
              </div>
              {isGuest && (
                <button
                  onClick={() => router.push('/login')}
                  className="mt-1 text-[12px] text-[#FB7299] font-medium"
                >
                  登录正式账号
                </button>
              )}
              <p className="text-[12px] text-[#929292] mt-1">
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
            <span className="text-[11px] text-[#929292]">U酱币</span>
            <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden ml-2">
              <div
                className="h-full w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#FFAFBD] to-[#FB7299] transition-transform duration-200"
                style={{ transform: `scaleX(${Math.min(100, experience % 100) / 100})` }}
              />
            </div>
            <span className="text-[11px] text-[#929292] whitespace-nowrap">
              经验 {experience}
            </span>
          </div>

          {/* 统计 */}
          <div className="flex items-center justify-around bg-white/60 rounded-[14px] py-3">
            <div className="text-center">
              <p className="text-[16px] font-bold text-[#2C2C2C]">{data?.fans ?? 0}</p>
              <p className="text-[11px] text-[#929292]">粉丝</p>
            </div>
            <div className="w-px h-8 bg-[#FFD6DE]" />
            <div className="text-center">
              <p className="text-[16px] font-bold text-[#2C2C2C]">{data?.followersNumber ?? 0}</p>
              <p className="text-[11px] text-[#929292]">关注</p>
            </div>
            <div className="w-px h-8 bg-[#FFD6DE]" />
            <div className="text-center">
              <p className="text-[16px] font-bold text-[#2C2C2C]">{data?.invitationNumber ?? 0}</p>
              <p className="text-[11px] text-[#929292]">帖子</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab 切换 */}
      <div className="flex items-center justify-around px-4 mt-5 border-b border-gray-50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 text-[14px] relative ${
              tab === t.id ? 'text-[#2C2C2C] font-semibold' : 'text-[#929292]'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full bg-[#FB7299]" />
            )}
          </button>
        ))}
      </div>

      {/* 帖子列表 */}
      <div className="px-3 pt-3">
        {loading && <p className="text-center text-[13px] text-[#929292] py-10">加载中...</p>}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-[#929292] mb-1">
              {tab === 0 ? '还没有发过帖子' : tab === 1 ? '还没有收藏' : '还没有足迹'}
            </p>
            {tab === 0 && (
              <button
                onClick={() => router.push('/postMessage')}
                className="interactive-press mt-3 rounded-full bg-[#FB7299] px-5 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#ee628b]"
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

      </main>

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
