'use client';

import styles from './ranking.module.css';

const TYPE_TABS = [
  { id: '', label: '综合热榜' },
  { id: 'ENTRY', label: '慢玩入门' },
  { id: 'ADVANCED', label: '进阶训练' },
  { id: 'HIGH', label: '超高刺激' },
  { id: 'EXTREME', label: '榨汁玩具' },
];

const CLASSIFY_TABS = [
  { id: '', label: '全部' },
  { id: 'CUP', label: '杯子' },
  { id: 'LARGE_MOLD', label: '大型倒模' },
  { id: 'HALF_BODY', label: '半身' },
];

interface RankingFiltersProps {
  type: string;
  classify: string;
  onTypeChange: (value: string) => void;
  onClassifyChange: (value: string) => void;
}

/**
 * 榜单筛选区：
 *  一级为导航式 Tab（active = 黑字 + 底部 accent 线）；
 *  二级为小圆角按钮。
 *  PC 端整条吸顶，移动端随页面滚动。
 */
export default function RankingFilters({
  type,
  classify,
  onTypeChange,
  onClassifyChange,
}: RankingFiltersProps) {
  return (
    <div className="z-20 border-b border-[var(--line)] bg-white/95 px-1 backdrop-blur xl:sticky xl:top-[76px]">
      <div className={styles.typeTabs} role="tablist" aria-label="榜单类型">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id || 'all'}
            type="button"
            role="tab"
            aria-selected={type === tab.id}
            className={styles.typeTab}
            data-active={type === tab.id}
            onClick={() => onTypeChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.classifyTabs}>
        {CLASSIFY_TABS.map((tab) => (
          <button
            key={tab.id || 'all'}
            type="button"
            className={styles.classifyTab}
            data-active={classify === tab.id}
            onClick={() => onClassifyChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
