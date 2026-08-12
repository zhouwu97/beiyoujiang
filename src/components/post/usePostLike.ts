'use client';

import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { Post } from '@/lib/types';
import { likePost, unlikePost } from '@/lib/api';
import { useRewardToast } from '@/components/common/RewardToast';

/**
 * 帖子点赞乐观更新逻辑（PostCard / FeaturePostCard 共用）。
 * 失败时回滚本地状态；调用方负责 stopPropagation（事件本身在组件内处理）。
 */
export function usePostLike(post: Post) {
  const { show: showReward } = useRewardToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [liking, setLiking] = useState(false);

  const handleLike = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (liking) return;

    setLiking(true);
    setLiked(!liked);
    setLikeCount((count) => (liked ? count - 1 : count + 1));

    try {
      if (liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
        showReward('点赞成功');
      }
    } catch {
      setLiked(liked);
      setLikeCount((count) => (liked ? count + 1 : count - 1));
    } finally {
      setLiking(false);
    }
  };

  return { liked, likeCount, liking, handleLike };
}
