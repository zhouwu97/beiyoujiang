import type { Comment, Post } from '@/lib/types';

type Identity = {
  id?: number;
  userId?: number;
  isAdmin?: boolean;
} | null | undefined;

function identityId(identity: Identity): number | null {
  const id = identity?.userId ?? identity?.id;
  return typeof id === 'number' && Number.isFinite(id) ? id : null;
}

function isAdmin(identity: Identity): boolean {
  return identity?.isAdmin === true;
}

/** 帖子删除权限：管理员或帖子作者可以删除。 */
export function canDeletePost(post: Pick<Post, 'authorId'>, identity: Identity): boolean {
  return isAdmin(identity) || identityId(identity) === post.authorId;
}

/** 评论删除权限：管理员或评论作者可以删除。 */
export function canDeleteComment(comment: Pick<Comment, 'authorId'>, identity: Identity): boolean {
  return isAdmin(identity) || identityId(identity) === comment.authorId;
}

/** 需要后台管理能力的操作只向管理员开放；最终权限仍以服务端校验为准。 */
export function canModerate(identity: Identity): boolean {
  return isAdmin(identity);
}
