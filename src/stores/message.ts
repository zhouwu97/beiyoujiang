/**
 * beiyoujiang.com 论坛前端 - 消息未读状态管理
 * 轻量内存态（不持久化）：Header 红点与消息页共享。
 * 服务端无独立 unread count 接口，由 getAllMessages() 推导。
 */
import { create } from 'zustand';

interface MessageState {
  /** 是否有未读消息（Header 通知红点） */
  hasUnread: boolean;
  /** 是否已经有一次成功的检查结果 */
  checked: boolean;
  /** 最近一次成功检查时间，避免 SPA 会话永久使用旧红点。 */
  lastCheckedAt: number | null;
  setHasUnread: (value: boolean) => void;
  setChecked: (at?: number) => void;
  resetChecked: () => void;
}

const useMessageStore = create<MessageState>()((set) => ({
  hasUnread: false,
  checked: false,
  lastCheckedAt: null,
  setHasUnread: (value) => set({ hasUnread: value }),
  setChecked: (at = Date.now()) => set({ checked: true, lastCheckedAt: at }),
  resetChecked: () => set({ checked: false, lastCheckedAt: null }),
}));

export { useMessageStore };
export type { MessageState };
