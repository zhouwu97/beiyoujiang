/**
 * beiyoujiang.com 论坛前端 - 认证状态管理
 * 使用 zustand + localStorage 持久化
 * localStorage key 与官方一致：正式用户=currentUser，游客=currentTourist
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tourist } from '@/lib/types';

interface AuthState {
  /** 正式登录用户（null 表示未登录） */
  currentUser: User | null;
  /** 游客对象（null 表示无游客会话） */
  currentTourist: Tourist | null;
}

const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    () => ({
      currentUser: null,
      currentTourist: null,
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name: string) => {
          if (name === 'auth-storage') {
            const user = localStorage.getItem('currentUser');
            const tourist = localStorage.getItem('currentTourist');
            if (user) {
              return { state: { currentUser: JSON.parse(user), currentTourist: null }, version: 0 };
            }
            if (tourist) {
              return { state: { currentUser: null, currentTourist: JSON.parse(tourist) }, version: 0 };
            }
            return null;
          }
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name: string, value: { state: AuthState; version?: number }) => {
          if (name === 'auth-storage') {
            if (value.state.currentUser) {
              localStorage.setItem('currentUser', JSON.stringify(value.state.currentUser));
              localStorage.removeItem('currentTourist');
            } else if (value.state.currentTourist) {
              localStorage.setItem('currentTourist', JSON.stringify(value.state.currentTourist));
              localStorage.removeItem('currentUser');
            } else {
              localStorage.removeItem('currentUser');
              localStorage.removeItem('currentTourist');
            }
          } else {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name: string) => {
          if (name === 'auth-storage') {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentTourist');
          } else {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);

/** 登录 - 设置正式用户 */
function setAuthenticatedUser(user: User): void {
  useAuthStore.setState({
    currentUser: { ...user, userId: user.userId ?? user.id },
    currentTourist: null,
  });
  notifyAuthUpdated();
}

/** 登出 - 清除所有认证状态 */
function logout(): void {
  useAuthStore.setState({ currentUser: null, currentTourist: null });
  notifyAuthUpdated();
}

/** 设置游客 */
function setTourist(tourist: Tourist): void {
  useAuthStore.setState({
    currentTourist: { ...tourist, touristId: tourist.touristId ?? tourist.id },
    currentUser: null,
  });
  notifyAuthUpdated();
}

/** 通知页面级组件同步头像、用户菜单等认证相关 UI。 */
function notifyAuthUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authUpdated'));
  }
}

/**
 * 获取当前有效 token
 * 优先级：正式用户 token > 游客 token > null
 */
function getToken(): string | null {
  const state = useAuthStore.getState();
  return state.currentUser?.token ?? state.currentTourist?.token ?? null;
}

/**
 * 获取当前用户 ID（API 参数 userId 用）
 * 官方 localStorage 字段名：正式用户 userId、游客 touristId；
 * 本地存储的接口返回对象统一用 id，这里兼容两种
 */
function getUserId(): number | null {
  const state = useAuthStore.getState();
  const raw = state.currentUser ?? state.currentTourist;
  if (!raw) return null;
  const id = (raw as unknown as { userId?: number }).userId
    ?? (raw as unknown as { touristId?: number }).touristId
    ?? raw.id;
  return id ?? null;
}

export { useAuthStore, setAuthenticatedUser, logout, setTourist, getToken, getUserId };
export type { AuthState };
