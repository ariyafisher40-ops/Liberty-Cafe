import { LogOut, MapPin, Package, User, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { PublicLayout } from './PublicLayout';

const ACCOUNT_LINKS = [
  { to: '/account', label: 'Overview', icon: User, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/profile', label: 'Profile', icon: UserCheck },
];

export function AccountLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { profile, email, signOut, isPreviewSession } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-[#343238] pb-6">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">
            Customer Account{isPreviewSession ? ' · Local Preview Session' : ''}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[#AAA69C]">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-lg border border-[#343238] bg-[#151518] p-4">
              <div className="border-b border-[#343238] pb-4">
                <p className="font-semibold text-[#F7F5EF]">
                  {profile?.full_name || 'Liberty Guest'}
                </p>
                {email && <p className="truncate text-xs text-[#AAA69C]">{email}</p>}
              </div>

              <nav aria-label="Account sections" className="mt-3 flex flex-col gap-1">
                {ACCOUNT_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-2 flex items-center gap-2.5 rounded-md border-t border-[#343238] px-3 pt-3 pb-2 text-left text-sm font-medium text-[#E06A6A] transition-colors hover:bg-[#1D1D21]"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          <section className="lg:col-span-9">{children}</section>
        </div>
      </div>
    </PublicLayout>
  );
}
