import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  bookId: string
  title: string
  author: string
  price: number
  originalPrice: number
  discountTag: string | null
  imageUrl: string | null
  quantity: number
}

export interface UIState {
  cartOpen: boolean
  authModalOpen: boolean
  authModalTab: 'login' | 'signup'
  dashboardOpen: boolean
  requestBookOpen: boolean
  sellBookOpen: boolean
  bookDetailOpen: boolean
  selectedBookId: string | null
}

interface StoreState {
  // Cart
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (bookId: string) => void
  updateCartQuantity: (bookId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number

  // Wishlist (book IDs)
  wishlist: string[]
  toggleWishlist: (bookId: string) => void
  isInWishlist: (bookId: string) => boolean

  // UI State
  ui: UIState
  setUI: (partial: Partial<UIState>) => void
  openAuthModal: (tab?: 'login' | 'signup') => void
  closeAuthModal: () => void
  openCart: () => void
  closeCart: () => void
  openDashboard: () => void
  closeDashboard: () => void
  openRequestBook: () => void
  closeRequestBook: () => void
  openSellBook: () => void
  closeSellBook: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Cart
      cart: [],
      addToCart: (item) => {
        const existing = get().cart.find((c) => c.bookId === item.bookId)
        if (existing) {
          set({
            cart: get().cart.map((c) =>
              c.bookId === item.bookId
                ? { ...c, quantity: c.quantity + 1 }
                : c
            ),
          })
        } else {
          set({ cart: [...get().cart, { ...item, quantity: 1 }] })
        }
      },
      removeFromCart: (bookId) => {
        set({ cart: get().cart.filter((c) => c.bookId !== bookId) })
      },
      updateCartQuantity: (bookId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(bookId)
          return
        }
        set({
          cart: get().cart.map((c) =>
            c.bookId === bookId ? { ...c, quantity } : c
          ),
        })
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getCartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

      // Wishlist
      wishlist: [],
      toggleWishlist: (bookId) => {
        const current = get().wishlist
        if (current.includes(bookId)) {
          set({ wishlist: current.filter((id) => id !== bookId) })
        } else {
          set({ wishlist: [...current, bookId] })
        }
      },
      isInWishlist: (bookId) => get().wishlist.includes(bookId),

      // UI State
      ui: {
        cartOpen: false,
        authModalOpen: false,
        authModalTab: 'login',
        dashboardOpen: false,
        requestBookOpen: false,
        sellBookOpen: false,
        bookDetailOpen: false,
        selectedBookId: null,
      },
      setUI: (partial) =>
        set({ ui: { ...get().ui, ...partial } }),
      openAuthModal: (tab = 'login') =>
        set({ ui: { ...get().ui, authModalOpen: true, authModalTab: tab } }),
      closeAuthModal: () =>
        set({ ui: { ...get().ui, authModalOpen: false } }),
      openCart: () =>
        set({ ui: { ...get().ui, cartOpen: true } }),
      closeCart: () =>
        set({ ui: { ...get().ui, cartOpen: false } }),
      openDashboard: () =>
        set({ ui: { ...get().ui, dashboardOpen: true } }),
      closeDashboard: () =>
        set({ ui: { ...get().ui, dashboardOpen: false } }),
      openRequestBook: () =>
        set({ ui: { ...get().ui, requestBookOpen: true } }),
      closeRequestBook: () =>
        set({ ui: { ...get().ui, requestBookOpen: false } }),
      openSellBook: () =>
        set({ ui: { ...get().ui, sellBookOpen: true } }),
      closeSellBook: () =>
        set({ ui: { ...get().ui, sellBookOpen: false } }),
    }),
    {
      name: 'kitaab-kharido-store',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    }
  )
)
