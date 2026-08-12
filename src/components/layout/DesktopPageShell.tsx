import type { ReactNode } from 'react';

interface DesktopPageShellProps {
  /** 左栏（社区导航），>=1280px 显示 */
  left?: ReactNode;
  /** 中央主内容，始终显示 */
  main: ReactNode;
  /** 右栏，>=900px 显示 */
  right?: ReactNode;
}

/**
 * 统一桌面布局壳（首页 / 榜单共用），只负责布局，不含业务。
 *
 * 断点规则（列宽定义在 globals.css .main-grid，此处只提供三块内容）：
 *  <900        单栏（Feed only，左右栏均隐藏）
 *  900~1279    Feed + 右栏（左栏隐藏）
 *  1280~1535   190px | Feed | 270px，gap 16
 *  >=1536      208px | Feed | 292px，gap 18
 *
 * 整体宽度跟随 .shell-width：<1280 保持原样（不动移动端），
 * 1280~1535 为 min(1440px, calc(100% - 32px))，>=1536 为 min(1440px, calc(100% - 40px))。
 *
 * Sticky 注意：sticky + self-start 必须放在 grid item 自身
 * （.main-left-col / .main-right-col）。不能放在内部子元素上——self-start 会让
 * item 收缩到内容高度，内部子元素的 sticky 会因为没有可移动空间而失效
 * （整栏跟着页面滚走）。右栏可能超过一屏：.main-right-col 自身限高并内部滚动
 * （滚动条隐藏）。
 */
export default function DesktopPageShell({ left, main, right }: DesktopPageShellProps) {
  return (
    <div className="shell-width pt-6 pb-[72px]">
      <div className="main-grid">
        {left ? <div className="main-left-col">{left}</div> : null}
        <div className="min-w-0">{main}</div>
        {right ? <div className="main-right-col">{right}</div> : null}
      </div>
    </div>
  );
}
