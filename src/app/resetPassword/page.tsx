'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendCode, resetPassword } from '@/lib/api';
import { useCustomAlert } from '@/components/common/CustomAlert';
import AuthFrame from '@/components/auth/AuthFrame';

/**
 * 找回密码：邮箱 + 验证码 + 新密码。
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      showAlert('请先输入邮箱');
      return;
    }
    setSending(true);
    try {
      await sendCode(email.trim());
      showAlert('验证码已发送，请查收邮件');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message.replace('API Error: ', '') : '发送失败';
      showAlert(msg);
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim() || !code.trim() || !password) {
      showAlert('请填写完整信息');
      return;
    }
    if (password.length < 6) {
      showAlert('密码至少6位');
      return;
    }
    if (password !== confirm) {
      showAlert('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), password);
      showAlert('密码重置成功，请重新登录');
      setTimeout(() => router.push('/login'), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message.replace('API Error: ', '') : '重置失败';
      showAlert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title="找回密码"
      description="通过邮箱验证码重置密码"
      footer={
        <button onClick={() => router.push('/login')} className="text-[13px] text-[var(--muted)]">
          想起密码了? <span className="text-[var(--accent)]">去登录</span>
        </button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleReset();
        }}
        className="space-y-4"
      >
        <div className="auth-field gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="注册邮箱"
            className="auth-input"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sending || countdown > 0}
            className="whitespace-nowrap text-[12px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)] disabled:text-[var(--muted)]"
          >
            {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '获取验证码'}
          </button>
        </div>

        <div className="auth-field">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="验证码" className="auth-input" />
        </div>

        <div className="auth-field">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="新密码（至少6位）"
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            placeholder="确认新密码"
            className="auth-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '提交中...' : '重置密码'}
        </button>
      </form>
    </AuthFrame>
  );
}
