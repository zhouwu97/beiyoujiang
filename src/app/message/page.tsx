'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getAllMessages, markAllAsRead } from '@/lib/api';
import type { MessageItem } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { useCurrentUserId } from '@/stores/auth';
import { useMessageStore } from '@/stores/message';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopPageShell from '@/components/layout/DesktopPageShell';
import { useAppRevalidate } from '@/hooks/useAppRevalidate';
import SafeImage from '@/components/common/SafeImage';

/**
 * 消息 → 帖子详情的跳转地址（三层 fallback）：
 *  有 postId + commentId → 精确定位到评论 #comment-{commentId}
 *  只有 postId           → 评论区 #comments
 *  没有 postId           → null（不可点击）
 */
function getMessageHref(m: MessageItem): string | null {
  if (!m.postId) return null;
  if (m.commentId) return `/messageDetail/${m.postId}#comment-${m.commentId}`;
  return `/messageDetail/${m.postId}#comments`;
}

/**
 * 消息中心：
 * PC >= 1280 采用主消息流 + 消息上下文侧面板双栏结构；
 * 去除 max-w-[980px] 狭窄限制，充分利用横向空间；
 * 侧面板仅展示从真实 messages 计算的数据（总数、未读数、互动数及一键已读）。
 */
export default function MessagePage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const me = useCurrentUserId();
  const [loading, setLoading] = useState(() => Boolean(me));
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const setHasUnread = useMessageStore((s) => s.setHasUnread);

  const fetchMessages = useCallback(() => {
    if (!me) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getAllMessages(0)
      .then((msgs) => {
        setMessages(msgs);
        setHasUnread(msgs.some((m) => !m.isRead));
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [me, setHasUnread]);

  useEffect(() => {
    // 首次进入消息页需要主动拉取数据；后续恢复由 useAppRevalidate 负责。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [fetchMessages]);
  useAppRevalidate(fetchMessages);

  const handleMarkAllRead = async () => {
    if (markingAll || messages.length === 0) return;
    setMarkingAll(true);
    try {
      await markAllAsRead(0);
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      setHasUnread(false);
    } catch {
      // 忽略失败
    } finally {
      setMarkingAll(false);
    }
  };

  const { totalCount, unreadCount, replyCount } = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter((m) => !m.isRead).length;
    const replies = messages.filter((m) => Boolean(m.commentId || m.postId)).length;
    return { totalCount: total, unreadCount: unread, replyCount: replies };
  }, [messages]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return '';
    }
  };

  return (
    <div className="page-shell min-h-screen">
      <Header />

      <DesktopPageShell
        left={<DesktopSidebar />}
        main={
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between pt-3 md:pt-0">
              <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[var(--ink)]">回复我的</h1>
              {me && messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll || unreadCount === 0}
                  className="interactive-press rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed xl:hidden"
                >
                  全部已读
                </button>
              )}
            </div>

            {!me && (
              <div className="flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-white py-20 text-center shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-subtle)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--muted)]">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <p className="mb-4 text-[14px] text-[var(--muted)]">登录后查看回复与通知</p>
                <Link href="/login" className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]">
                  去登录
                </Link>
              </div>
            )}

            {me && loading && (
              <div className="rounded-[18px] border border-[var(--line)] bg-white p-12 text-center shadow-[var(--shadow-soft)]">
                <span className="loading-dots" aria-label="正在加载消息" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <p className="mt-3 text-[13px] text-[var(--muted)]">加载中...</p>
              </div>
            )}

            {me && !loading && error && (
              <div className="flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-white py-20 text-center shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-subtle)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--muted)]">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <p className="mb-4 text-[14px] text-[var(--muted)]">加载失败，请检查网络后重试</p>
                <button
                  type="button"
                  onClick={fetchMessages}
                  className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]"
                >
                  重新加载
                </button>
              </div>
            )}

            {me && !loading && !error && messages.length === 0 && (
              <div className="flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-white py-20 text-center shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-subtle)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--muted)]">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <p className="text-[14px] text-[var(--muted)]">暂无消息</p>
              </div>
            )}

            {me && !loading && !error && messages.length > 0 && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_270px] xl:items-start">
                {/* 消息主列表 */}
                <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[var(--shadow-soft)]">
                  {messages.map((m) => {
                    const href = getMessageHref(m);
                    const baseCls =
                      'flex w-full items-center gap-4 border-b border-[var(--line)] px-5 py-4 text-left transition-colors last:border-0 hover:bg-[var(--surface-subtle)]';
                    const inner = (
                      <>
                        <SafeImage
                          src={resolveAvatar((m as unknown as { photo?: string }).photo)}
                          alt=""
                          className="h-10 w-10 flex-none rounded-full bg-[var(--background)] object-cover ring-2 ring-white"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">
                              {String(m.content ?? '').trim() ? String(m.content ?? '') : '新消息互动'}
                            </p>
                            {!m.isRead && (
                              <span className="h-2 w-2 flex-none rounded-full bg-[var(--accent)]" aria-label="未读" />
                            )}
                            <span className="ml-auto flex-none text-[11px] text-[var(--muted)]">{formatTime(m.createdAt)}</span>
                          </div>
                        </div>
                        {href && (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="flex-none text-[var(--muted-light)] transition-transform duration-200 group-hover:translate-x-0.5"
                          >
                            <path d="M5 12h13" />
                            <path d="m13 6 6 6-6 6" />
                          </svg>
                        )}
                      </>
                    );
                    return href ? (
                      <Link key={m.id} href={href} className={`${baseCls} group cursor-pointer`}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={m.id} className={baseCls}>
                        {inner}
                      </div>
                    );
                  })}
                </div>

                {/* 桌面右侧：消息统计与快速操作 */}
                <div className="hidden xl:block">
                  <div className="rail-panel sticky top-[86px] p-5">
                    <div className="rail-head pb-3">
                      <h3>消息概览</h3>
                    </div>
                    <div className="space-y-3 pt-2 text-[13px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted)]">全部消息</span>
                        <strong className="font-bold text-[var(--ink)]">{totalCount} 条</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted)]">未读通知</span>
                        <strong className={`font-bold ${unreadCount > 0 ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
                          {unreadCount} 条
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted)]">回复互动</span>
                        <strong className="font-bold text-[var(--ink)]">{replyCount} 条</strong>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[var(--line)] pt-4">
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={markingAll || unreadCount === 0}
                        className="interactive-press w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-subtle)] py-2 text-center text-[12.5px] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--line-strong)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {markingAll ? '处理中...' : '标记全部为已读'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />

      <BottomNav />
    </div>
  );
}
