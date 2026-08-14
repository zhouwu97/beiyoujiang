'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllMessages, markAllAsRead } from '@/lib/api';
import type { MessageItem } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { getUserId } from '@/stores/auth';
import { useMessageStore } from '@/stores/message';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopPageShell from '@/components/layout/DesktopPageShell';

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
 * 消息中心：消息列表 + 全部已读
 */
export default function MessagePage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const me = getUserId();
  const [loading, setLoading] = useState(() => Boolean(me));
  const [error, setError] = useState(false);
  const setHasUnread = useMessageStore((s) => s.setHasUnread);

  useEffect(() => {
    if (!me) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getAllMessages(0)
      .then((msgs) => {
        if (cancelled) return;
        setMessages(msgs);
        setHasUnread(msgs.some((m) => !m.isRead));
        // markAllAsRead 失败不影响消息列表展示（列表已加载成功），红点保留待下次导航重试
        markAllAsRead(0)
          .then(() => {
            if (cancelled) return;
            setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
            setHasUnread(false);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me, setHasUnread]);

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
            <div className="mb-4 pt-3 md:pt-0">
              <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[var(--ink)]">回复我的</h1>
            </div>

      {!me && (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--muted)]">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--muted)] mb-4">登录后查看回复与通知</p>
          <Link href="/login" className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]">
            去登录
          </Link>
        </div>
      )}

      {me && loading && <p className="text-center text-[13px] text-[var(--muted)] py-16">加载中...</p>}

      {me && !loading && error && (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--muted)]">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--muted)] mb-4">加载失败，请检查网络后重试</p>
          <button
            onClick={() => window.location.reload()}
            className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]"
          >
            重新加载
          </button>
        </div>
      )}

      {me && !loading && !error && messages.length === 0 && (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--muted)]">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--muted)]">暂无消息</p>
        </div>
      )}

      {me && !loading && !error && messages.length > 0 && (
        <div className="max-w-[980px] rounded-[18px] border border-[var(--line)] bg-white px-3 py-2 shadow-[0_10px_30px_rgba(27,27,38,0.035)]">
        {messages.map((m) => {
          const href = getMessageHref(m);
          const baseCls =
            'flex w-full items-center gap-3.5 border-b border-[var(--line)] px-2 py-4 text-left last:border-0';
          const inner = (
            <>
              <img
                src={resolveAvatar((m as unknown as { photo?: string }).photo)}
                alt=""
                className="h-11 w-11 flex-none rounded-full object-cover bg-[var(--background)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {String(m.content ?? '').trim() ? (
                    <p className="truncate text-[13px] font-semibold text-[var(--ink)]">{String(m.content ?? '')}</p>
                  ) : (
                    <p className="truncate text-[13px] font-semibold text-[var(--muted)]">新消息</p>
                  )}
                  {!m.isRead && <span className="h-2 w-2 flex-none rounded-full bg-[var(--accent)]" />}
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
            <Link key={m.id} href={href} className={`${baseCls} group cursor-pointer transition-colors hover:bg-[var(--surface-subtle)]`}>
              {inner}
            </Link>
          ) : (
            <div key={m.id} className={baseCls}>
              {inner}
            </div>
          );
        })}
      </div>
      )}
          </div>
        }
      />

      <BottomNav />
    </div>
  );
}
