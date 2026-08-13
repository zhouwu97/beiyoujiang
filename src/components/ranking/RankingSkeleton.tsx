'use client';

import styles from './ranking.module.css';

/**
 * 首次进入榜单时的骨架屏：Top1 + Top2/3 + 6 行列表，避免白屏 spinner。
 */
export default function RankingSkeleton() {
  return (
    <div className="space-y-4" aria-label="榜单加载中" role="status">
      {/* Top 1 */}
      <div className={`flex items-center gap-6 rounded-[22px] p-6 ${styles.topFeature}`}>
        <div className={`skeleton h-36 w-36 rounded-[18px] sm:h-40 sm:w-40 ${styles.topFeatureImage}`} />
        <div className={`min-w-0 flex-1 ${styles.topFeatureContent}`}>
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton mt-3 h-6 w-48 rounded-full" />
          <div className="skeleton mt-3 h-3 w-32 rounded-full" />
          <div className="mt-6 flex gap-8">
            <div className="skeleton h-8 w-12 rounded-full" />
            <div className="skeleton h-8 w-12 rounded-full" />
            <div className="skeleton h-8 w-12 rounded-full" />
          </div>
        </div>
      </div>

      {/* Top 2 / Top 3 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-[18px] border border-[var(--line)] bg-white p-4">
            <div className="skeleton h-11 w-11 rounded-[12px]" />
            <div className="skeleton h-[88px] w-[88px] rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-28 rounded-full" />
              <div className="skeleton h-3 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* 4+ 列表 */}
      <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white/90">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-4 last:border-b-0"
          >
            <div className="skeleton h-4 w-6 rounded-full" />
            <div className="skeleton h-[72px] w-[72px] rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-32 rounded-full" />
              <div className="skeleton h-3 w-24 rounded-full" />
            </div>
            <div className="skeleton h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
