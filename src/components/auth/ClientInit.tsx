'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, setTourist } from '@/stores/auth';
import { addTourist } from '@/lib/api';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import AdultVerifyModal from '@/components/common/AdultVerifyModal';

/**
 * 客户端初始化：
 * 1. 无用户态时自动注册游客账号（与官方行为一致）
 * 2. 首次访问弹出成人认证弹窗（localStorage 'after_verify' 标记，不再重复弹）
 * 3. 初始化期间显示 LoadingOverlay
 */
export default function ClientInit() {
  const [initialized, setInitialized] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { currentUser, currentTourist } = useAuthStore.getState();
        if (!currentUser && !currentTourist) {
          try {
            const tourist = await addTourist();
            setTourist(tourist);
          } catch {
            // 游客注册失败静默，仅展示模式无游客态也能浏览
          }
        }
      } finally {
        setInitialized(true);
      }
    };

    init();

    // 成人认证：仅在客户端判断
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem('after_verify')) {
        // localStorage 是客户端外部状态，只能在 hydration 后同步弹窗状态。
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNeedVerify(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleConfirm = () => {
    try {
      localStorage.setItem('after_verify', '1');
    } catch {
      /* ignore */
    }
    setNeedVerify(false);
  };

  return (
    <>
      <LoadingOverlay show={!initialized} />
      <AdultVerifyModal open={needVerify && initialized} onConfirm={handleConfirm} />
    </>
  );
}
