'use client';

import Link from 'next/link';

const footerLinks = {
  product: [
    { label: '基因市场', href: '/market' },
    { label: '训练场', href: '/training' },
    { label: '排行榜', href: '/leaderboard' },
  ],
  resources: [
    { label: '文档', href: '/docs' },
    { label: 'API', href: '/api' },
    { label: 'GitHub', href: 'https://github.com/genloop' },
  ],
  community: [
    { label: 'Discord', href: 'https://discord.gg/genloop' },
    { label: 'Twitter', href: 'https://twitter.com/genloop' },
    { label: 'Telegram', href: 'https://t.me/genloop' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                GenLoop
              </span>
              <span className="ml-2 text-xs text-gray-500">3.0</span>
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              AI基因交易与进化平台
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">产品</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">资源</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">社区</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2026 GenLoop. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-500 hover:text-white text-sm">隐私政策</Link>
            <Link href="/terms" className="text-gray-500 hover:text-white text-sm">服务条款</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
