import { supabase } from '@/lib/supabase'
import type {
  Master, Material, Order, Bid,
  ChatThread, ChatMessage, MaterialCategory, FurnitureCategory,
} from './types'

// ─── Хелперы ───
function initial(name: string) {
  return name?.trim()?.[0]?.toUpperCase() ?? '?'
}

// ══════════════════════════════════════════
// МАСТЕРА
// ══════════════════════════════════════════
export const supabaseMastersApi = {
  async list(): Promise<Master[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, name, city, verified, avatar_url,
        master_profiles (
          specialization, years_exp, rating,
          projects_count, tags, cover_color,
          working_hours, address, whatsapp, response_time
        )
      `)
      .eq('role', 'master')

    if (error) {
      console.error('mastersApi.list error:', error)
      return []
    }
    return (data ?? []).map(mapMaster)
  },

  async getById(id: string): Promise<Master | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, name, city, verified, avatar_url, bio, phone,
        master_profiles (
          specialization, years_exp, rating,
          projects_count, tags, cover_color,
          working_hours, address, whatsapp, response_time
        ),
        portfolio_items ( id, title, category, image_url ),
        master_services ( id, title, price_from, description ),
        reviews ( id, rating, text, created_at, project_title,
          author:author_id ( name ) )
      `)
      .eq('id', id)
      .eq('role', 'master')
      .single()

    if (error || !data) return null
    return mapMaster(data, true)
  },

  async getPortfolio(masterId: string) {
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('master_id', masterId)
    return data ?? []
  },

  async getReviews(masterId: string) {
    const { data } = await supabase
      .from('reviews')
      .select('*, author:author_id(name)')
      .eq('master_id', masterId)
      .order('created_at', { ascending: false })
    return (data ?? []).map((r: any) => ({
      id: r.id,
      masterId: r.master_id,
      authorName: r.author?.name ?? 'Пользователь',
      authorInitial: initial(r.author?.name ?? 'П'),
      rating: r.rating,
      text: r.text,
      createdAt: r.created_at,
      projectTitle: r.project_title,
      helpful: r.helpful ?? 0,
    }))
  },
}

function mapMaster(row: any, full = false): Master {
  const mp = Array.isArray(row.master_profiles)
    ? row.master_profiles[0]
    : row.master_profiles

  return {
    id: row.id,
    name: row.name ?? 'Мастер',
    initial: initial(row.name),
    specialization: mp?.specialization ?? 'Мебельщик',
    city: row.city ?? 'Бишкек',
    rating: mp?.rating ?? 0,
    projectsCount: mp?.projects_count ?? 0,
    yearsExperience: mp?.years_exp ?? 0,
    verified: row.verified ?? false,
    tags: mp?.tags ?? [],
    coverColor: (mp?.cover_color ?? 1) as 1|2|3|4|5|6,
    bio: row.bio,
    phone: row.phone,
    whatsapp: mp?.whatsapp,
    workingHours: mp?.working_hours,
    address: mp?.address,
    responseTime: mp?.response_time ?? 'В течение часа',
    ...(full && {
      portfolio: (row.portfolio_items ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        imageStyle: 'bg-bg-warm',
        authorId: row.id,
        authorHandle: row.name,
      })),
      services: (row.master_services ?? []).map((s: any) => ({
        title: s.title,
        priceFrom: s.price_from,
        description: s.description,
      })),
    }),
  }
}

// ══════════════════════════════════════════
// МАТЕРИАЛЫ
// ══════════════════════════════════════════
export const supabaseMaterialsApi = {
  async list(filters?: { category?: MaterialCategory }): Promise<Material[]> {
    let query = supabase
      .from('materials')
      .select('*, supplier:supplier_id(name)')
      .eq('in_stock', true)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    const { data, error } = await query
    if (error) {
      console.error('materialsApi.list error:', error)
      return []
    }
    return (data ?? []).map(mapMaterial)
  },

  async getById(id: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*, supplier:supplier_id(id, name, city)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return mapMaterial(data)
  },
}

function mapMaterial(row: any): Material {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    vendorId: row.supplier_id,
    vendorName: row.supplier?.name ?? 'Поставщик',
    price: row.price,
    unit: row.unit,
    discount: row.discount || undefined,
    isNew: row.is_new,
    imageStyle: 'bg-bg-warm',
    description: row.description,
    inStock: row.in_stock,
    specs: row.specs ?? [],
    origin: row.origin,
    warranty: row.warranty,
    minOrder: row.min_order,
  }
}

