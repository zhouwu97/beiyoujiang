/**
 * beiyoujiang.com 论坛前端 - 认证状态管理
 *
 * 认证数据仍然写入官方约定的 currentUser/currentTourist，
 * 但通过 Zustand persist 的版本迁移统一管理，避免历史坏 JSON 让首屏白屏。
 */
import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { User, Tourist } from '@/lib/types';

const AUTH_VERSION = 2;

interface AuthState {
  currentUser: User | null;
  currentTourist: Tourist | null;
}

const EMPTY_AUTH: AuthState = { currentUser: null, currentTourist: null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseStoredValue(key: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) throw new Error('认证数据不是对象');
    return value;
  } catch {
    // 历史存储可能被手工编辑或被截断，清理后恢复匿名/游客模式。
    localStorage.removeItem(key);
    return null;
  }
}

function normalizeIdentity(value: Record<string, unknown>, isGuest: boolean): User | null {
  const id = Number(value.userId ?? value.touristId ?? value.id);
  const token = typeof value.token === 'string' ? value.token : '';
  if (!Number.isFinite(id) || id <= 0 || !token) return null;

  return {
    ...value,
    id,
    ...(isGuest ? { touristId: id, isGuest: true } : { userId: id, isGuest: false }),
  } as User;
}

const authStorage: PersistStorage<AuthState> = {
  getItem: (name): StorageValue<AuthState> | null => {
    if (typeof window === 'undefined') return null;

    if (name === 'auth-storage') {
      const user = parseStoredValue('currentUser');
      const tourist = parseStoredValue('currentTourist');
      const currentUser = user ? normalizeIdentity(user, false) : null;
      const currentTourist = tourist ? (normalizeIdentity(tourist, true) as Tourist | null) : null;

      // 正式用户优先；两者同时存在时清理游客，防止 token 取错。
      if (currentUser) {
        localStorage.removeItem('currentTourist');
        return { state: { currentUser, currentTourist: null }, version: AUTH_VERSION };
      }
      if (currentTourist) {
        localStorage.removeItem('currentUser');
        return { state: { currentUser: null, currentTourist }, version: AUTH_VERSION };
      }
      return null;
    }

    const value = parseStoredValue(name);
    return value ? { state: value as unknown as AuthState, version: AUTH_VERSION } : null;
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
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
      return;
    }
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    if (name === 'auth-storage') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentTourist');
    } else {
      localStorage.removeItem(name);
    }
  },
};

const useAuthStore = create<AuthState>()(
  persist<AuthState>(() => EMPTY_AUTH, {
    name: 'auth-storage',
    version: AUTH_VERSION,
    storage: authStorage,
    migrate: (persistedState) => {
      if (!isRecord(persistedState)) return EMPTY_AUTH;
      const currentUser = isRecord(persistedState.currentUser)
        ? normalizeIdentity(persistedState.currentUser, false)
        : null;
      const currentTourist = isRecord(persistedState.currentTourist)
        ? (normalizeIdentity(persistedState.currentTourist, true) as Tourist | null)
        : null;
      return currentUser
        ? { currentUser, currentTourist: null }
        : { currentUser: null, currentTourist };
    },
  })
);

function notifyAuthUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('authUpdated'));
}

function setAuthenticatedUser(user: User): void {
  useAuthStore.setState({
    currentUser: { ...user, userId: user.userId ?? user.id, isGuest: false },
    currentTourist: null,
  });
  notifyAuthUpdated();
}

function logout(): void {
  useAuthStore.setState(EMPTY_AUTH);
  notifyAuthUpdated();
}

/** 401 全局处理：清理失效会话，阻止旧 token 继续请求。 */
function expireAuth(): void {
  useAuthStore.setState(EMPTY_AUTH);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('authExpired'));
  notifyAuthUpdated();
}

function setTourist(tourist: Tourist): void {
  useAuthStore.setState({
    currentTourist: { ...tourist, touristId: tourist.touristId ?? tourist.id, isGuest: true },
    currentUser: null,
  });
  notifyAuthUpdated();
}

function getToken(): string | null {
  const state = useAuthStore.getState();
  return state.currentUser?.token ?? state.currentTourist?.token ?? null;
}

function getUserId(): number | null {
  const state = useAuthStore.getState();
  const raw = state.currentUser ?? state.currentTourist;
  if (!raw) return null;
  return raw.userId ?? raw.touristId ?? raw.id ?? null;
}

/** 响应式地读取当前会话 ID，页面不要再用一次性 getUserId() 驱动 UI。 */
function useCurrentUserId(): number | null {
  return useAuthStore((state) => {
    const raw = state.currentUser ?? state.currentTourist;
    return raw?.userId ?? raw?.touristId ?? raw?.id ?? null;
  });
}

export {
  useAuthStore,
  setAuthenticatedUser,
  logout,
  expireAuth,
  setTourist,
  getToken,
  getUserId,
  useCurrentUserId,
};
export type { AuthState };
