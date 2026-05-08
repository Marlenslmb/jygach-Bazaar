-- =============================================
-- JYGACH BAZAAR — Supabase Schema
-- Вставь это в SQL Editor в Supabase Dashboard
-- =============================================

-- Включаем расширения
create extension if not exists "uuid-ossp";

-- =============================================
-- ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- =============================================
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  role        text not null check (role in ('customer', 'master', 'supplier')) default 'customer',
  name        text not null default '',
  phone       text,
  city        text default 'Бишкек',
  avatar_url  text,
  bio         text,
  verified    boolean default false,
  created_at  timestamptz default now()
);

-- Автоматически создаём профиль при регистрации
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- ПРОФИЛИ МАСТЕРОВ (расширение profiles)
-- =============================================
create table master_profiles (
  id              uuid references profiles(id) on delete cascade primary key,
  specialization  text,
  years_exp       int default 0,
  rating          numeric(3,2) default 0,
  projects_count  int default 0,
  tags            text[] default '{}',
  cover_color     int default 1 check (cover_color between 1 and 6),
  working_hours   text,
  address         text,
  whatsapp        text,
  response_time   text default 'В течение часа'
);

-- =============================================
-- МАТЕРИАЛЫ (для поставщиков)
-- =============================================
create table materials (
  id           uuid default uuid_generate_v4() primary key,
  supplier_id  uuid references profiles(id) on delete cascade,
  title        text not null,
  category     text not null,
  price        numeric(10,2) not null,
  unit         text not null default 'шт',
  discount     int default 0 check (discount between 0 and 100),
  description  text,
  in_stock     boolean default true,
  is_new       boolean default false,
  specs        jsonb default '[]',
  origin       text,
  warranty     text,
  min_order    text,
  image_url    text,
  created_at   timestamptz default now()
);

-- =============================================
-- ЗАКАЗЫ (от заказчиков)
-- =============================================
create table orders (
  id                 uuid default uuid_generate_v4() primary key,
  customer_id        uuid references profiles(id) on delete cascade,
  title              text not null,
  description        text not null,
  category           text not null,
  city               text not null,
  district           text,
  budget             numeric(10,2) not null,
  deadline_weeks     int not null,
  status             text default 'open' check (status in ('open','in_progress','done','cancelled')),
  requirements       text[] default '{}',
  preferred_materials text[] default '{}',
  has_attachment     boolean default false,
  created_at         timestamptz default now()
);

-- =============================================
-- ОТКЛИКИ НА ЗАКАЗЫ
-- =============================================
create table bids (
  id              uuid default uuid_generate_v4() primary key,
  order_id        uuid references orders(id) on delete cascade,
  master_id       uuid references profiles(id) on delete cascade,
  proposed_price  numeric(10,2) not null,
  proposed_days   int not null,
  message         text not null,
  status          text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at      timestamptz default now(),
  unique (order_id, master_id)
);

-- =============================================
-- ОТЗЫВЫ О МАСТЕРАХ
-- =============================================
create table reviews (
  id             uuid default uuid_generate_v4() primary key,
  master_id      uuid references profiles(id) on delete cascade,
  author_id      uuid references profiles(id) on delete cascade,
  rating         int not null check (rating between 1 and 5),
  text           text not null,
  project_title  text,
  helpful        int default 0,
  created_at     timestamptz default now(),
  unique (master_id, author_id)
);

-- Автообновление рейтинга мастера после нового отзыва
create or replace function update_master_rating()
returns trigger as $$
begin
  update master_profiles
  set rating = (
    select round(avg(rating)::numeric, 2)
    from reviews
    where master_id = new.master_id
  )
  where id = new.master_id;
  return new;
end;
$$ language plpgsql;

create trigger after_review_insert
  after insert or update on reviews
  for each row execute function update_master_rating();

-- =============================================
-- ПОРТФОЛИО МАСТЕРОВ
-- =============================================
create table portfolio_items (
  id          uuid default uuid_generate_v4() primary key,
  master_id   uuid references profiles(id) on delete cascade,
  title       text not null,
  category    text not null,
  image_url   text,
  created_at  timestamptz default now()
);

-- =============================================
-- ЧАТЫ И СООБЩЕНИЯ
-- =============================================
create table chat_threads (
  id              uuid default uuid_generate_v4() primary key,
  participant_a   uuid references profiles(id) on delete cascade,
  participant_b   uuid references profiles(id) on delete cascade,
  order_id        uuid references orders(id) on delete set null,
  last_message    text,
  last_message_at timestamptz default now(),
  unread_a        int default 0,
  unread_b        int default 0,
  created_at      timestamptz default now(),
  unique (participant_a, participant_b)
);

