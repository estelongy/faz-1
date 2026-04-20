// Sepet — localStorage tabanlı, giriş yapılırsa DB'ye merge edilir.
// Hem server hem client tarafında tutarlı şekilde okunabilir.

export interface CartItem {
  productId: string
  name: string
  slug: string | null
  price: number
  image: string | null
  vendorId: string | null
  vendorName: string | null
  quantity: number
}

const STORAGE_KEY = 'estelongy_cart_v1'
const CHANGE_EVENT = 'estelongy_cart_change'

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1): CartItem[] {
  const current = readCart()
  const idx = current.findIndex(c => c.productId === item.productId)
  if (idx >= 0) {
    current[idx].quantity += qty
  } else {
    current.push({ ...item, quantity: qty })
  }
  writeCart(current)
  return current
}

export function updateQuantity(productId: string, qty: number): CartItem[] {
  const current = readCart()
  if (qty <= 0) return removeFromCart(productId)
  const idx = current.findIndex(c => c.productId === productId)
  if (idx >= 0) current[idx].quantity = qty
  writeCart(current)
  return current
}

export function removeFromCart(productId: string): CartItem[] {
  const current = readCart().filter(c => c.productId !== productId)
  writeCart(current)
  return current
}

export function clearCart() {
  writeCart([])
}

export function cartCount(items?: CartItem[]): number {
  const list = items ?? readCart()
  return list.reduce((n, i) => n + i.quantity, 0)
}

export function cartSubtotal(items?: CartItem[]): number {
  const list = items ?? readCart()
  return list.reduce((s, i) => s + i.price * i.quantity, 0)
}

// Satıcı bazlı gruplama (checkout + fulfillment için kritik)
export function groupByVendor(items: CartItem[]): Record<string, CartItem[]> {
  const out: Record<string, CartItem[]> = {}
  for (const it of items) {
    const key = it.vendorId ?? 'unknown'
    if (!out[key]) out[key] = []
    out[key].push(it)
  }
  return out
}

// React hook
import { useEffect, useState, useCallback } from 'react'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readCart())
    setHydrated(true)
    const handler = () => setItems(readCart())
    window.addEventListener(CHANGE_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const add = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => addToCart(item, qty), [])
  const update = useCallback((productId: string, qty: number) => updateQuantity(productId, qty), [])
  const remove = useCallback((productId: string) => removeFromCart(productId), [])
  const clear = useCallback(() => clearCart(), [])

  return {
    items,
    hydrated,
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    add,
    update,
    remove,
    clear,
  }
}
