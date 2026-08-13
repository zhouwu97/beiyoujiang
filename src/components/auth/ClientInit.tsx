'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, setTourist } from '@/stores/auth';
import { addTourist } from '@/lib/api';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import AdultVerifyModal from '@/components/common/AdultVerifyModal';

/**
 * 客户端初始化：
 * 1. 无用户态时后台注册游客账号（不阻塞首屏，迟到响应仍会更新游客态）
 * 2. 首次访问弹出成人认证弹窗（localStorage 'after_verify' 标记，不再重复弹）
 * 3. LoadingOverlay 仅覆盖首个渲染帧，页面立即显示
 */
export default function ClientInit() {
  const [initialized, setInitialized] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);

  useEffect(() => {
    // 游客注册放到后台执行：页面先渲染，接口响应到了再更新游客态。
    const { currentUser, currentTourist } = useAuthStore.getState();
    if (!currentUser && !currentTourist) {
      addTourist()
        .then((tourist) => setTourist(tourist))
        .catch(() => {
          // 游客注册失败不影响浏览模式。
        });
    }

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

    // 立即标记初始化完成，页面不再等待游客注册或 3.5s 超时。
    setInitialized(true);
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
