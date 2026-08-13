import type { ReactNode } from 'react';

interface DesktopPageShellProps {
  /** 左栏（社区导航），>=1280px 显示 */
  left?: ReactNode;
  /** 中央主内容，始终显示 */
  main: ReactNode;
  /** 右栏，>=900px 显示 */
  right?: ReactNode;
  /**
   * 布局变体：
   *  default：首页/社区（1024 起显示右栏，1280/1536 为 300/320px）
   *  ranking：榜单专用（1024~1279 不显示右栏；1280/1536 为 260/280px）
   */
  variant?: 'default' | 'ranking';
}

/**
 * 统一桌面布局壳（首页 / 榜单共用），只负责布局，不含业务。
 *
 * 断点规则（列宽定义在 globals.css .main-grid，此处只提供三块内容）：
 *  <768        单栏满宽（手机，无顶部留白，正文从 Header 下直接开始）
 *  768~1023    单栏居中 max-width 760
 *  1024~1279   Feed + 右栏（左栏隐藏）
 *  1280~1535   220px | Feed | 300px，gap 24
 *  >=1536      236px | Feed | 320px，gap 28
 *
 * 整体宽度跟随 .shell-width：<1280 保持原样（不动移动端），
 * 1280~1535 为 min(1400px, calc(100% - 32px))，>=1536 为 min(1440px, calc(100% - 40px))。
 *
 * Sticky 注意：sticky + self-start 必须放在 grid item 自身
 * （.main-left-col / .main-right-col）。不能放在内部子元素上——self-start 会让
 * item 收缩到内容高度，内部子元素的 sticky 会因为没有可移动空间而失效
 * （整栏跟着页面滚走）。右栏可能超过一屏：.main-right-col 自身限高并内部滚动
 * （滚动条隐藏）。
 */
export default function DesktopPageShell({ left, main, right, variant = 'default' }: DesktopPageShellProps) {
  const gridClass = variant === 'ranking' ? 'main-grid main-grid--ranking' : 'main-grid';
  return (
    <div className="shell-width pt-6 pb-[72px] max-md:pt-0">
      <div className={gridClass}>
        {left ? <div className="main-left-col">{left}</div> : null}
        <div className="min-w-0">{main}</div>
        {right ? <div className="main-right-col">{right}</div> : null}
      </div>
    </div>
  );
}
