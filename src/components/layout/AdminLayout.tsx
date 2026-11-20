import {
  ClipboardList,
  Coffee,
  ExternalLink,
  FolderTree,
  Image,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareText,
  PlusSquare,
  Settings,
  Tag,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { env } from '../../lib/env';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/products', label: 'Products', icon: Coffee },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/add-ons', label: 'Add-ons', icon: PlusSquare },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/delivery-zones', label: 'Delivery Zones', icon: MapPinned },
  { to: '/admin/tables', label: 'Tables', icon: UtensilsCrossed },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navList = (
    <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#1D1D21] text-[#E7CB78]'
                  : 'text-[#AAA69C] hover:bg-[#1D1D21] hover:text-[#F7F5EF]'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0B0D] text-[#F7F5EF]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#343238] bg-[#151518] lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-[#343238] px-5">
          <Link
            to="/"
            className="font-display text-base font-semibold tracking-[0.14em] text-[#F7F5EF]"
          >
            LIBERTY CAFE
          </Link>
          <span className="text-[11px] font-semibold text-[#D4AF37]">Admin</span>
        </div>

        {navList}

        <div className="border-t border-[#343238] p-4 text-xs">
          <p className="truncate font-semibold text-[#F7F5EF]">
            {profile?.full_name || 'Staff Admin'}
          </p>
          <p className="text-[#AAA69C]">
            {env.isSupabaseConfigured ? 'Supabase RLS Protected' : 'Local Preview Mode'}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-[#AAA69C] hover:text-[#E7CB78]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Storefront
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-[#E06A6A] hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-[#343238] bg-[#151518]">
            <div className="flex h-16 items-center justify-between border-b border-[#343238] px-4">
              <span className="font-display text-base font-semibold tracking-[0.14em] text-[#F7F5EF]">
                LIBERTY ADMIN
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close admin menu"
                className="rounded p-1.5 text-[#AAA69C] hover:text-[#F7F5EF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navList}
            <div className="border-t border-[#343238] p-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 text-sm font-medium text-[#E06A6A]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-[#343238] bg-[#0B0B0D]/95 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open admin navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#343238] bg-[#151518] text-[#F7F5EF] lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-semibold text-[#F7F5EF] sm:text-2xl">
                {title}
              </h1>
              {subtitle && <p className="truncate text-xs text-[#AAA69C]">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {action}
            <Link
              to="/"
              className="hidden rounded-md border border-[#343238] bg-[#151518] px-3 py-2 text-xs font-medium text-[#AAA69C] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F7F5EF] sm:inline-flex whitespace-nowrap shrink-0"
            >
              View Site
            </Link>
          </div>
        </header>

        {!env.isSupabaseConfigured && (
          <div className="border-b border-[#343238] bg-[#151518] px-4 py-2.5 text-xs text-[#AAA69C] sm:px-6 lg:px-8">
            <span className="font-semibold text-[#E7CB78]">Local Preview Mode:</span> Admin edits
            are stored in browser session storage for UI review and are not saved to a live
            Supabase database yet.
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
