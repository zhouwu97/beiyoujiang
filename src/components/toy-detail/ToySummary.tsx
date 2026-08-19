'use client';

import type { ToyDetail } from '@/lib/types';
import styles from './toy-detail.module.css';

interface ToySummaryProps {
  toy: ToyDetail;
}

/**
 * 商品信息文本块：topline / 名称 / 品牌年份 / 标签 / 简介 / 规格。
 * 标签为小圆角矩形（12~14px），不 pill 化。
 */
export default function ToySummary({ toy }: ToySummaryProps) {
  const tags = (toy.tags ?? '').split(/[,，]/).filter(Boolean);

  return (
    <>
      <div className={styles.topline}>
        <span>{toy.merchant ? `${toy.merchant} · ` : ''}PRODUCT DETAIL</span>
        <span className={styles.communityMark}>
          <i />
          社区收录
        </span>
      </div>

      <h1 className={styles.name}>{toy.name}</h1>
      {(toy.merchant || toy.releaseYear) && (
        <p className={styles.merchant}>
          {toy.merchant}
          {toy.releaseYear ? ` · ${toy.releaseYear}` : ''}
        </p>
      )}

      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      <p className={styles.desc}>{toy.description || toy.detail || '暂无描述'}</p>
    </>
  );
}
