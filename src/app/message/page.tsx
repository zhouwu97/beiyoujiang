'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllMessages, markAllAsRead } from '@/lib/api';
import type { MessageItem } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { getUserId } from '@/stores/auth';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopPageShell from '@/components/layout/DesktopPageShell';

/**
 * 消息中心：消息列表 + 全部已读
 */
export default function MessagePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const me = getUserId();
  const [loading, setLoading] = useState(() => Boolean(me));

  useEffect(() => {
    if (!me) {
      return;
    }
    getAllMessages(0)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));

    // 进入消息页全部标记已读
    markAllAsRead(0).catch(() => {});
  }, [me]);

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

      {loading && <p className="text-center text-[13px] text-[var(--muted)] py-16">加载中...</p>}

      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[28px] mb-4">
            🔔
          </div>
          <p className="text-[14px] text-[var(--muted)]">暂无消息</p>
        </div>
      )}

      <div className="rounded-[18px] border border-[var(--line)] bg-white px-5 py-2 shadow-[0_10px_30px_rgba(27,27,38,0.035)]">
        {messages.map((m) => (
          <button
            key={m.id}
            className="w-full flex items-center gap-3 py-3.5 border-b border-[var(--line)] text-left"
            onClick={() => m.postId && router.push(`/messageDetail/${m.postId}`)}
          >
            <img
              src={resolveAvatar((m as unknown as { photo?: string }).photo)}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-[var(--background)]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-[var(--ink)] leading-snug line-clamp-2">
                {String(m.content ?? '')}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1">{formatTime(m.createdAt)}</p>
            </div>
            {!m.isRead && <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />}
          </button>
        ))}
      </div>
          </div>
        }
      />

      <BottomNav />
    </div>
  );
}
