import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { Web3Provider } from "@/components/web3/Web3Provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata = {
  title: "GenLoop - AI智能交配市场",
  description: "发现、采集、合并独特的AI基因，构建属于你的智能生态系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body bg-bg-dark text-white min-h-screen`}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
