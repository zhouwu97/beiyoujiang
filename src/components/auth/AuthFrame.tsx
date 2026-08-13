import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthFrameProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * 认证页共用外壳：让登录、注册、找回密码保持同一套品牌层级与表单节奏。
 */
export default function AuthFrame({ title, description, children, footer }: AuthFrameProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white/95">
        <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-[20px] font-bold tracking-[-0.06em] text-[#202024]">杯友酱</span>
            <span className="text-[10px] font-medium tracking-[0.12em] text-[#a1a1aa]">社区</span>
          </Link>
          <Link href="/" className="text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
            返回首页
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1080px] gap-8 px-5 py-8 sm:px-8 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:py-12">
        <section className="hidden lg:block">
          <div className="max-w-[420px]">
            <p className="text-[13px] font-semibold tracking-[0.12em] text-[var(--accent)]">杯友酱社区</p>
            <h2 className="mt-4 text-[38px] font-bold leading-[1.18] tracking-[-0.04em] text-[#202024]">
              真实分享，
              <br />
              慢慢交流。
            </h2>
            <p className="mt-5 max-w-[320px] text-[14px] leading-7 text-[#777780]">
              从一个问题开始，记录体验，也找到愿意认真回复的杯友。
            </p>

            <div className="mt-10 space-y-4 border-l border-[#f6b4c3] pl-4 text-[13px] text-[var(--muted)]">
              <p>发布自己的体验与问题</p>
              <p>参与板块讨论和回复</p>
              <p>同步个人内容与互动</p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[420px] justify-self-center rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-[0_16px_40px_rgba(27,27,38,0.06)] sm:p-8">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#202024]">{title}</h1>
            <p className="mt-2 text-[13px] text-[var(--muted)]">{description}</p>
          </div>

          <div className="mt-8">{children}</div>
          <div className="mt-7 text-center">{footer}</div>
        </section>
      </main>
    </div>
  );
}
