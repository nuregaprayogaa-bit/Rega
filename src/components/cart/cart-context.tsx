"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  assetId: string;
  licenseType: "STANDARD" | "EXTENDED";
  title: string;
  price: number;
  previewUrl: string;
  type: "PHOTO" | "VIDEO";
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  remove: (assetId: string, licenseType: CartItem["licenseType"]) => void;
  has: (assetId: string, licenseType: CartItem["licenseType"]) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nusagraf_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (
        prev.some(
          (i) => i.assetId === item.assetId && i.licenseType === item.licenseType,
        )
      )
        return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback(
    (assetId: string, licenseType: CartItem["licenseType"]) => {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.assetId === assetId && i.licenseType === licenseType),
        ),
      );
    },
    [],
  );

  const has = useCallback(
    (assetId: string, licenseType: CartItem["licenseType"]) =>
      items.some(
        (i) => i.assetId === assetId && i.licenseType === licenseType,
      ),
    [items],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      subtotal: items.reduce((s, i) => s + i.price, 0),
      add,
      remove,
      has,
      clear,
    }),
    [items, add, remove, has, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}
