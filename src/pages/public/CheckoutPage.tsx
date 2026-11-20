import { AlertCircle, CheckCircle2, CreditCard, Home, Store, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useAuth } from '../../features/auth/AuthContext';
import { getCartLineUnitEstimate, useCart } from '../../features/cart/CartContext';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency, formatPaymentMethod } from '../../lib/formatters';
import {
  validateCouponCodeFormat,
  validateEmailOptional,
  validateImageFile,
  validatePhone,
} from '../../lib/validators';
import { listOwnAddresses } from '../../services/auth.service';
import { listActiveDeliveryZones, listActiveTables } from '../../services/menu.service';
import { placeOrder, validateCouponEstimate } from '../../services/order.service';
import { submitManualPaymentProof } from '../../services/payment.service';
import type {
  AddressRow,
  DeliveryZoneRow,
  OrderType,
  PaymentMethod,
  RestaurantTableRow,
} from '../../types/database';

export function CheckoutPage() {
  const { items, subtotalEstimate, clearCart } = useCart();
  const { settings } = useSettings();
  const { isAuthenticated, profile, email } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialCoupon = ((location.state as { couponCode?: string } | null)?.couponCode ?? '').trim();

  const availableOrderModes = useMemo<OrderType[]>(() => {
    const modes: OrderType[] = [];
    if (settings.delivery_enabled) modes.push('delivery');
    if (settings.takeaway_enabled) modes.push('takeaway');
    if (settings.dine_in_enabled) modes.push('dine_in');
    return modes.length > 0 ? modes : ['takeaway'];
  }, [settings]);

  const [orderType, setOrderType] = useState<OrderType>(availableOrderModes[0] ?? 'takeaway');
  const [customerName, setCustomerName] = useState(profile?.full_name ?? '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone ?? '');
  const [customerEmail, setCustomerEmail] = useState(email ?? '');
  const [customerNote, setCustomerNote] = useState('');

  // Delivery state
  const [savedAddresses, setSavedAddresses] = useState<AddressRow[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [recipientName, setRecipientName] = useState(profile?.full_name ?? '');
  const [deliveryPhone, setDeliveryPhone] = useState(profile?.phone ?? '');
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneRow[]>([]);

  // Takeaway state
  const [pickupTime, setPickupTime] = useState('');

  // Dine-in state
  const [tables, setTables] = useState<RestaurantTableRow[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [manualTableCode, setManualTableCode] = useState('');

  // Payment & Coupon state
  const enabledPaymentMethods = useMemo<PaymentMethod[]>(() => {
    return (Object.keys(settings.payment_methods) as PaymentMethod[]).filter(
      (m) => settings.payment_methods[m]
    );
  }, [settings.payment_methods]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    enabledPaymentMethods[0] ?? 'cash_at_cafe'
  );
  const [transactionReference, setTransactionReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    estimatedDiscount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [loadingContext, setLoadingContext] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name && !customerName) setCustomerName(profile.full_name);
    if (profile?.phone && !customerPhone) setCustomerPhone(profile.phone);
    if (email && !customerEmail) setCustomerEmail(email);
    if (profile?.full_name && !recipientName) setRecipientName(profile.full_name);
    if (profile?.phone && !deliveryPhone) setDeliveryPhone(profile.phone);
  }, [profile, email, customerName, customerPhone, customerEmail, recipientName, deliveryPhone]);

  useEffect(() => {
    if (!enabledPaymentMethods.includes(paymentMethod) && enabledPaymentMethods.length > 0) {
      setPaymentMethod(enabledPaymentMethods[0]);
    }
  }, [enabledPaymentMethods, paymentMethod]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingContext(true);
      try {
        const [zones, tableList, addrs] = await Promise.all([
          listActiveDeliveryZones(),
          listActiveTables(),
          isAuthenticated ? listOwnAddresses() : Promise.resolve([]),
        ]);
        if (!active) return;
        setDeliveryZones(zones);
        setTables(tableList);
        if (tableList.length > 0) setSelectedTableId(tableList[0].id);
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.is_default) ?? addrs[0];
        if (def) setSelectedAddressId(def.id);
      } catch {
        // Non-blocking; submission validates again
      } finally {
        if (active) setLoadingContext(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!initialCoupon) return;
    void validateCouponEstimate(initialCoupon, subtotalEstimate)
      .then((res) => {
        setAppliedCoupon({ code: res.coupon.code, estimatedDiscount: res.estimatedDiscount });
      })
      .catch(() => {
        // Leave coupon unapplied if no longer valid
      });
  }, [initialCoupon, subtotalEstimate]);

  const activeAddress = useMemo(() => {
    if (selectedAddressId === 'new') {
      return {
        recipient_name: recipientName,
        phone: deliveryPhone,
        address_line: addressLine,
        area,
        city,
        delivery_notes: deliveryNotes,
      };
    }
    const found = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!found) return null;
    return {
      label: found.label,
      recipient_name: found.recipient_name,
      phone: found.phone,
      address_line: found.address_line,
      area: found.area,
      city: found.city,
      delivery_notes: found.delivery_notes ?? '',
    };
  }, [
    selectedAddressId,
    savedAddresses,
    recipientName,
    deliveryPhone,
    addressLine,
    area,
    city,
    deliveryNotes,
  ]);

  const matchedDeliveryZone = useMemo(() => {
    if (orderType !== 'delivery' || !activeAddress) return null;
    const c = activeAddress.city.trim().toLowerCase();
    const a = activeAddress.area.trim().toLowerCase();
    if (!c || !a) return null;
    return (
      deliveryZones.find(
        (z) =>
          z.is_active &&
          z.city.trim().toLowerCase() === c &&
          z.area_names.some((name) => name.trim().toLowerCase() === a)
      ) ?? null
    );
  }, [orderType, activeAddress, deliveryZones]);

  const estimatedDeliveryFee = orderType === 'delivery' ? Number(matchedDeliveryZone?.delivery_fee ?? 0) : 0;
  const estimatedDiscount = appliedCoupon?.estimatedDiscount ?? 0;
  const taxableEstimate = Math.max(0, subtotalEstimate - estimatedDiscount);
  const estimatedTax = Number(((taxableEstimate * (Number(settings.tax_rate) || 0)) / 100).toFixed(2));
  const estimatedGrandTotal = Number(
    (taxableEstimate + estimatedDeliveryFee + estimatedTax).toFixed(2)
  );

  const isManualTransfer =
    paymentMethod === 'jazzcash_manual' ||
    paymentMethod === 'easypaisa_manual' ||
    paymentMethod === 'bank_transfer_manual';

  const handleApplyCoupon = async () => {
    setCouponError(null);
    const fmtErr = validateCouponCodeFormat(couponCode);
    if (fmtErr) {
      setCouponError(fmtErr);
      return;
    }
    try {
      const res = await validateCouponEstimate(couponCode, subtotalEstimate);
      setAppliedCoupon({ code: res.coupon.code, estimatedDiscount: res.estimatedDiscount });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon code.');
    }
  };

  const handleProofChange = (file: File | null) => {
    if (!file) {
      setProofFile(null);
      return;
    }
    const err = validateImageFile(file);
    if (err) {
      setFormErrors((prev) => ({ ...prev, proof: err }));
      return;
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.proof;
      return copy;
    });
    setProofFile(file);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errors: Record<string, string> = {};

    if (!customerName.trim()) errors.customerName = 'Customer name is required.';
    const phoneErr = validatePhone(customerPhone);
    if (phoneErr) errors.customerPhone = phoneErr;
    const emailErr = validateEmailOptional(customerEmail);
    if (emailErr) errors.customerEmail = emailErr;

    if (orderType === 'delivery') {
      if (!activeAddress?.recipient_name.trim()) {
        errors.recipientName = 'Recipient name is required.';
      }
      const dPhoneErr = validatePhone(activeAddress?.phone ?? '');
      if (dPhoneErr) errors.deliveryPhone = dPhoneErr;
      if (!activeAddress?.address_line.trim()) errors.addressLine = 'Street address is required.';
      if (!activeAddress?.area.trim()) errors.area = 'Area / locality is required.';
      if (!activeAddress?.city.trim()) errors.city = 'City is required.';
      if (!matchedDeliveryZone) {
        errors.deliveryZone =
          deliveryZones.length === 0
            ? 'No active delivery zones are configured yet. Choose Takeaway or Dine-in instead.'
            : 'Entered city/area is outside active delivery zones. Choose Takeaway or Dine-in instead.';
      } else if (subtotalEstimate < Number(matchedDeliveryZone.min_order_amount)) {
        errors.deliveryZone = `Minimum order for ${matchedDeliveryZone.name} is ${formatCurrency(
          matchedDeliveryZone.min_order_amount,
          settings.currency
        )}.`;
      }
    }

    if (orderType === 'dine_in') {
      if (!selectedTableId && !manualTableCode.trim()) {
        errors.table = 'Select an active table or enter a table code.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSubmitting(true);

    try {
      const result = await placeOrder({
        order_type: orderType,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        customer_note: customerNote.trim() || null,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code ?? (couponCode.trim() || null),
        address_id:
          orderType === 'delivery' && selectedAddressId !== 'new' ? selectedAddressId : null,
        delivery_address: orderType === 'delivery' ? activeAddress : null,
        delivery_zone_id: orderType === 'delivery' ? matchedDeliveryZone?.id ?? null : null,
        pickup_time:
          orderType === 'takeaway' && pickupTime
            ? new Date(pickupTime).toISOString()
            : null,
        table_id: orderType === 'dine_in' && selectedTableId ? selectedTableId : null,
        table_code:
          orderType === 'dine_in' && !selectedTableId ? manualTableCode.trim() : null,
        transaction_reference: isManualTransfer ? transactionReference.trim() || null : null,
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          add_on_ids: item.add_ons.map((a) => a.add_on_id),
          quantity: item.quantity,
          special_instructions: item.special_instructions || null,
        })),
      });

      if (isManualTransfer && proofFile && transactionReference.trim()) {
        await submitManualPaymentProof({
          orderId: result.order_id,
          transactionReference: transactionReference.trim(),
          file: proofFile,
          trackingToken: result.tracking_token,
        });
      }

      clearCart();
      const tokenQuery = result.tracking_token
        ? `?token=${encodeURIComponent(result.tracking_token)}`
        : '';
      navigate(`/order-confirmation/${result.order_number}${tokenQuery}`, {
        state: { trackingToken: result.tracking_token, isPreview: result.is_preview },
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to place order. Your cart items were preserved.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <EmptyState
            title="Your cart is empty"
            description="Add at least one item to your cart before proceeding to checkout."
            action={
              <Link
                to="/menu"
                className="inline-flex min-h-11 items-center rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D]"
              >
                Explore Menu
              </Link>
            }
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-[#343238] pb-6">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">CHECKOUT</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">
            Complete Your Order
          </h1>
          <p className="mt-1.5 text-sm text-[#AAA69C]">
            Select Home Delivery, Takeaway, or Dine-in and review your items.
          </p>
        </div>

        {submitError && (
          <div className="mt-6">
            <FeedbackBanner tone="error" title="Order Not Submitted" message={submitError} />
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Step 1: Order Mode Selector */}
            <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                1. Order Mode
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    type: 'delivery' as OrderType,
                    label: 'Home Delivery',
                    desc: 'Delivered to your address',
                    icon: Home,
                    enabled: settings.delivery_enabled,
                  },
                  {
                    type: 'takeaway' as OrderType,
                    label: 'Takeaway',
                    desc: 'Collect at cafe counter',
                    icon: Store,
                    enabled: settings.takeaway_enabled,
                  },
                  {
                    type: 'dine_in' as OrderType,
                    label: 'Dine-in',
                    desc: 'Served at your cafe table',
                    icon: UtensilsCrossed,
                    enabled: settings.dine_in_enabled,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const active = orderType === mode.type;
                  return (
                    <button
                      key={mode.type}
                      type="button"
                      disabled={!mode.enabled}
                      onClick={() => setOrderType(mode.type)}
                      className={`flex flex-col items-start rounded-lg border p-4 text-left transition-colors ${
                        !mode.enabled
                          ? 'cursor-not-allowed border-[#343238]/50 opacity-45'
                          : active
                          ? 'border-[#D4AF37] bg-[#1D1D21]'
                          : 'border-[#343238] bg-[#0B0B0D] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${active ? 'text-[#D4AF37]' : 'text-[#AAA69C]'}`}
                        aria-hidden="true"
                      />
                      <span className="mt-3 text-sm font-semibold text-[#F7F5EF]">
                        {mode.label}
                      </span>
                      <span className="mt-0.5 text-xs text-[#AAA69C]">
                        {mode.enabled ? mode.desc : 'Currently unavailable'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Customer Contact */}
            <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                2. Contact Details
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cust-name" className="block text-xs font-semibold text-[#F7F5EF]">
                    Full Name *
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                  />
                  {formErrors.customerName && (
                    <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cust-phone" className="block text-xs font-semibold text-[#F7F5EF]">
                    Mobile Phone *
                  </label>
                  <input
                    id="cust-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                  />
                  {formErrors.customerPhone && (
                    <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cust-email" className="block text-xs font-semibold text-[#F7F5EF]">
                    Email (Optional)
                  </label>
                  <input
                    id="cust-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                  />
                  {formErrors.customerEmail && (
                    <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.customerEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cust-note" className="block text-xs font-semibold text-[#F7F5EF]">
                    Order Note (Optional)
                  </label>
                  <input
                    id="cust-note"
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Cutlery or delivery note..."
                    className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Step 3: Order Mode Branch Details */}
            {orderType === 'delivery' && (
              <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
                <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                  3. Delivery Address &amp; Zone Check
                </h2>

                {!loadingContext && deliveryZones.length === 0 && (
                  <div className="mt-4 rounded-md border border-[#E06A6A]/45 bg-[#E06A6A]/10 p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E06A6A]" />
                      <div>
                        <p className="font-semibold text-[#F7F5EF]">
                          No Delivery Zones Configured Yet
                        </p>
                        <p className="mt-1 text-xs text-[#AAA69C]">
                          Home delivery coverage has not been published by admin yet. You can
                          switch to Takeaway or Dine-in right now, or add a zone from the Admin
                          panel.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {settings.takeaway_enabled && (
                            <button
                              type="button"
                              onClick={() => setOrderType('takeaway')}
                              className="rounded border border-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#E7CB78]"
                            >
                              Switch to Takeaway
                            </button>
                          )}
                          {settings.dine_in_enabled && (
                            <button
                              type="button"
                              onClick={() => setOrderType('dine_in')}
                              className="rounded border border-[#343238] bg-[#1D1D21] px-3 py-1.5 text-xs font-semibold text-[#F7F5EF]"
                            >
                              Switch to Dine-in
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isAuthenticated && savedAddresses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-[#AAA69C]">Saved Addresses</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-xs ${
                            selectedAddressId === addr.id
                              ? 'border-[#D4AF37] bg-[#1D1D21]'
                              : 'border-[#343238] bg-[#0B0B0D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="saved_address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-0.5 accent-[#D4AF37]"
                          />
                          <div>
                            <p className="font-semibold text-[#F7F5EF]">
                              {addr.label || 'Saved Address'}
                            </p>
                            <p className="text-[#AAA69C]">
                              {addr.address_line}, {addr.area}, {addr.city}
                            </p>
                          </div>
                        </label>
                      ))}
                      <label
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-3 text-xs ${
                          selectedAddressId === 'new'
                            ? 'border-[#D4AF37] bg-[#1D1D21]'
                            : 'border-[#343238] bg-[#0B0B0D]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved_address"
                          checked={selectedAddressId === 'new'}
                          onChange={() => setSelectedAddressId('new')}
                          className="accent-[#D4AF37]"
                        />
                        <span className="font-semibold text-[#F7F5EF]">
                          Enter a different address
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {selectedAddressId === 'new' && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="del-rec" className="block text-xs font-semibold text-[#F7F5EF]">
                        Recipient Name *
                      </label>
                      <input
                        id="del-rec"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                      />
                      {formErrors.recipientName && (
                        <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.recipientName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="del-phone" className="block text-xs font-semibold text-[#F7F5EF]">
                        Recipient Phone *
                      </label>
                      <input
                        id="del-phone"
                        type="tel"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                      />
                      {formErrors.deliveryPhone && (
                        <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.deliveryPhone}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="del-line" className="block text-xs font-semibold text-[#F7F5EF]">
                        Street Address / House / Suite *
                      </label>
                      <input
                        id="del-line"
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                      />
                      {formErrors.addressLine && (
                        <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.addressLine}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="del-area" className="block text-xs font-semibold text-[#F7F5EF]">
                        Area / Sector *
                      </label>
                      <input
                        id="del-area"
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                      />
                      {formErrors.area && (
                        <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.area}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="del-city" className="block text-xs font-semibold text-[#F7F5EF]">
                        City *
                      </label>
                      <input
                        id="del-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.city}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="del-notes" className="block text-xs font-semibold text-[#F7F5EF]">
                        Delivery Notes (Optional)
                      </label>
                      <input
                        id="del-notes"
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {matchedDeliveryZone ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-md border border-[#4CAF78]/40 bg-[#4CAF78]/10 p-3 text-xs text-[#F7F5EF]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4CAF78]" />
                    <div>
                      <p className="font-semibold">
                        Zone matched: {matchedDeliveryZone.name} ({matchedDeliveryZone.city})
                      </p>
                      <p className="text-[#AAA69C]">
                        Delivery fee:{' '}
                        {formatCurrency(matchedDeliveryZone.delivery_fee, settings.currency)} · Min.
                        order:{' '}
                        {formatCurrency(matchedDeliveryZone.min_order_amount, settings.currency)}
                        {matchedDeliveryZone.estimated_minutes
                          ? ` · Est. ${matchedDeliveryZone.estimated_minutes} mins`
                          : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  deliveryZones.length > 0 &&
                  activeAddress?.city &&
                  activeAddress?.area && (
                    <p className="mt-3 text-xs text-[#E06A6A]">
                      Entered area is not currently in an active delivery zone. Available cities:{' '}
                      {[...new Set(deliveryZones.map((z) => z.city))].join(', ')}.
                    </p>
                  )
                )}

                {formErrors.deliveryZone && (
                  <p role="alert" className="mt-2 text-xs text-[#E06A6A]">
                    {formErrors.deliveryZone}
                  </p>
                )}
              </section>
            )}

            {orderType === 'takeaway' && (
              <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
                <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                  3. Takeaway Pickup Details
                </h2>
                <p className="mt-2 text-sm text-[#AAA69C]">{settings.pickup_instructions}</p>
                <div className="mt-4 max-w-sm">
                  <label htmlFor="pickup-time" className="block text-xs font-semibold text-[#F7F5EF]">
                    Preferred Pickup Time (Optional)
                  </label>
                  <input
                    id="pickup-time"
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </section>
            )}

            {orderType === 'dine_in' && (
              <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
                <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                  3. Dine-in Table Selection
                </h2>
                <p className="mt-2 text-xs text-[#AAA69C]">
                  Select your current table for immediate dine-in service. Table selection does not
                  create a future reservation.
                </p>

                {tables.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {tables.map((t) => {
                      const selected = selectedTableId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTableId(t.id);
                            setManualTableCode('');
                          }}
                          className={`rounded-md border p-3 text-left transition-colors ${
                            selected
                              ? 'border-[#D4AF37] bg-[#1D1D21]'
                              : 'border-[#343238] bg-[#0B0B0D] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <p className="font-mono-tabular text-sm font-semibold text-[#E7CB78]">
                            {t.table_code}
                          </p>
                          <p className="truncate text-xs text-[#AAA69C]">{t.display_name}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 max-w-xs">
                    <label htmlFor="table-code" className="block text-xs font-semibold text-[#F7F5EF]">
                      Table Code *
                    </label>
                    <input
                      id="table-code"
                      type="text"
                      value={manualTableCode}
                      onChange={(e) => setManualTableCode(e.target.value.toUpperCase())}
                      placeholder="e.g. T01"
                      className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm uppercase text-[#F7F5EF]"
                    />
                  </div>
                )}

                {formErrors.table && (
                  <p className="mt-2 text-xs text-[#E06A6A]">{formErrors.table}</p>
                )}
              </section>
            )}

            {/* Step 4: Payment Method */}
            <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                4. Payment Method
              </h2>

              <div className="mt-4 space-y-2.5">
                {enabledPaymentMethods.map((method) => {
                  const selected = paymentMethod === method;
                  return (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-start justify-between gap-3 rounded-md border p-4 transition-colors ${
                        selected
                          ? 'border-[#D4AF37] bg-[#1D1D21]'
                          : 'border-[#343238] bg-[#0B0B0D] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_method"
                          checked={selected}
                          onChange={() => setPaymentMethod(method)}
                          className="mt-1 accent-[#D4AF37]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-[#F7F5EF]">
                            {formatPaymentMethod(method)}
                          </span>
                          {method === 'card_online_demo' && (
                            <span className="mt-0.5 block text-xs text-[#E7CB78]">
                              Demo Only — no real charge. No card numbers are collected or billed.
                            </span>
                          )}
                          {(method === 'cash_on_delivery' || method === 'cash_at_cafe') && (
                            <span className="mt-0.5 block text-xs text-[#AAA69C]">
                              Payment remains unpaid until staff records cash receipt.
                            </span>
                          )}
                        </span>
                      </span>
                      {method === 'card_online_demo' && (
                        <CreditCard className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                      )}
                    </label>
                  );
                })}
              </div>

              {isManualTransfer && (
                <div className="mt-5 space-y-4 rounded-md border border-[#343238] bg-[#0B0B0D] p-4">
                  <p className="text-xs font-semibold text-[#E7CB78]">
                    Manual Transfer Instructions
                  </p>
                  <p className="text-sm text-[#AAA69C]">
                    {settings.manual_payment_instructions[
                      paymentMethod as keyof typeof settings.manual_payment_instructions
                    ]}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="tx-ref"
                        className="block text-xs font-semibold text-[#F7F5EF]"
                      >
                        Transaction Reference ID (Optional now, or submit later)
                      </label>
                      <input
                        id="tx-ref"
                        type="text"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="e.g. TID-123456"
                        className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#151518] px-3 text-sm text-[#F7F5EF]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="proof-upload"
                        className="block text-xs font-semibold text-[#F7F5EF]"
                      >
                        Transfer Receipt Image (JPEG/PNG/WebP, max 5MB)
                      </label>
                      <input
                        id="proof-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleProofChange(e.target.files?.[0] ?? null)}
                        className="mt-1.5 block w-full text-xs text-[#AAA69C] file:mr-3 file:rounded file:border file:border-[#343238] file:bg-[#151518] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#F7F5EF]"
                      />
                      {formErrors.proof && (
                        <p className="mt-1 text-xs text-[#E06A6A]">{formErrors.proof}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                Order Summary
              </h2>

              <ul className="mt-4 divide-y divide-[#343238]/60 text-sm">
                {items.map((item) => (
                  <li key={item.cart_item_id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#F7F5EF]">
                        {item.quantity}× {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-xs text-[#AAA69C]">{item.variant_name}</p>
                      )}
                      {item.add_ons.length > 0 && (
                        <p className="text-xs text-[#AAA69C]">
                          +{item.add_ons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono-tabular text-xs font-semibold text-[#F7F5EF] shrink-0">
                      {formatCurrency(
                        getCartLineUnitEstimate(item) * item.quantity,
                        settings.currency
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-[#343238] pt-4">
                <label htmlFor="checkout-coupon" className="block text-xs font-semibold text-[#AAA69C]">
                  Coupon Code
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="checkout-coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Optional code"
                    className="min-h-10 flex-1 rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-xs uppercase text-[#F7F5EF]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="min-h-10 rounded-md border border-[#D4AF37] px-3 text-xs font-semibold text-[#E7CB78] hover:bg-[#D4AF37] hover:text-[#0B0B0D]"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="mt-1 text-xs text-[#E06A6A]">{couponError}</p>}
              </div>

              <dl className="mt-5 space-y-2.5 border-t border-[#343238] pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#AAA69C]">Subtotal estimate</dt>
                  <dd className="font-mono-tabular text-[#F7F5EF]">
                    {formatCurrency(subtotalEstimate, settings.currency)}
                  </dd>
                </div>
                {estimatedDiscount > 0 && (
                  <div className="flex justify-between text-[#4CAF78]">
                    <dt>Discount ({appliedCoupon?.code})</dt>
                    <dd className="font-mono-tabular">
                      -{formatCurrency(estimatedDiscount, settings.currency)}
                    </dd>
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <dt className="text-[#AAA69C]">Delivery fee</dt>
                    <dd className="font-mono-tabular text-[#F7F5EF]">
                      {matchedDeliveryZone
                        ? formatCurrency(estimatedDeliveryFee, settings.currency)
                        : 'Pending zone'}
                    </dd>
                  </div>
                )}
                {estimatedTax > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#AAA69C]">Tax ({settings.tax_rate}%)</dt>
                    <dd className="font-mono-tabular text-[#F7F5EF]">
                      {formatCurrency(estimatedTax, settings.currency)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#343238] pt-3 text-base font-semibold">
                  <dt className="text-[#F7F5EF]">Estimated Grand Total</dt>
                  <dd className="font-mono-tabular text-[#E7CB78]">
                    {formatCurrency(estimatedGrandTotal, settings.currency)}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] leading-relaxed text-[#AAA69C]">
                Authoritative prices, discounts, and totals are calculated atomically by the
                server upon submission.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 min-h-12 w-full rounded-md bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78] disabled:opacity-50"
              >
                {submitting ? 'Submitting Order...' : 'Place Order'}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </PublicLayout>
  );
}
