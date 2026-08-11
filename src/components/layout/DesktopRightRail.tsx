'use client';

import { useRouter } from 'next/navigation';
import { useForumStore, reset, setPlate } from '@/stores/forum';
import { PLATES } from '@/lib/types';
import type { Plate } from '@/lib/types';

function ArrowIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
}

export default function DesktopRightRail() {
  const router = useRouter();
  const plate = useForumStore((state) => state.plate);
  const sort = useForumStore((state) => state.sort);
  const postsCache = useForumStore((state) => state.postsCache);
  const posts = postsCache[`${plate}-${sort}`] ?? [];
  const recentPosts = posts.slice(0, 4);

  const handlePlateClick = (nextPlate: Plate) => {
    if (nextPlate === plate) return;
    setPlate(nextPlate);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="sticky top-[92px] hidden space-y-3.5 xl:block">
      <section className="rail-panel p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="rail-kicker">实时动态</div>
            <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">刚刚更新</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />实时</span>
        </div>
        <div className="mt-4 space-y-4">
          {recentPosts.length > 0 ? recentPosts.map((post, index) => (
              <button key={post.id} onClick={() => router.push(`/messageDetail/${post.id}`)} className="right-feed-item group flex w-full items-start gap-2.5 text-left">
              <span className="mt-0.5 min-w-[19px] text-[10px] font-bold tracking-[0.1em] text-[var(--muted-light)] group-hover:text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-[var(--ink-soft)] transition-colors duration-150 group-hover:text-[var(--accent-ink)]">{post.title}</span>
                <span className="mt-1 block text-[10px] text-[var(--muted)]">{post.commentCount ?? 0} 条回复 · {post.timeAgo ?? '刚刚'}</span>
              </span>
            </button>
          )) : (
            <p className="py-4 text-[11px] leading-5 text-[var(--muted)]">帖子加载后，这里会显示最近更新。</p>
          )}
        </div>
      </section>

      <section className="rail-panel p-4">
        <div className="rail-kicker">社区导航</div>
        <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">浏览板块</h2>
        <div className="mt-3 space-y-1">
          {PLATES.map((item) => {
            const isActive = item.id === plate;
            return (
              <button key={item.id} onClick={() => handlePlateClick(item.id)} className="rail-board-link group flex w-full items-center justify-between rounded-[11px] px-3 py-2.5 text-left" data-active={isActive}>
                <span className={`text-[12px] font-semibold ${isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-soft)]'}`}>{item.name}</span>
                <span className={isActive ? 'text-[var(--accent)]' : 'text-[var(--muted-light)]'}><ArrowIcon /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cta-panel p-4">
        <div className="rail-kicker !text-[#ccb5bc]">参与讨论</div>
        <h2 className="mt-2 text-[16px] font-bold tracking-[-0.02em]">有话想说？</h2>
        <p className="mt-2 text-[11px] leading-5 text-[#cdbdc1]">把你的体验和问题留在社区，和杯友一起交流。</p>
        <button onClick={() => router.push('/postMessage')} className="cta-button interactive-press mt-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          发布新帖
        </button>
      </section>
    </aside>
  );
}
