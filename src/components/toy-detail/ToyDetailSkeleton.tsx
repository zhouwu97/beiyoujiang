'use client';

/**
 * 详情页首屏骨架：Gallery / Title / Tags / Desc / Metrics / Score / Reviews 尺寸与正式内容接近，
 * 数据到达后避免明显 layout shift。
 */
export default function ToyDetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="商品加载中" role="status">
      {/* Hero */}
      <div className="grid overflow-hidden rounded-[30px] border border-[var(--line)] bg-white shadow-[var(--shadow-sm)] lg:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.65fr)]">
        {/* Gallery */}
        <div className="min-h-[520px] bg-[#f0eeec] p-6">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-28 rounded-full" />
            <div className="skeleton h-3 w-10 rounded-full" />
          </div>
          <div className="flex min-h-[400px] items-center justify-center py-4">
            <div className="skeleton h-72 w-72 rounded-[18px]" />
          </div>
          <div className="flex gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[58px] w-[58px] rounded-[16px]" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-8">
          <div className="skeleton h-3 w-32 rounded-full" />
          <div className="skeleton mt-4 h-8 w-2/3 rounded-full" />
          <div className="skeleton mt-3 h-3 w-24 rounded-full" />
          <div className="mt-5 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-7 w-16 rounded-[13px]" />
            ))}
          </div>
          <div className="mt-5 space-y-2">
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-5/6 rounded-full" />
            <div className="skeleton h-3 w-4/6 rounded-full" />
          </div>
          <div className="skeleton mt-5 h-24 w-full rounded-[18px]" />
          <div className="skeleton mt-4 h-28 w-full rounded-[18px]" />
        </div>
      </div>

      {/* Lower */}
      <div className="grid overflow-hidden rounded-[28px] border border-[var(--line)] bg-white lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="p-6">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton h-10 w-10 rounded-[14px]" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="skeleton h-3.5 w-40 rounded-full" />
                  <div className="skeleton h-3 w-64 max-w-full rounded-full" />
                  <div className="skeleton h-3 w-48 max-w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden border-l border-[var(--line)] bg-[#fbfaf9] p-5 lg:block">
          <div className="skeleton h-4 w-20 rounded-full" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-16 w-16 rounded-[16px]" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-24 rounded-full" />
                  <div className="skeleton h-3 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
