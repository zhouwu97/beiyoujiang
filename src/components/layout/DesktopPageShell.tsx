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
 * 断点规则：
 *  <1024       单栏，左右栏均隐藏
 *  1024~1279   main + 右栏（左栏隐藏）
 *  1280~1535   200px | main | 280px，gap 20px
 *  >=1536      220px | main | 300px，gap 24px，最大宽度 1420px
 */
export default function DesktopPageShell({ left, main, right }: DesktopPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1420px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="main-grid grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-5 xl:grid-cols-[200px_minmax(0,1fr)_280px] xl:gap-5 2xl:grid-cols-[220px_minmax(0,1fr)_300px] 2xl:gap-6">
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
