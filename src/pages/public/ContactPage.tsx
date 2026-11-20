import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useSettings } from '../../features/settings/SettingsContext';

export function ContactPage() {
  const { settings } = useSettings();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-[#343238] pb-8">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">GET IN TOUCH</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#F7F5EF] sm:text-4xl">
            Contact &amp; Location
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#AAA69C]">
            All contact numbers, street address, and service hours displayed here come directly from
            cafe settings.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
            <MapPin className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-semibold text-[#F7F5EF]">Address</h2>
            <p className="mt-2 text-sm text-[#AAA69C]">{settings.address}</p>
            <p className="text-sm text-[#AAA69C]">{settings.city}</p>
          </div>

          <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
            <Clock className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-semibold text-[#F7F5EF]">
              Opening Hours
            </h2>
            <p className="mt-2 text-sm text-[#AAA69C]">{settings.opening_hours}</p>
            <p className="mt-1 text-xs text-[#AAA69C]">Timezone: {settings.timezone}</p>
          </div>

          <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
            <Phone className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-semibold text-[#F7F5EF]">
              Phone &amp; Messaging
            </h2>
            <dl className="mt-2 space-y-2 text-sm text-[#AAA69C]">
              <div>
                <dt className="text-xs text-[#AAA69C]/80">Telephone</dt>
                <dd className="text-[#F7F5EF]">{settings.phone}</dd>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="mt-1 h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-[#AAA69C]/80">WhatsApp</dt>
                  <dd className="text-[#F7F5EF]">{settings.whatsapp}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-1 h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-[#AAA69C]/80">Email</dt>
                  <dd className="text-[#F7F5EF]">{settings.email}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-[#343238] bg-[#151518] p-6">
          <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
            Takeaway Pickup Instructions
          </h2>
          <p className="mt-2 text-sm text-[#AAA69C]">{settings.pickup_instructions}</p>
        </div>
      </div>
    </PublicLayout>
  );
}
