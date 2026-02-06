'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Gift, 
  Settings,
  LogOut,
  Menu,
  X,
  QrCode,
  BarChart3,
  Bot
} from 'lucide-react';

const navItems = [
  { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/feedbacks', label: 'Feedbacks', icon: MessageSquare },
  { href: '/manager/prizes', label: 'Lots', icon: Gift },
  { href: '/manager/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/manager/qrcode', label: 'QR Code', icon: QrCode },
  { href: '/manager/messaging', label: 'Assistant IA', icon: Bot },
  { href: '/manager/settings', label: 'Paramètres', icon: Settings },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'MANAGER') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">🍽️ VraisAvis</span>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 border-b hidden lg:block">
            <h1 className="font-bold text-xl">🍽️ VraisAvis</h1>
            <p className="text-sm text-muted-foreground">Manager</p>
          </div>
          
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <div className="mb-3">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