create table messages (
  id          uuid default uuid_generate_v4() primary key,
  thread_id   uuid references chat_threads(id) on delete cascade,
  sender_id   uuid references profiles(id) on delete cascade,
  text        text not null,
  attachment  jsonb,
  created_at  timestamptz default now()
);

-- Обновляем last_message в треде при новом сообщении
create or replace function update_thread_last_message()
returns trigger as $$
begin
  update chat_threads
  set
    last_message = new.text,
    last_message_at = new.created_at,
    unread_a = case
      when participant_b = new.sender_id then unread_a + 1
      else unread_a
    end,
    unread_b = case
      when participant_a = new.sender_id then unread_b + 1
      else unread_b
    end
  where id = new.thread_id;
  return new;
end;
$$ language plpgsql;

create trigger after_message_insert
  after insert on messages
  for each row execute function update_thread_last_message();

-- =============================================
-- ИЗБРАННОЕ
-- =============================================
create table favorites (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('master', 'material')),
  target_id   uuid not null,
  created_at  timestamptz default now(),
  unique (user_id, target_type, target_id)
);

-- =============================================
-- SERVICES МАСТЕРОВ
-- =============================================
create table master_services (
  id          uuid default uuid_generate_v4() primary key,
  master_id   uuid references profiles(id) on delete cascade,
  title       text not null,
  price_from  numeric(10,2) not null,
  description text
);

-- =============================================
-- RLS — Row Level Security
-- =============================================
alter table profiles enable row level security;
alter table master_profiles enable row level security;
alter table materials enable row level security;
alter table orders enable row level security;
alter table bids enable row level security;
alter table reviews enable row level security;
alter table portfolio_items enable row level security;
alter table chat_threads enable row level security;
alter table messages enable row level security;
alter table favorites enable row level security;
alter table master_services enable row level security;

-- Профили: все видят, редактирует только владелец
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- master_profiles: все видят, редактирует только владелец
create policy "master_profiles_select" on master_profiles for select using (true);
create policy "master_profiles_insert" on master_profiles for insert with check (auth.uid() = id);
create policy "master_profiles_update" on master_profiles for update using (auth.uid() = id);

-- Материалы: все видят, поставщик управляет своими
create policy "materials_select" on materials for select using (true);
create policy "materials_insert" on materials for insert with check (auth.uid() = supplier_id);
create policy "materials_update" on materials for update using (auth.uid() = supplier_id);
create policy "materials_delete" on materials for delete using (auth.uid() = supplier_id);

-- Заказы: все видят открытые, заказчик управляет своими
create policy "orders_select" on orders for select using (status = 'open' or auth.uid() = customer_id);
create policy "orders_insert" on orders for insert with check (auth.uid() = customer_id);
create policy "orders_update" on orders for update using (auth.uid() = customer_id);

-- Отклики: участники видят свои
create policy "bids_select" on bids for select using (
  auth.uid() = master_id or
  auth.uid() = (select customer_id from orders where id = order_id)
);
create policy "bids_insert" on bids for insert with check (auth.uid() = master_id);
create policy "bids_update" on bids for update using (auth.uid() = master_id);

-- Отзывы: все видят, автор управляет
create policy "reviews_select" on reviews for select using (true);
create policy "reviews_insert" on reviews for insert with check (auth.uid() = author_id);

-- Портфолио: все видят
create policy "portfolio_select" on portfolio_items for select using (true);
create policy "portfolio_insert" on portfolio_items for insert with check (auth.uid() = master_id);
create policy "portfolio_delete" on portfolio_items for delete using (auth.uid() = master_id);

-- Чат: только участники треда
create policy "threads_select" on chat_threads for select using (
  auth.uid() = participant_a or auth.uid() = participant_b
);
create policy "threads_insert" on chat_threads for insert with check (
  auth.uid() = participant_a or auth.uid() = participant_b
);
create policy "threads_update" on chat_threads for update using (
  auth.uid() = participant_a or auth.uid() = participant_b
);

create policy "messages_select" on messages for select using (
  auth.uid() in (
    select participant_a from chat_threads where id = thread_id
    union
    select participant_b from chat_threads where id = thread_id
  )
);
create policy "messages_insert" on messages for insert with check (auth.uid() = sender_id);

-- Избранное: только владелец
create policy "favorites_select" on favorites for select using (auth.uid() = user_id);
create policy "favorites_insert" on favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on favorites for delete using (auth.uid() = user_id);

-- Услуги мастеров: все видят
create policy "services_select" on master_services for select using (true);
create policy "services_insert" on master_services for insert with check (auth.uid() = master_id);
create policy "services_update" on master_services for update using (auth.uid() = master_id);
create policy "services_delete" on master_services for delete using (auth.uid() = master_id);

-- =============================================
-- ТЕСТОВЫЕ ДАННЫЕ (опционально)
-- Раскомментируй если хочешь заполнить БД
-- =============================================
-- Вставь после создания пользователей через Auth
