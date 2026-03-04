'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectKitButton } from 'connectkit';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/market', label: '市场' },
  { href: '/training', label: '训练场' },
  { href: '/leaderboard', label: '排行榜' },
  { href: '/profile', label: '个人中心' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                GenLoop
              </span>
              <span className="ml-2 text-xs text-gray-500">3.0</span>
            </Link>

            <div className="hidden md:flex ml-10 space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <ConnectKitButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
