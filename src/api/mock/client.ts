import { mockMaterials } from './materials'
import { mockMasters, mockPortfolio, mockReviews } from './masters'
import { mockOrders, mockBids } from './orders'
import { mockThreads, mockMessages } from './messages'
import type {
  Material,
  Master,
  Order,
  PortfolioItem,
  MaterialCategory,
  City,
  Review,
  Bid,
  ChatThread,
  ChatMessage,
} from '../types'

// Имитируем сетевую задержку
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ========================================
// MATERIALS
// ========================================
export const mockMaterialsApi = {
  async list(filters?: {
    category?: MaterialCategory
    search?: string
  }): Promise<Material[]> {
    await delay()
    let items = [...mockMaterials]
    if (filters?.category) {
      items = items.filter((m) => m.category === filters.category)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      items = items.filter((m) => m.title.toLowerCase().includes(q))
    }
    return items
  },

  async getById(id: string): Promise<Material | null> {
    await delay()
    return mockMaterials.find((m) => m.id === id) ?? null
  },

  // Похожие материалы той же категории (исключая текущий)
  async getSimilar(id: string, limit = 4): Promise<Material[]> {
    await delay()
    const current = mockMaterials.find((m) => m.id === id)
    if (!current) return []
    return mockMaterials
      .filter((m) => m.category === current.category && m.id !== id)
      .slice(0, limit)
  },
}

// ========================================
// MASTERS
// ========================================
export const mockMastersApi = {
  async list(filters?: {
    city?: City
    tag?: string
    minRating?: number
  }): Promise<Master[]> {
    await delay()
    let items = [...mockMasters]
    if (filters?.city) items = items.filter((m) => m.city === filters.city)
    if (filters?.tag) items = items.filter((m) => m.tags.includes(filters.tag!))
    if (filters?.minRating)
      items = items.filter((m) => m.rating >= filters.minRating!)
    return items
  },

  async getById(id: string): Promise<Master | null> {
    await delay()
    return mockMasters.find((m) => m.id === id) ?? null
  },

  async getPortfolio(masterId?: string): Promise<PortfolioItem[]> {
    await delay()
    if (!masterId) return mockPortfolio
    return mockPortfolio.filter((p) => p.authorId === masterId)
  },

  async getReviews(masterId: string): Promise<Review[]> {
    await delay()
    return mockReviews
      .filter((r) => r.masterId === masterId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  },
}

// ========================================
// ORDERS
// ========================================
export const mockOrdersApi = {
  async list(filters?: { city?: City; status?: string }): Promise<Order[]> {
    await delay()
    let items = [...mockOrders]
    if (filters?.city) items = items.filter((o) => o.city === filters.city)
    if (filters?.status) items = items.filter((o) => o.status === filters.status)
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async getById(id: string): Promise<Order | null> {
    await delay()
    return mockOrders.find((o) => o.id === id) ?? null
  },

  async create(
    payload: Omit<Order, 'id' | 'createdAt' | 'bidsCount' | 'bidAvatars' | 'status'>
  ): Promise<Order> {
    await delay(600)
    const newOrder: Order = {
      ...payload,
      id: `ord-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'open',
      bidsCount: 0,
      bidAvatars: [],
    }
    mockOrders.unshift(newOrder)
    return newOrder
  },

  async getBids(orderId: string): Promise<Bid[]> {
    await delay()
    return mockBids
      .filter((b) => b.orderId === orderId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  },

  async createBid(
    payload: Omit<Bid, 'id' | 'createdAt'>
  ): Promise<Bid> {
    await delay(500)
    const newBid: Bid = {
      ...payload,
      id: `bid-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    mockBids.unshift(newBid)
    // Обновляем счётчик откликов на заказе
    const order = mockOrders.find((o) => o.id === payload.orderId)
    if (order) order.bidsCount += 1
    return newBid
  },
}

// ========================================
// MESSAGES
// ========================================
export const mockMessagesApi = {
  async getThreads(): Promise<ChatThread[]> {
    await delay()
    return [...mockThreads].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )
  },

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    await delay()
    return mockMessages[threadId] ?? []
  },

  async send(threadId: string, text: string, attachment?: ChatMessage['attachment']): Promise<ChatMessage> {
    await delay(200)
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: 'cust-me',
      senderName: 'Вы',
      text,
      createdAt: new Date().toISOString(),
      isOwn: true,
      attachment,
    }
    if (!mockMessages[threadId]) mockMessages[threadId] = []
    mockMessages[threadId].push(msg)

    // Обновляем lastMessage в треде
    const thread = mockThreads.find((t) => t.id === threadId)
    if (thread) {
      thread.lastMessage = text
      thread.lastMessageAt = msg.createdAt
    }
    return msg
  },

  async markRead(threadId: string): Promise<void> {
    await delay(100)
    const thread = mockThreads.find((t) => t.id === threadId)
    if (thread) thread.unread = 0
  },
}
