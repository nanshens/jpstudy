import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Languages, Compass, ListChecks, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/kana', label: '五十音', icon: Languages },
  { to: '/verbs', label: '动词变形', icon: Wand2 },
  { to: '/scenarios', label: '场景', icon: Compass },
  { to: '/mixed-test', label: '综合测试', icon: ListChecks },
];

export function AppShell() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md hidden md:flex items-center h-14 px-6 gap-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🎌</span>
          <span>JP Study</span>
          <span className="text-xs text-muted-foreground font-normal">场景化日语</span>
        </NavLink>
        <nav className="flex items-center gap-1 ml-6">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                  isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted',
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto text-xs text-muted-foreground hidden lg:block">
          📍 日本 / 驾考特训模式
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md flex items-center h-12 px-4">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">🎌</span>
          <span>JP Study</span>
        </NavLink>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5 h-16">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
