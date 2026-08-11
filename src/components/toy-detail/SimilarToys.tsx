'use client';

import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { formatCount, normalizeImageList } from '@/lib/utils';
import ToyImage from '@/components/toy/ToyImage';
import styles from './toy-detail.module.css';

interface SimilarToysProps {
  toys: Toy[];
}

/**
 * 相似条目：软列表（无边框无背景），hover 浅灰圆角。
 */
export default function SimilarToys({ toys }: SimilarToysProps) {
  if (toys.length === 0) return null;

  return (
    <section className={`${styles.sideCard} ${styles.sideCardFirst}`} aria-label="相似条目">
      <div className={styles.sideHead}>
        <strong>相似条目</strong>
        <span>MORE</span>
      </div>
      <div className={styles.related}>
        {toys.map((item) => {
          const cover =
            normalizeImageList(item.coverUrl)[0] ?? normalizeImageList(item.weeklyTopImg)[0];
          return (
            <Link key={item.id} href={`/bang/${item.id}`} className={styles.relatedItem}>
              <span className={styles.relatedImg}>
                <ToyImage src={cover} alt={item.name} className="h-full w-full object-contain" />
              </span>
              <span className={styles.relatedCopy}>
                <b>{item.name}</b>
                <span>
                  {formatCount(item.wantCount ?? 0)} 想中 · {formatCount(item.reviewCount ?? 0)} 测评
                </span>
              </span>
              <span className={styles.relatedScore}>{item.rating ?? '—'}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
