/**
 * beiyoujiang.com 论坛前端 - 消息未读状态管理
 * 轻量内存态（不持久化）：Header 红点与消息页共享。
 * 服务端无独立 unread count 接口，由 getAllMessages() 推导。
 */
import { create } from 'zustand';

interface MessageState {
  /** 是否有未读消息（Header 通知红点） */
  hasUnread: boolean;
  /** 会话内是否已向服务端查过初始未读状态（避免每次导航重复请求） */
  checked: boolean;
  setHasUnread: (value: boolean) => void;
  setChecked: () => void;
}

const useMessageStore = create<MessageState>()((set) => ({
  hasUnread: false,
  checked: false,
  setHasUnread: (value) => set({ hasUnread: value }),
  setChecked: () => set({ checked: true }),
}));

export { useMessageStore };
export type { MessageState };