// ══════════════════════════════════════════
// ЗАКАЗЫ
// ══════════════════════════════════════════
export const supabaseOrdersApi = {
  async list(filters?: { status?: string }): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(name),
        bids(id)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    } else {
      // По умолчанию — только открытые
      query = query.eq('status', 'open')
    }

    const { data, error } = await query
    if (error) {
      console.error('ordersApi.list error:', error)
      return []
    }
    return (data ?? []).map(mapOrder)
  },

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(id, name),
        bids(
          id, proposed_price, proposed_days, message, status, created_at,
          master:master_id(id, name, master_profiles(rating))
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return mapOrder(data)
  },

  async create(order: {
    title: string
    description: string
    category: FurnitureCategory
    city: string
    district?: string
    budget: number
    deadlineWeeks: number
    requirements?: string[]
    preferredMaterials?: string[]
  }): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        title: order.title,
        description: order.description,
        category: order.category,
        city: order.city,
        district: order.district,
        budget: order.budget,
        deadline_weeks: order.deadlineWeeks,
        requirements: order.requirements ?? [],
        preferred_materials: order.preferredMaterials ?? [],
        status: 'open',
      })
      .select('*, customer:customer_id(name), bids(id)')
      .single()

    if (error) throw error
    return mapOrder(data)
  },

  async getMyOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customer_id(name), bids(id)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapOrder)
  },
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    city: row.city,
    district: row.district,
    budget: row.budget,
    deadlineWeeks: row.deadline_weeks,
    status: row.status,
    createdAt: row.created_at,
    customerId: row.customer_id,
    customerName: row.customer?.name,
    customerInitial: initial(row.customer?.name ?? '?'),
    bidsCount: Array.isArray(row.bids) ? row.bids.length : 0,
    bidAvatars: [],
    requirements: row.requirements ?? [],
    preferredMaterials: row.preferred_materials ?? [],
  }
}

// ══════════════════════════════════════════
// ОТКЛИКИ (BIDS)
// ══════════════════════════════════════════
export const supabaseBidsApi = {
  async create(bid: {
    orderId: string
    proposedPrice: number
    proposedDays: number
    message: string
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Не авторизован')

    const { error } = await supabase.from('bids').insert({
      order_id: bid.orderId,
      master_id: user.id,
      proposed_price: bid.proposedPrice,
      proposed_days: bid.proposedDays,
      message: bid.message,
    })

    if (error) throw error
  },

  async accept(bidId: string, orderId: string): Promise<void> {
    // Принять отклик и перевести заказ в работу
    const { error: e1 } = await supabase
      .from('bids').update({ status: 'accepted' }).eq('id', bidId)
    const { error: e2 } = await supabase
      .from('orders').update({ status: 'in_progress' }).eq('id', orderId)
    if (e1 || e2) throw e1 || e2
  },

  async reject(bidId: string): Promise<void> {
    const { error } = await supabase
      .from('bids').update({ status: 'rejected' }).eq('id', bidId)
    if (error) throw error
  },
}

// ══════════════════════════════════════════
// ЧАТ — Realtime
// ══════════════════════════════════════════
export const supabaseMessagesApi = {
  async getThreads(): Promise<ChatThread[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('chat_threads')
      .select(`
        *,
        a:participant_a(id, name, role),
        b:participant_b(id, name, role)
      `)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((t: any) => {
      const isA = t.participant_a === user.id
      const other = isA ? t.b : t.a
      return {
        id: t.id,
        participantId: other?.id ?? '',
        participantName: other?.name ?? 'Пользователь',
        participantInitial: initial(other?.name ?? '?'),
        participantRole: other?.role ?? 'customer',
        lastMessage: t.last_message ?? '',
        lastMessageAt: t.last_message_at,
        unread: isA ? (t.unread_a ?? 0) : (t.unread_b ?? 0),
        orderId: t.order_id,
      }
    })
  },

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, name)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map((m: any) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderName: m.sender?.name ?? 'Пользователь',
      text: m.text,
      createdAt: m.created_at,
      isOwn: m.sender_id === user?.id,
      attachment: m.attachment,
    }))
  },

  async sendMessage(threadId: string, text: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Не авторизован')

    const { error } = await supabase.from('messages').insert({
      thread_id: threadId,
      sender_id: user.id,
      text,
    })
    if (error) throw error
  },

  async getOrCreateThread(otherUserId: string, orderId?: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Не авторизован')

    // Ищем существующий тред
    const { data: existing } = await supabase
      .from('chat_threads')
      .select('id')
      .or(
        `and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),` +
        `and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`
      )
      .single()

    if (existing) return existing.id

    // Создаём новый
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({
        participant_a: user.id,
        participant_b: otherUserId,
        order_id: orderId ?? null,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  },

  async markRead(threadId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: thread } = await supabase
      .from('chat_threads')
      .select('participant_a, participant_b')
      .eq('id', threadId)
      .single()

    if (!thread) return
    const isA = thread.participant_a === user.id
    await supabase
      .from('chat_threads')
      .update(isA ? { unread_a: 0 } : { unread_b: 0 })
      .eq('id', threadId)
  },

  // Realtime подписка на новые сообщения
  subscribeToThread(threadId: string, onMessage: (msg: any) => void) {
    return supabase
      .channel(`thread:${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      }, (payload) => onMessage(payload.new))
      .subscribe()
  },

  // Избранное
  async addFavorite(targetType: 'master' | 'material', targetId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Не авторизован')
    await supabase.from('favorites').insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    })
  },

  async removeFavorite(targetType: 'master' | 'material', targetId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
  },

  async getFavorites(): Promise<{ masters: string[]; materials: string[] }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { masters: [], materials: [] }
    const { data } = await supabase
      .from('favorites')
      .select('target_type, target_id')
      .eq('user_id', user.id)
    const masters = (data ?? []).filter(f => f.target_type === 'master').map(f => f.target_id)
    const materials = (data ?? []).filter(f => f.target_type === 'material').map(f => f.target_id)
    return { masters, materials }
  },
}
