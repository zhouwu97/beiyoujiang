'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllMessages, markAllAsRead } from '@/lib/api';
import type { MessageItem } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { getUserId } from '@/stores/auth';

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
    <div className="min-h-screen bg-[#F7F7F9]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-[#e8e8ec] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[820px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-0">
          <button onClick={() => router.back()} className="p-2" aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[16px] font-semibold text-[#2C2C2C]">消息</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] px-4 pb-12 lg:px-0">
      {loading && <p className="text-center text-[13px] text-[#929292] py-16">加载中...</p>}

      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#F7F7F9] flex items-center justify-center text-[28px] mb-4">
            🔔
          </div>
          <p className="text-[14px] text-[#929292]">暂无消息</p>
        </div>
      )}

      <div className="rounded-[18px] border border-[#e7e7eb] bg-white px-5 py-2 shadow-[0_10px_30px_rgba(27,27,38,0.035)]">
        {messages.map((m) => (
          <button
            key={m.id}
            className="w-full flex items-center gap-3 py-3.5 border-b border-gray-50 text-left"
            onClick={() => m.postId && router.push(`/messageDetail/${m.postId}`)}
          >
            <img
              src={resolveAvatar((m as unknown as { photo?: string }).photo)}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-[#F7F7F9]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-[#2C2C2C] leading-snug line-clamp-2">
                {String(m.content ?? '')}
              </p>
              <p className="text-[11px] text-[#929292] mt-1">{formatTime(m.createdAt)}</p>
            </div>
            {!m.isRead && <span className="w-2 h-2 rounded-full bg-[#FB7299] flex-shrink-0" />}
          </button>
        ))}
      </div>
      </main>
    </div>
  );
}
