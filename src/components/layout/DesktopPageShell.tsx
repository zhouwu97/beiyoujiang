import type { ReactNode } from 'react';

interface DesktopPageShellProps {
  /** 左栏（社区导航），>=1280px 显示 */
  left?: ReactNode;
  /** 中央主内容，始终显示 */
  main: ReactNode;
  /** 右栏，>=1024px 显示 */
  right?: ReactNode;
}

/**
 * 统一桌面布局壳（首页 / 榜单共用），只负责布局，不含业务。
 *
 * 断点规则（对齐参考稿）：
 *  <1024       单栏，左右栏均隐藏
 *  1024~1279   main + 右栏（左栏隐藏）
 *  1280~1535   200px | main | 280px，gap 20px
 *  >=1536      218px | main | 306px，gap 24px
 *
 * 整体宽度始终 width:min(1380px,calc(100% - 48px))，不再叠加内层 padding，
 * 避免真实内容宽度与参考发生漂移。
 */
export default function DesktopPageShell({ left, main, right }: DesktopPageShellProps) {
  return (
    <div className="shell-width pt-6 pb-[72px]">
      <div className="main-grid grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[200px_minmax(0,1fr)_280px] 2xl:grid-cols-[218px_minmax(0,1fr)_306px] 2xl:gap-6">
        {left ? (
          <div className="hidden min-w-0 xl:block xl:self-stretch">{left}</div>
        ) : null}
        <div className="min-w-0">{main}</div>
        {right ? (
          <div className="hidden min-w-0 lg:block lg:self-stretch">{right}</div>
        ) : null}
      </div>
    </div>
  );
}
