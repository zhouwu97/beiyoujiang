'use client';

import { useState } from 'react';
import ToyImage from '@/components/toy/ToyImage';
import styles from './toy-detail.module.css';

interface ToyGalleryProps {
  images: string[];
  name: string;
}

/**
 * 商品图库：大图 contain 优先（禁止 cover 裁切），缩略图 contain。
 * 图集索引为组件内部状态；页面仅在商品加载完成后渲染本组件，
 * 切换商品时组件随 loading 卸载重挂，索引自动回到第一张。
 */
export default function ToyGallery({ images, name }: ToyGalleryProps) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = total > 0 ? images[index % total] : null;

  return (
    <section className={styles.gallery} aria-label="商品图库">
      <div className={styles.galleryTop}>
        <span>PRODUCT GALLERY</span>
        <span className="tabular-nums">
          {total > 0
            ? `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
            : '—'}
        </span>
      </div>

      <div className={styles.galleryStage}>
        <ToyImage src={current} alt={name} className={styles.productImage} loading="eager" />
      </div>

      <div className={styles.galleryBottom}>
        {total > 1 ? (
          <div className={styles.thumbs}>
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.thumb}${i === index ? ` ${styles.thumbActive}` : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`图片 ${i + 1}`}
                aria-pressed={i === index}
              >
                <ToyImage src={img} alt="" className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <span className={styles.galleryNote}>
          <b className={styles.galleryNoteStrong}>大图优先</b>
          <br />
          完整展示 · 不裁切
        </span>
      </div>
    </section>
  );
}
