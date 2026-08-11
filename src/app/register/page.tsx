'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register as registerRequest } from '@/lib/api';
import { setAuthenticatedUser } from '@/stores/auth';
import { useCustomAlert } from '@/components/common/CustomAlert';
import AuthFrame from '@/components/auth/AuthFrame';

/**
 * 注册页：邮箱 + 昵称 + 密码。
 */
export default function RegisterPage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password) {
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
      const user = await registerRequest(email.trim(), password, username.trim());
      setAuthenticatedUser(user);
      showAlert('注册成功，欢迎加入杯友酱~');
      setTimeout(() => router.push('/'), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message.replace('API Error: ', '') : '注册失败';
      showAlert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title="加入杯友酱"
      description="注册正式账号，解锁全部功能"
      footer={
        <p className="text-[13px] text-[#929292]">
          已有账号?
          <button onClick={() => router.push('/login')} className="ml-1 font-medium text-[#FB7299]">
            去登录
          </button>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleRegister();
        }}
        className="space-y-4"
      >
        <div className="auth-field">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="邮箱" className="auth-input" />
        </div>

        <div className="auth-field">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="昵称（展示给杯友）" className="auth-input" />
        </div>

        <div className="auth-field">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPwd ? 'text' : 'password'}
            placeholder="密码（至少6位）"
            className="auth-input"
          />
          <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-[12px] text-[#929292] transition-colors hover:text-[#FB7299]" aria-label="显示密码">
            {showPwd ? '隐藏' : '显示'}
          </button>
        </div>

        <div className="auth-field">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type={showPwd ? 'text' : 'password'}
            placeholder="确认密码"
            className="auth-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '注册中...' : '注 册'}
        </button>
      </form>
    </AuthFrame>
  );
}
