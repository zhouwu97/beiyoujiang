'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, getApiErrorMessage, login as loginRequest } from '@/lib/api';
import { setAuthenticatedUser } from '@/stores/auth';
import { useCustomAlert } from '@/components/common/CustomAlert';
import AuthFrame from '@/components/auth/AuthFrame';

/**
 * 登录页：邮箱 + 密码。
 */
export default function LoginPage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const user = await loginRequest(email.trim(), password);
      setAuthenticatedUser(user);
      showAlert('登录成功，欢迎回来~');
      setTimeout(() => router.push('/'), 600);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.code === 'BANNED') {
        showAlert('账号已被封禁');
      } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        showAlert(err.message || '邮箱或密码错误');
      } else {
        showAlert(getApiErrorMessage(err, err instanceof Error ? err.message : '登录失败'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title="欢迎回到杯友酱"
      description="登录后继续参与社区交流"
      footer={
        <p className="text-[13px] text-[var(--muted)]">
          还没有账号?
          <button onClick={() => router.push('/register')} className="ml-1 font-medium text-[var(--accent)]">
            立即注册
          </button>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleLogin();
        }}
        className="space-y-4"
      >
        <div className="auth-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="邮箱"
            aria-label="邮箱"
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPwd ? 'text' : 'password'}
            placeholder="密码"
            aria-label="密码"
            className="auth-input"
          />
          <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--accent)]" aria-label="显示密码">
            {showPwd ? '隐藏' : '显示'}
          </button>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => router.push('/resetPassword')}
            className="text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            忘记密码?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '登录中...' : '登 录'}
        </button>
      </form>
    </AuthFrame>
  );
}
