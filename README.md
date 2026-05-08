# Jygach Bazaar 🪵

Маркетплейс мебельной индустрии Кыргызстана: заказчики, мастера, поставщики материалов в одном месте.

## Стек

- **React 18** + **TypeScript** + **Vite** — быстрая сборка, типобезопасность
- **Tailwind CSS** — утилитарные стили с собственной дизайн-системой
- **React Router v6** — роутинг
- **TanStack Query** — управление серверным состоянием (кеширование, loading-стейты)
- **Zustand** — глобальное состояние (роль, город, избранное) с persist в localStorage
- **Lucide React** — иконки

## Запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`.

## Сборка для продакшена

```bash
npm run build
npm run preview
```

## Структура проекта

```
src/
├── api/                  ← Слой работы с данными
│   ├── client.ts         ← Единая точка входа (моки сейчас, Supabase потом)
│   ├── types.ts          ← TypeScript типы (Material, Master, Order, ...)
│   └── mock/
│       ├── client.ts     ← Mock API с имитацией задержек
│       ├── materials.ts  ← Моки материалов
│       ├── masters.ts    ← Моки мастеров и портфолио
│       └── orders.ts     ← Моки заказов
│
├── components/
│   ├── ui/               ← Базовые UI-компоненты (Toast)
│   └── shared/           ← Общие компоненты (Header, Footer, SectionHead)
│
├── pages/                ← Страницы приложения
│   ├── HomePage.tsx
│   ├── MaterialsPage.tsx
│   ├── MastersPage.tsx
│   ├── OrdersPage.tsx
│   └── ConstructorPage.tsx
│
├── store/
│   └── useAppStore.ts    ← Zustand store с persist
│
├── lib/
│   └── utils.ts          ← Утилиты (cn, formatPrice, timeAgo)
│
├── assets/
│   └── visuals.css       ← CSS-визуалы (заменяемы на реальные фото)
│
├── App.tsx               ← Корень с роутингом
└── main.tsx              ← Точка входа (Provider'ы)
```

## Ключевые архитектурные решения

### 1. API-слой как абстракция

Все запросы идут через `src/api/client.ts`:

```ts
import { materialsApi, mastersApi, ordersApi } from '@/api/client'

const { data } = useQuery({
  queryKey: ['materials'],
  queryFn: () => materialsApi.list(),
})
```

Сейчас под капотом — моки с искусственными задержками (300мс), чтобы UI вёл себя реалистично (показывал loading-скелетоны).

### 2. TanStack Query

Все серверные данные кешируются автоматически. Если перейти со страницы материалов на главную и обратно — данные не перезапросятся, они уже в кеше.

### 3. Zustand с persist

Глобальное состояние (выбранная роль, город, избранное) сохраняется в localStorage. При перезагрузке страницы пользователь видит свои настройки.

### 4. Дизайн-токены в Tailwind

Все цвета, шрифты, тени описаны в `tailwind.config.js`. Меняешь там — меняется везде:

```js
colors: {
  amber: { DEFAULT: '#c8651b', deep: '#9c4a0e', soft: '#f0d9b5' },
  wood: { dark: '#2a1f17', mid: '#6b4a2b' },
}
```

## 🔄 Переход с моков на Supabase (для боевой версии)

### Шаг 1. Создать проект в Supabase

Бесплатный план: 500 MB БД, 1 GB Storage, 50 000 MAU.

### Шаг 2. Создать таблицы

```sql
create table materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  vendor_id uuid references suppliers(id),
  price numeric not null,
  unit text not null,
  discount integer,
  is_new boolean default false,
  image_url text,
  description text,
  in_stock boolean default true,
  created_at timestamptz default now()
);

create table masters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialization text,
  city text not null,
  rating numeric default 0,
  projects_count integer default 0,
  years_experience integer default 0,
  verified boolean default false,
  tags text[] default '{}',
  bio text,
  cover_url text,
  avatar_url text,
  user_id uuid references auth.users(id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  city text not null,
  district text,
  budget numeric not null,
  deadline_weeks integer,
  status text default 'open',
  customer_id uuid references auth.users(id),
  created_at timestamptz default now()
);
```

### Шаг 3. Установить Supabase SDK

```bash
npm install @supabase/supabase-js
```

### Шаг 4. Создать `src/api/supabase/client.ts`

```ts
import { createClient } from '@supabase/supabase-js'
import type { Material, Master, Order } from '../types'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export const supabaseMaterialsApi = {
  async list(filters?: { category?: string }): Promise<Material[]> {
    let query = supabase.from('materials').select('*')
    if (filters?.category) query = query.eq('category', filters.category)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },
  // ... остальные методы
}
```

### Шаг 5. Заменить импорт в `src/api/client.ts`

```ts
// Было:
import { mockMaterialsApi } from './mock/client'
export const materialsApi = mockMaterialsApi

// Стало:
import { supabaseMaterialsApi } from './supabase/client'
export const materialsApi = supabaseMaterialsApi
```

**UI-код менять не нужно** — интерфейс совместим.

### Шаг 6. Создать `.env.local`

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Что дальше

### Не реализовано в бете (планируется):

- 📷 Загрузка реальных изображений (вместо CSS-визуалов)
- 💬 Чат между пользователями
- 🔐 Авторизация (Supabase Auth)
- 📄 Детальные страницы (профиль мастера, карточка материала, заявка)
- 📨 Отклики мастеров на заявки
- 🛒 Корзина материалов и оформление заказа поставщику
- 💳 Подписки и платежи (для боевой версии)
- 📱 Мобильное приложение (React Native + Expo) переиспользует API-слой

### Развитие конструктора:

Текущий конструктор — заготовка. В бете:
- Drag & drop элементов
- Сохранение проектов
- Экспорт в PDF/PNG (через `html2canvas` или `jsPDF`)
- Простая 3D-визуализация (Three.js / React Three Fiber)
- Автоматический расчёт стоимости с конкретными артикулами материалов

## Лицензия

MIT
