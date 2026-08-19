import type { Metadata } from "next";
import "./globals.css";
import ClientInit from "@/components/auth/ClientInit";
import { CustomAlertProvider } from "@/components/common/CustomAlert";
import { RewardToastProvider } from "@/components/common/RewardToast";

export const metadata: Metadata = {
  title: "杯友酱 - 杯友的真实分享聚集地",
  description:
    "欢迎来到杯友酱！这里是杯友的真实分享聚集地，也是全网活跃飞机杯友用户最多的倒模名器与玩具交流论坛。",
  keywords: "飞机杯,倒模,名器,杯友酱,交流论坛,测评,体验报告",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="app-body min-h-full flex flex-col">
        <CustomAlertProvider>
          <RewardToastProvider>
            <ClientInit />
            <main className="flex-1 w-full min-h-screen pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-0">
              {children}
            </main>
          </RewardToastProvider>
        </CustomAlertProvider>
      </body>
    </html>
  );
}
