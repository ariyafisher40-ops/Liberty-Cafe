import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useCart } from '../../features/cart/CartContext';
import { useSettings } from '../../features/settings/SettingsContext';

const PUBLIC_NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/offers', label: 'Offers' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const { itemCount, lastAddedMessage, clearLastAddedMessage } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
          scrolled
            ? 'border-[#343238] bg-[#0B0B0D]/95 backdrop-blur-sm'
            : 'border-[#343238]/60 bg-[#0B0B0D]/90'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-[0.14em] text-[#F7F5EF] transition-colors hover:text-[#E7CB78] whitespace-nowrap shrink-0 sm:text-xl"
          >
            {(settings.restaurant_name || 'LIBERTY CAFE').toUpperCase()}
          </Link>

          {/* Zone 2: Clean Typography Nav Links */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 md:flex"
          >
            {PUBLIC_NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#D4AF37] text-[#F7F5EF]'
                      : 'border-transparent text-[#AAA69C] hover:border-[#D4AF37]/40 hover:text-[#F7F5EF]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Primary Action & Account/Cart */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={isAdmin ? '/admin' : isAuthenticated ? '/account' : '/login'}
              className="hidden items-center gap-1.5 text-sm font-medium text-[#AAA69C] transition-colors hover:text-[#F7F5EF] whitespace-nowrap shrink-0 sm:inline-flex"
            >
              <User className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>{isAdmin ? 'Admin' : isAuthenticated ? 'Account' : 'Login'}</span>
            </Link>

            <Link
              to="/cart"
              aria-label={`Shopping cart with ${itemCount} items`}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#D4AF37]/60 bg-[#151518] px-3.5 py-2 text-xs font-semibold text-[#F7F5EF] transition-colors hover:bg-[#D4AF37] hover:text-[#0B0B0D] whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Cart</span>
              <span className="font-mono-tabular font-semibold">({itemCount})</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#343238] bg-[#151518] text-[#F7F5EF] transition-colors hover:border-[#D4AF37] md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <nav
            id="mobile-navigation-drawer"
            aria-label="Mobile Navigation"
            className="border-t border-[#343238] bg-[#151518] px-4 py-4 md:hidden"
          >
            <div className="flex flex-col space-y-1">
              {PUBLIC_NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1D1D21] text-[#E7CB78]'
                        : 'text-[#F7F5EF] hover:bg-[#1D1D21]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/track-order"
                className="rounded-md px-3 py-2.5 text-sm font-medium text-[#AAA69C] hover:bg-[#1D1D21] hover:text-[#F7F5EF]"
              >
                Track Order
              </Link>
              <Link
                to={isAuthenticated ? '/account' : '/login'}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-[#AAA69C] hover:bg-[#1D1D21] hover:text-[#F7F5EF]"
              >
                {isAuthenticated ? 'Customer Account' : 'Login / Sign Up'}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-md px-3 py-2.5 text-sm font-semibold text-[#D4AF37] hover:bg-[#1D1D21]"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Subtle Add-to-Cart confirmation toast */}
      {lastAddedMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-4 rounded-lg border border-[#D4AF37]/60 bg-[#1D1D21] px-4 py-3 text-sm text-[#F7F5EF] shadow-xl"
        >
          <span>{lastAddedMessage}</span>
          <Link
            to="/cart"
            onClick={clearLastAddedMessage}
            className="font-semibold text-[#E7CB78] underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            View Cart
          </Link>
        </div>
      )}
    </>
  );
}
