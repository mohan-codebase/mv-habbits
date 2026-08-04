'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, Sparkles } from 'lucide-react';

const PAGES = [
  { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard, exact: true },
  { label: 'Habits',       href: '/dashboard/habits',       icon: Dumbbell,        exact: false },
  { label: 'Quotes',       href: '/dashboard/quotes',       icon: Sparkles,        exact: false },
  { label: 'Analytics',    href: '/dashboard/analytics',    icon: BarChart2,       exact: false },
  { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy,          exact: false },
  { label: 'Settings',     href: '/dashboard/settings',     icon: Settings2,       exact: false },
];

export default function SubNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="h-11 px-4 flex items-center gap-0.5 bg-bg-secondary border-b border-border-subtle overflow-x-auto [scrollbar-width:none]">
      {PAGES.map(({ label, href, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link key={href} href={href} className="no-underline shrink-0">
            <div
              className={`flex items-center gap-[5px] px-[11px] py-[5px] rounded-sm cursor-pointer transition-all duration-150 whitespace-nowrap border-b-2 ${
                active
                  ? 'bg-[var(--accent-glow-md)] text-accent-primary font-bold border-accent-primary'
                  : 'bg-transparent text-text-muted font-medium border-transparent'
              }`}
            >
              <Icon size={13} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[12px]">{label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
