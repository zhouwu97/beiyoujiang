'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage, getUserData, deletePost } from '@/lib/api';
import type { UserData } from '@/lib/types';
import { useAuthStore, useCurrentUserId } from '@/stores/auth';
import { resolveAvatar, resolveImage } from '@/lib/utils';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';
import PostCard from '@/components/post/PostCard';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopPageShell from '@/components/layout/DesktopPageShell';
import SafeImage from '@/components/common/SafeImage';

const TABS = [
  { id: 0, label: '我的帖子' },
  { id: 1, label: '我的收藏' },
  { id: 2, label: '我的足迹' },
];

/**
 * 个人中心：
 * 采用全站统一桌面宽度，去除限制内部收窄的 max-w-[1100px]；
 * Hero 区域在桌面端采用横向充分展开布局（左侧基础资料与经验条，右侧统计与U酱币）；
 * 帖子列表复用原比例 PostMedia，删除按钮采用轻量文字操作。
 */
export default function MyUserPage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentTourist = useAuthStore((s) => s.currentTourist);
  const me = useCurrentUserId();

  const [data, setData] = useState<UserData | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(() => Boolean(me));
  const [dataError, setDataError] = useState<string | null>(null);
  const [showLoginTip, setShowLoginTip] = useState(() => !me);
  const pendingDeleteRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!me) {
      // 认证状态由外部 Zustand store 驱动，退出后需要清理页面上的旧数据。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setDataError(null);
      return;
    }
    setLoading(true);
    setDataError(null);
    getUserData(me, tab)
      .then((d) => {
        setData(d);
        const latestUser = useAuthStore.getState().currentUser;
        if (d.token && latestUser) {
          useAuthStore.setState({ currentUser: { ...latestUser, token: d.token } });
        }
      })
      .catch((error) => setDataError(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [me, tab]);

  const displayName = currentUser?.username ?? currentTourist?.username ?? data?.username ?? '杯友';
  const displayPhoto = currentUser?.photo ?? currentTourist?.photo ?? data?.photo ?? 'byj.webp';
  const level = data?.level ?? currentUser?.level ?? currentTourist?.level ?? 1;
  const experience = data?.experience ?? currentUser?.experience ?? currentTourist?.experience ?? 20;
  const isGuest = !currentUser && Boolean(currentTourist);

  const handleDelete = async (postId: number) => {
    if (!window.confirm('确定删除这篇帖子吗？')) return;
    if (pendingDeleteRef.current.has(postId)) return;
    pendingDeleteRef.current.add(postId);
    try {
      await deletePost(postId);
      const d = await getUserData(me!, tab);
      setData(d);
      showAlert('删除成功');
    } catch {
      showAlert('删除失败');
    } finally {
      pendingDeleteRef.current.delete(postId);
    }
  };

  const posts = data?.post ?? [];

  return (
    <div className="page-shell min-h-screen">
      <Header />

      <DesktopPageShell
        left={<DesktopSidebar />}
        main={
          <div className="min-w-0">
            {/* 用户卡片：桌面端左右充分展开 */}
            <section className="rounded-[20px] border border-[var(--line)] bg-gradient-to-br from-[#FFF0F3] to-[#FFE8EC] p-6 shadow-[var(--shadow-soft)] sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* 左侧：头像 + 用户名 + 等级 + 经验 */}
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <SafeImage
                    src={resolveAvatar(displayPhoto)}
                    alt=""
                    className="h-16 w-16 flex-none rounded-full border-2 border-white object-cover shadow-sm sm:h-20 sm:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[19px] font-bold text-[var(--ink)]">{displayName}</span>
                      <img
                        src={resolveImage(`/images/level/leve${level}.png`)}
                        alt={`Lv.${level}`}
                        className="h-5 w-5"
                      />
                      {isGuest && (
                        <button
                          onClick={() => router.push('/login')}
                          className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)] transition-colors hover:bg-white"
                        >
                          登录正式账号
                        </button>
                      )}
                    </div>

                    <p className="mt-1 truncate text-[12.5px] text-[var(--muted)]">
                      {data?.introduction ?? '快来写你的简介吧'}
                    </p>

                    {/* 经验条 */}
                    <div className="mt-3 flex max-w-sm items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70">
                        <div
                          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#FFAFBD] to-[var(--accent)] transition-transform duration-200"
                          style={{ transform: `scaleX(${Math.min(100, experience % 100) / 100})` }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-[11px] font-medium text-[var(--muted)]">
                        经验 {experience}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 右侧：统计与U酱币 */}
                <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-white/70 p-3 lg:shrink-0 sm:gap-6 sm:px-6 sm:py-3.5">
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-[var(--ink)]">{data?.fans ?? 0}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">粉丝</p>
                  </div>
                  <div className="h-7 w-px bg-[var(--line)]" />
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-[var(--ink)]">{data?.followersNumber ?? 0}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">关注</p>
                  </div>
                  <div className="h-7 w-px bg-[var(--line)]" />
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-[var(--ink)]">{data?.invitationNumber ?? 0}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">帖子</p>
                  </div>
                  <div className="h-7 w-px bg-[var(--line)]" />
                  <div className="flex items-center gap-2 pl-1">
                    <img src={resolveImage('/images/u.webp')} alt="U酱币" className="h-5 w-5" />
                    <div>
                      <span className="text-[16px] font-bold text-[#FF9800]">{data?.USauceBean ?? 0}</span>
                      <p className="text-[10px] text-[var(--muted)]">U酱币</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tab 切换 */}
            <div className="mt-6 flex items-center border-b border-[var(--line)]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-5 py-3 text-[14px] font-semibold transition-colors ${
                    tab === t.id ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink-soft)]'
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full bg-[var(--accent)]" />
                  )}
                </button>
              ))}
            </div>

            {/* 帖子列表容器 */}
            <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[var(--shadow-soft)]">
              {loading && <p className="py-12 text-center text-[13px] text-[var(--muted)]">加载中...</p>}

              {!loading && dataError && (
                <div className="flex flex-col items-center py-16 text-center">
                  <p className="mb-4 text-[14px] text-[var(--muted)]">{dataError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!me) return;
                      setLoading(true);
                      setDataError(null);
                      getUserData(me, tab)
                        .then(setData)
                        .catch((error) => setDataError(getApiErrorMessage(error)))
                        .finally(() => setLoading(false));
                    }}
                    className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white"
                  >
                    重新加载
                  </button>
                </div>
              )}

              {!loading && !dataError && posts.length === 0 && (
                <div className="py-16 text-center">
                  <p className="mb-2 text-[14px] text-[var(--muted)]">
                    {tab === 0 ? '还没有发过帖子' : tab === 1 ? '还没有收藏' : '还没有足迹'}
                  </p>
                  {tab === 0 && (
                    <button
                      onClick={() => router.push('/postMessage')}
                      className="interactive-press mt-2 rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]"
                    >
                      去发帖
                    </button>
                  )}
                </div>
              )}

              {!loading && !dataError &&
                posts.map((p) => (
                  <div key={p.id} className="relative group border-b border-[var(--line)] last:border-0">
                    <PostCard post={p} />
                    {/* 仅「我的帖子」可删除原帖；采用轻量文字操作，不破坏内容视觉 */}
                    {tab === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="absolute right-5 top-5 z-10 rounded-[6px] px-2 py-1 text-[12px] font-medium text-[var(--muted-light)] transition-colors hover:bg-red-50 hover:text-[#DC2626]"
                        aria-label="删除帖子"
                      >
                        删除
                      </button>
                    )}
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
