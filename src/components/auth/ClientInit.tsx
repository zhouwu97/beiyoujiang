'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, setTourist } from '@/stores/auth';
import { addTourist } from '@/lib/api';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import AdultVerifyModal from '@/components/common/AdultVerifyModal';

const TOURIST_INITIALIZATION_TIMEOUT = 3500;

/**
 * 游客接口异常时允许页面继续展示；迟到的接口响应仍会照常更新游客态。
 */
function registerTouristWithoutBlockingPage(): Promise<void> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(resolve, TOURIST_INITIALIZATION_TIMEOUT);

    addTourist()
      .then((tourist) => setTourist(tourist))
      .catch(() => {
        // 游客注册失败不影响浏览模式。
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        resolve();
      });
  });
}

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
          await registerTouristWithoutBlockingPage();
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
