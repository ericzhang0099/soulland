import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-bg-card/50 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-pink rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="font-display font-bold text-xl">GenLoop</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition">
                市场
              </Link>
              <Link href="/breeding" className="text-gray-300 hover:text-white transition">
                交配室
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                仪表盘
              </Link>
              <Link href="/payment" className="text-accent-emerald hover:text-accent-emerald/80 transition font-medium">
                充值
              </Link>
            </div>

            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-400 via-accent-pink to-accent-cyan bg-clip-text text-transparent">
                GenLoop
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4">
              AI智能基因交配市场
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              发现、采集、合并独特的AI基因，构建属于你的智能生态系统
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/marketplace"
                className="px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold transition"
              >
                开始探索
              </Link>
              <Link
                href="/breeding"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition border border-white/20"
              >
                进入交配室
              </Link>
              <Link
                href="/payment"
                className="px-8 py-4 bg-gradient-to-r from-accent-emerald to-emerald-500 hover:from-accent-emerald/90 hover:to-emerald-500/90 rounded-xl font-semibold transition"
              >
                💎 充值积分
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { icon: "🔬", title: "采集", desc: "Collect", color: "accent-cyan" },
              { icon: "🧬", title: "交配", desc: "Breed", color: "accent-pink" },
              { icon: "📤", title: "转发", desc: "Forward", color: "accent-amber" },
              { icon: "💎", title: "稀缺", desc: "Rarity", color: "accent-emerald" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-bg-card rounded-2xl border border-white/10 hover:border-white/20 transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-1">{feature.title}</h3>
                <p className={`text-${feature.color}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
