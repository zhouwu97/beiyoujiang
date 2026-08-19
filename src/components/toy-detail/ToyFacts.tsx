'use client';

import type { ToyDetail } from '@/lib/types';
import { categoryLabel, stimulationLabel } from '@/lib/toyLabels';
import styles from './toy-detail.module.css';

interface ToyFactsProps {
  toy: ToyDetail;
}

/**
 * 条目信息：四格 fact grid + 商城链接 + 说明。右侧不单独做外卡片。
 */
export default function ToyFacts({ toy }: ToyFactsProps) {
  return (
    <section className={styles.sideCard} aria-label="条目信息">
      <div className={styles.sideHead}>
        <strong>条目信息</strong>
        <span>INFO</span>
      </div>

      <div className={styles.factGrid}>
        {toy.merchant && (
          <div className={styles.fact}>
            <span>品牌</span>
            <b>{toy.merchant}</b>
          </div>
        )}
        {toy.releaseYear && (
          <div className={styles.fact}>
            <span>年份</span>
            <b>{toy.releaseYear}</b>
          </div>
        )}
        <div className={styles.fact}>
          <span>类别</span>
          <b>{categoryLabel(toy.category)}</b>
        </div>
        <div className={styles.fact}>
          <span>刺激度</span>
          <b>{stimulationLabel(toy.stimulation)}</b>
        </div>
      </div>

      {toy.shopLink && (
        <a href={toy.shopLink} target="_blank" rel="noopener noreferrer" className={styles.shopBuy}>
          前往商城购买
        </a>
      )}

      <p className={styles.note}>
        评分、想中与测评量作为社区信息展示。右侧信息与测评区共用同一内容容器，保持阅读基线一致。
      </p>
    </section>
  );
}
