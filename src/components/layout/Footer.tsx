import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useSettings } from '../../features/settings/SettingsContext';

export function Footer() {
  const { settings } = useSettings();
  const { isAdmin } = useAuth();

  return (
    <footer className="border-t border-[#343238] bg-[#0B0B0D] text-sm text-[#AAA69C]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link
              to="/"
              className="font-display text-lg font-semibold tracking-[0.14em] text-[#F7F5EF]"
            >
              {(settings.restaurant_name || 'LIBERTY CAFE').toUpperCase()}
            </Link>
            <p className="max-w-xs leading-relaxed text-[#AAA69C]">
              Artisan espresso, wood-fired classics, and evening dining crafted for Home Delivery,
              Takeaway, and Dine-in.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-[#F7F5EF]">Explore</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/menu" className="transition-colors hover:text-[#E7CB78]">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/offers" className="transition-colors hover:text-[#E7CB78]">
                  Offers
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors hover:text-[#E7CB78]">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-[#E7CB78]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-[#F7F5EF]">Ordering</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/cart" className="transition-colors hover:text-[#E7CB78]">
                  Your Cart
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="transition-colors hover:text-[#E7CB78]">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/account" className="transition-colors hover:text-[#E7CB78]">
                  Customer Account
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className="text-[#D4AF37] transition-colors hover:text-[#E7CB78]">
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-[#F7F5EF]">
              Cafe Information
            </h3>
            <p>{settings.address}</p>
            <p>{settings.city}</p>
            <p className="pt-1 text-[#F7F5EF]">{settings.opening_hours}</p>
            <p>Phone: {settings.phone}</p>
            {(settings.social_links.instagram || settings.social_links.facebook) && (
              <div className="flex items-center gap-4 pt-2">
                {settings.social_links.instagram && (
                  <a
                    href={settings.social_links.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E7CB78] underline underline-offset-4"
                  >
                    Instagram
                  </a>
                )}
                {settings.social_links.facebook && (
                  <a
                    href={settings.social_links.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E7CB78] underline underline-offset-4"
                  >
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#343238]/70 pt-6 text-xs text-[#AAA69C] sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {settings.restaurant_name || 'Liberty Cafe'}. All rights
            reserved.
          </p>
          <p>Prices shown in {settings.currency}. Sample items remain editable by admin.</p>
        </div>
      </div>
    </footer>
  );
}
