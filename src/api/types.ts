// ===== Domain types =====
// Эти типы используются и в моках, и потом в Supabase.
// Если структура изменится — поменяешь в одном месте.

export type UserRole = 'customer' | 'master' | 'supplier'

export type City =
  | 'Бишкек'
  | 'Ош'
  | 'Каракол'
  | 'Джалал-Абад'
  | 'Токмок'
  | 'Нарын'
  | 'Талас'

export type MaterialCategory =
  | 'ldsp'
  | 'mdf'
  | 'hardware'
  | 'edge'
  | 'glass'
  | 'fabric'
  | 'paint'
  | 'handles'
  | 'hinges'

export type FurnitureCategory =
  | 'kitchen'
  | 'wardrobe'
  | 'bedroom'
  | 'living'
  | 'office'
  | 'kids'
  | 'hallway'
  | 'other'

export type OrderStatus = 'open' | 'in_progress' | 'done' | 'cancelled'

// ===== Material =====
export interface Material {
  id: string
  title: string
  category: MaterialCategory
  vendorId: string
  vendorName: string
  price: number // в сомах
  unit: string // 'лист' | 'м' | 'шт' | 'м²'
  discount?: number // процент скидки
  isNew?: boolean
  imageStyle: string // ключ для CSS-стилизации в моках
  description?: string
  inStock: boolean
  // Расширенные характеристики для детальной страницы
  specs?: { label: string; value: string }[]
  origin?: string // страна производства
  warranty?: string // гарантия
  minOrder?: string // минимальный заказ
}

// ===== Supplier (поставщик материалов) =====
export interface Supplier {
  id: string
  name: string
  city: City
  rating: number
  reviewsCount: number
  description: string
  logoColor: string
}

// ===== Master (мастер / студия) =====
export interface Master {
  id: string
  name: string
  initial: string // буква для аватара
  specialization: string
  city: City
  rating: number
  projectsCount: number
  yearsExperience: number
  verified: boolean
  tags: string[]
  coverColor: 1 | 2 | 3 | 4 | 5 | 6
  bio?: string
  portfolio?: PortfolioItem[]
  // Контакты и расширенный профиль
  phone?: string
  whatsapp?: string
  workingHours?: string
  address?: string
  services?: { title: string; priceFrom: number; description?: string }[]
  responseTime?: string // 'обычно отвечает в течение 1 часа'
}

// ===== Review (отзыв на мастера) =====
export interface Review {
  id: string
  masterId: string
  authorName: string
  authorInitial: string
  rating: number // 1..5
  text: string
  createdAt: string // ISO
  projectTitle?: string
  helpful?: number
}

export interface PortfolioItem {
  id: string
  title: string
  category: FurnitureCategory
  imageStyle: string
  authorId: string
  authorHandle: string
}

// ===== Order (заявка от заказчика) =====
export interface Order {
  id: string
  title: string
  description: string
  category: FurnitureCategory
  city: City
  district?: string
  budget: number // в сомах
  deadlineWeeks: number
  status: OrderStatus
  createdAt: string // ISO
  customerId: string
  customerName?: string
  customerInitial?: string
  bidsCount: number
  bidAvatars: { initial: string; color: 'b1' | 'b2' | 'b3' }[]
  attachments?: string[] // ссылки на сохранённые проекты из конструктора
  requirements?: string[] // массив требований
  preferredMaterials?: string[]
}

// ===== Bid (отклик мастера на заказ) =====
export interface Bid {
  id: string
  orderId: string
  masterId: string
  masterName: string
  masterInitial: string
  masterRating: number
  proposedPrice: number
  proposedDays: number
  message: string
  createdAt: string
}

// ===== Constructor project (то, что рисует заказчик) =====
export interface ConstructorProject {
  id: string
  type: 'wardrobe' | 'kitchen' | 'table' | 'shelf' | 'bed' | 'custom'
  width: number // мм
  depth: number // мм
  height: number // мм
  material: string
  edgeThickness: number
  hasLighting: boolean
  estimatedMaterialCost: number
  estimatedLaborCost: number
  createdAt: string
}

// ===== Chat =====
export interface ChatThread {
  id: string
  participantId: string
  participantName: string
  participantInitial: string
  participantRole: 'master' | 'supplier' | 'customer'
  lastMessage: string
  lastMessageAt: string // ISO
  unread: number
  orderId?: string
  orderTitle?: string
}

export interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  senderName: string
  text: string
  createdAt: string // ISO
  isOwn: boolean
  attachment?: { type: 'project' | 'image' | 'file'; label: string }
}

// ===== New Order form steps =====
export type NewOrderStep = 'category' | 'details' | 'requirements' | 'budget' | 'preview'
