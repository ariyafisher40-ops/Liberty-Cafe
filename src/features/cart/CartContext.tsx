import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartAddOnSelection, CartItem, ProductWithDetails } from '../../types/domain';
import type { ProductVariantRow } from '../../types/database';

const CART_STORAGE_KEY = 'liberty_cafe_cart_v1';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalEstimate: number;
  lastAddedMessage: string | null;
  clearLastAddedMessage: () => void;
  addToCart: (input: {
    product: ProductWithDetails;
    variant: ProductVariantRow | null;
    addOns: CartAddOnSelection[];
    quantity: number;
    specialInstructions?: string;
  }) => void;
  updateQuantity: (cartItemId: string, nextQuantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function getCartLineUnitEstimate(item: CartItem): number {
  const addOnSum = item.add_ons.reduce((sum, a) => sum + Number(a.price), 0);
  return Number(item.base_price) + Number(item.variant_price_delta) + addOnSum;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadStoredCart);
  const [lastAddedMessage, setLastAddedMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  useEffect(() => {
    if (!lastAddedMessage) return;
    const timer = window.setTimeout(() => setLastAddedMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [lastAddedMessage]);

  const addToCart: CartContextValue['addToCart'] = useCallback(
    ({ product, variant, addOns, quantity, specialInstructions = '' }) => {
      if (!product.is_available) return;
      const safeQty = Math.max(1, Math.min(50, Math.floor(quantity)));
      const sortedAddOnIds = [...addOns].map((a) => a.add_on_id).sort().join(',');
      const trimmedNotes = specialInstructions.trim();
      const key = `${product.id}::${variant?.id ?? 'base'}::${sortedAddOnIds}::${trimmedNotes}`;

      setItems((prev) => {
        const existing = prev.find((i) => i.cart_item_id === key);
        if (existing) {
          return prev.map((i) =>
            i.cart_item_id === key
              ? { ...i, quantity: Math.min(50, i.quantity + safeQty) }
              : i
          );
        }

        const nextItem: CartItem = {
          cart_item_id: key,
          product_id: product.id,
          product_slug: product.slug,
          product_name: product.name,
          image_path: product.image_path,
          variant_id: variant?.id ?? null,
          variant_name: variant?.name ?? null,
          base_price: Number(product.base_price),
          variant_price_delta: Number(variant?.price_delta ?? 0),
          add_ons: addOns,
          quantity: safeQty,
          special_instructions: trimmedNotes,
          is_demo: product.is_demo,
        };
        return [...prev, nextItem];
      });

      setLastAddedMessage(`${product.name} added to cart`);
    },
    []
  );

  const updateQuantity = useCallback((cartItemId: string, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      setItems((prev) => prev.filter((i) => i.cart_item_id !== cartItemId));
      return;
    }
    const clamped = Math.min(50, Math.floor(nextQuantity));
    setItems((prev) =>
      prev.map((i) => (i.cart_item_id === cartItemId ? { ...i, quantity: clamped } : i))
    );
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cart_item_id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const clearLastAddedMessage = useCallback(() => {
    setLastAddedMessage(null);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalEstimate = useMemo(
    () =>
      Number(
        items
          .reduce((sum, item) => sum + getCartLineUnitEstimate(item) * item.quantity, 0)
          .toFixed(2)
      ),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotalEstimate,
      lastAddedMessage,
      clearLastAddedMessage,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotalEstimate,
      lastAddedMessage,
      clearLastAddedMessage,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider.');
  }
  return ctx;
}
