import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Star,
  Package,
  MessageCircle,
  Heart,
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Briefcase,
  Camera,
  Phone,
  MapPin,
  Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ordersApi, mastersApi } from "@/api/client";
import { useAppStore } from "@/store/useAppStore";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { cn, formatShortPrice, timeAgo } from "@/lib/utils";

// ─── Хук для получения профиля из Supabase ───
function useProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
  });
}

// ─── Статус-бейдж ───
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    open: { label: "Открыт", class: "bg-[#e6f0d8] text-[#4a5a2a]" },
    in_progress: { label: "В работе", class: "bg-amber-soft text-amber-deep" },
    done: { label: "Завершён", class: "bg-bg-warm text-ink-muted" },
    cancelled: { label: "Отменён", class: "bg-bg-warm text-ink-muted" },
    pending: { label: "Ожидает", class: "bg-amber-soft text-amber-deep" },
    accepted: { label: "Принят", class: "bg-[#e6f0d8] text-[#4a5a2a]" },
    rejected: { label: "Отклонён", class: "bg-bg-warm text-ink-muted" },
  };
  const s = map[status] ?? {
    label: status,
    class: "bg-bg-warm text-ink-muted",
  };
  return (
    <span
      className={cn(
        "text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
        s.class,
      )}
    >
      {s.label}
    </span>
  );
}

// ═══════════════════════════════════════════
// ЗАКАЗЧИК
// ═══════════════════════════════════════════
function CustomerDashboard({ profile }: { profile: any }) {
  const showToast = useAppStore((s) => s.showToast);
  const favorites = useAppStore((s) => s.favorites);
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersApi.list(),
  });

  // Фильтруем заказы текущего пользователя (по customerId из моков)
  const myOrders = orders.slice(0, 3); // показываем первые 3 для демо

  const stats = [
    {
      label: "Мои заказы",
      value: myOrders.length,
      icon: <ClipboardList size={18} />,
      color: "text-amber-deep",
    },
    {
      label: "Избранных мастеров",
      value: favorites.masters.length,
      icon: <Heart size={18} />,
      color: "text-moss",
    },
    {
      label: "Активных откликов",
      value: myOrders.reduce((s: number, o: any) => s + o.bidsCount, 0),
      icon: <MessageCircle size={18} />,
      color: "text-amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className={cn("flex justify-center mb-2", s.color)}>
              {s.icon}
            </div>
            <div className="font-display text-3xl font-semibold">{s.value}</div>
            <div className="text-xs text-ink-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Мои заказы */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">Мои заказы</h3>
          <Link
            to="/orders/new"
            className="flex items-center gap-1.5 text-sm font-semibold text-amber-deep hover:text-amber-deep/80"
          >
            <Plus size={15} /> Новый заказ
          </Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-ink-muted">
            <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
            <p>
              Нет заказов.{" "}
              <Link to="/orders/new" className="text-amber-deep font-medium">
                Создать первый →
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((order: any) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between p-4 bg-bg-warm rounded-xl hover:bg-line-soft transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{order.title}</div>
                  <div className="text-sm text-ink-muted mt-0.5">
                    {order.bidsCount} откликов · {timeAgo(order.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <StatusBadge status={order.status} />
                  <ChevronRight size={16} className="text-ink-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Избранные мастера */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">
            Избранные мастера
          </h3>
          <Link to="/masters" className="text-sm text-amber-deep font-semibold">
            Найти мастера →
          </Link>
        </div>
        {favorites.masters.length === 0 ? (
          <div className="text-center py-6 text-ink-muted text-sm">
            Нажми ❤ на странице мастера чтобы добавить в избранное
          </div>
        ) : (
          <div className="text-sm text-ink-muted">
            {favorites.masters.length} мастеров в избранном
          </div>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/constructor"
          className="card p-5 hover:border-amber text-center transition-all hover:-translate-y-0.5"
        >
          <div className="text-2xl mb-2">📐</div>
          <div className="font-semibold text-sm">Конструктор мебели</div>
          <div className="text-xs text-ink-muted mt-1">
            Нарисовать и отправить мастеру
          </div>
        </Link>
        <Link
          to="/masters"
          className="card p-5 hover:border-amber text-center transition-all hover:-translate-y-0.5"
        >
          <div className="text-2xl mb-2">👨‍🔧</div>
          <div className="font-semibold text-sm">Найти мастера</div>
          <div className="text-xs text-ink-muted mt-1">
            Каталог мастеров Кыргызстана
          </div>
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// МАСТЕР
// ═══════════════════════════════════════════
function MasterDashboard({ profile }: { profile: any }) {
  const showToast = useAppStore((s) => s.showToast);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "orders" | "portfolio" | "services"
  >("orders");

  const { data: orders = [] } = useQuery({
    queryKey: ["available-orders"],
    queryFn: () => ordersApi.list({ status: "open" }),
  });

  const { data: myPortfolio = [] } = useQuery({
    queryKey: ["my-portfolio"],
    queryFn: () => mastersApi.getPortfolio("mst-1"),
  });

  const stats = [
    {
      label: "Рейтинг",
      value: "4.9",
      icon: <Star size={16} className="fill-amber text-amber" />,
      color: "text-amber-deep",
    },
    {
      label: "Проектов",
      value: "87",
      icon: <CheckCircle2 size={16} />,
      color: "text-moss",
    },
    {
      label: "Откликов",
      value: orders.length,
      icon: <ClipboardList size={16} />,
      color: "text-amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className={cn("flex justify-center mb-2", s.color)}>
              {s.icon}
            </div>
            <div className="font-display text-3xl font-semibold">{s.value}</div>
            <div className="text-xs text-ink-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Вкладки */}
      <div className="flex bg-bg-warm rounded-xl p-1 gap-1">
        {(
          [
            { id: "orders", label: "Заказы" },
            { id: "portfolio", label: "Портфолио" },
            { id: "services", label: "Услуги" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === tab.id
                ? "bg-paper shadow-sm text-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Доступные заказы */}
      {activeTab === "orders" && (
        <div className="card p-6">
          <h3 className="font-display text-xl font-semibold mb-4">
            Доступные заказы
          </h3>
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between p-4 bg-bg-warm rounded-xl hover:bg-line-soft transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{order.title}</div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-ink-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {order.city}
                    </span>
                    <span>{timeAgo(order.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <div className="text-right">
                    <div className="font-display font-semibold text-amber-deep">
                      {formatShortPrice(order.budget)} с
                    </div>
                    <div className="text-xs text-ink-muted">
                      {order.deadlineWeeks} нед
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-muted" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Портфолио */}
      {activeTab === "portfolio" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold">
              Моё портфолио
            </h3>
            <button
              onClick={() => showToast("Загрузка фото — скоро")}
              className="flex items-center gap-1.5 text-sm font-semibold text-amber-deep"
            >
              <Plus size={15} /> Добавить работу
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {myPortfolio.map((item: any) => (
              <div
                key={item.id}
                className="relative rounded-xl overflow-hidden group"
              >
                <div className={`${item.imageStyle} aspect-square`} />
                <div className="absolute inset-0 bg-wood-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => showToast("Удалено")}
                    className="w-8 h-8 bg-paper/20 rounded-full grid place-items-center hover:bg-paper/40"
                  >
                    <Trash2 size={14} className="text-paper" />
                  </button>
                </div>
                <div className="p-2 text-xs font-medium truncate">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Услуги */}
      {activeTab === "services" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold">Мои услуги</h3>
            <button
              onClick={() => showToast("Добавление услуги — скоро")}
              className="flex items-center gap-1.5 text-sm font-semibold text-amber-deep"
            >
              <Plus size={15} /> Добавить
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                title: "Кухонный гарнитур",
                price: 80000,
                desc: "МДФ или массив",
              },
              { title: "Шкаф-купе", price: 45000, desc: "Любые размеры" },
              { title: "Гардеробная", price: 120000, desc: "Под ключ" },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-bg-warm rounded-xl"
              >
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-ink-muted">{s.desc}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-display font-semibold text-amber-deep">
                    от {formatShortPrice(s.price)} с
                  </div>
                  <button
                    onClick={() => showToast("Редактирование — скоро")}
                    className="w-8 h-8 bg-paper rounded-full grid place-items-center hover:bg-line-soft"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// ПОСТАВЩИК
// ═══════════════════════════════════════════
function SupplierDashboard({ profile }: { profile: any }) {
  const showToast = useAppStore((s) => s.showToast);
  const { data: materials = [] } = useQuery({
    queryKey: ["my-materials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const stats = [
    {
      label: "Материалов",
      value: materials.length,
      icon: <Package size={18} />,
      color: "text-amber-deep",
    },
    {
      label: "Просмотров",
      value: "1.2k",
      icon: <TrendingUp size={18} />,
      color: "text-moss",
    },
    {
      label: "Запросов",
      value: "24",
      icon: <MessageCircle size={18} />,
      color: "text-amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className={cn("flex justify-center mb-2", s.color)}>
              {s.icon}
            </div>
            <div className="font-display text-3xl font-semibold">{s.value}</div>
            <div className="text-xs text-ink-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Мои материалы */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">Мои материалы</h3>
          <button
            onClick={() => showToast("Добавление материала — скоро")}
            className="flex items-center gap-1.5 text-sm font-semibold text-amber-deep"
          >
            <Plus size={15} /> Добавить
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-8 text-ink-muted">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="mb-3">Нет материалов. Добавьте первый!</p>
            <button
              onClick={() => showToast("Форма добавления — скоро")}
              className="btn-primary"
            >
              <Plus size={14} /> Добавить материал
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((mat: any) => (
              <div
                key={mat.id}
                className="flex items-center justify-between p-4 bg-bg-warm rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{mat.title}</div>
                  <div className="text-sm text-ink-muted">{mat.category}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-semibold">{mat.price} с</div>
                    <div className="text-xs text-ink-muted">/{mat.unit}</div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full",
                      mat.in_stock
                        ? "bg-[#e6f0d8] text-[#4a5a2a]"
                        : "bg-bg-warm text-ink-muted",
                    )}
                  >
                    {mat.in_stock ? "В наличии" : "Нет"}
                  </span>
                  <button
                    onClick={() => showToast("Редактирование — скоро")}
                    className="w-8 h-8 bg-paper rounded-full grid place-items-center hover:bg-line-soft"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Быстрые ссылки */}
      <div className="card p-6">
        <h3 className="font-display text-lg font-semibold mb-3">
          Каталог материалов
        </h3>
        <Link
          to="/materials"
          className="flex items-center justify-between p-3 bg-bg-warm rounded-xl hover:bg-line-soft transition-colors"
        >
          <span className="text-sm font-medium">
            Посмотреть как видят покупатели
          </span>
          <ChevronRight size={16} className="text-ink-muted" />
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// РЕДАКТИРОВАНИЕ ПРОФИЛЯ
// ═══════════════════════════════════════════
function EditProfileModal({
  profile,
  onClose,
}: {
  profile: any;
  onClose: () => void;
}) {
  const showToast = useAppStore((s) => s.showToast);
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "Бишкек");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ name, phone, city, bio })
        .eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      showToast("Профиль сохранён ✓");
      onClose();
    } catch {
      showToast("Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wood-dark/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl p-6 w-full max-w-md shadow-lift">
        <h3 className="font-display text-xl font-semibold mb-5">
          Редактировать профиль
        </h3>
        <div className="space-y-4">
          {[
            {
              label: "Имя",
              value: name,
              set: setName,
              placeholder: "Ваше имя",
            },
            {
              label: "Телефон",
              value: phone,
              set: setPhone,
              placeholder: "+996 555 000 000",
            },
            {
              label: "Город",
              value: city,
              set: setCity,
              placeholder: "Бишкек",
            },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                {f.label}
              </label>
              <input
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="form-input"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              О себе
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder="Расскажите о себе..."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-line font-semibold text-sm hover:bg-bg-warm"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-wood-dark text-paper font-semibold text-sm hover:bg-amber-deep disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ
// ═══════════════════════════════════════════
export function ProfilePage() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const { role, setRole } = useAppStore();
  const [editOpen, setEditOpen] = useState(false);
  const { data: profile, isLoading } = useProfile();

  // Если не авторизован — редирект на /auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showToast("Вы вышли из аккаунта");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name || "Пользователь";
  const displayRole = profile?.role || role;

  return (
    <div className="animate-page-in">
      <Breadcrumbs
        items={[{ label: "Главная", to: "/" }, { label: "Личный кабинет" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6">
        {/* ─── САЙДБАР ─── */}
        <aside className="space-y-3 md:space-y-4">
          {/* Карточка профиля */}
          <div className="card p-4 md:p-6">
            {/* Аватар + имя — горизонтально на мобиле, вертикально на десктопе */}
            <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center">
              <div className="relative shrink-0">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-wood-dark text-amber-soft grid place-items-center font-display text-2xl md:text-3xl font-bold">
                  {displayName[0]?.toUpperCase()}
                </div>
                <button
                  onClick={() => showToast("Загрузка фото — скоро")}
                  className="absolute bottom-0 right-0 w-6 h-6 md:w-7 md:h-7 bg-amber-deep text-paper rounded-full grid place-items-center border-2 border-paper hover:bg-amber transition-colors"
                >
                  <Camera size={11} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg md:text-xl font-semibold truncate">
                  {displayName}
                </h2>
                <div className="text-xs text-ink-muted mt-0.5 truncate">
                  {profile?.email}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1.5",
                    displayRole === "master"
                      ? "bg-amber-soft text-amber-deep"
                      : displayRole === "supplier"
                        ? "bg-[#e6f0d8] text-[#4a5a2a]"
                        : "bg-bg-warm text-ink-muted",
                  )}
                >
                  {displayRole === "master"
                    ? "👨‍🔧 Мастер"
                    : displayRole === "supplier"
                      ? "📦 Поставщик"
                      : "🛒 Заказчик"}
                </div>
                {profile?.city && (
                  <div className="flex items-center gap-1 text-xs text-ink-muted mt-1 md:justify-center">
                    <MapPin size={11} /> {profile.city}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-bg-warm hover:bg-line-soft transition-colors text-sm font-semibold"
            >
              <Edit2 size={13} /> Редактировать
            </button>
          </div>

          {/* Навигация */}
          <div className="card p-3">
            {[
              { icon: <User size={15} />, label: "Профиль", active: true },
              {
                icon: <MessageCircle size={15} />,
                label: "Сообщения",
                to: "/messages",
              },
              { icon: <Heart size={15} />, label: "Избранное", to: "/masters" },
              {
                icon: <Settings size={15} />,
                label: "Настройки",
                action: () => showToast("Настройки — скоро"),
              },
            ].map((item, i) =>
              item.to ? (
                <Link
                  key={i}
                  to={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-soft hover:bg-bg-warm hover:text-ink transition-colors"
                >
                  {item.icon} {item.label}
                </Link>
              ) : (
                <button
                  key={i}
                  onClick={item.action ?? undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    item.active
                      ? "bg-bg-warm text-ink font-semibold"
                      : "text-ink-soft hover:bg-bg-warm hover:text-ink",
                  )}
                >
                  {item.icon} {item.label}
                </button>
              ),
            )}
          </div>

          {/* Переключить роль (для теста) */}
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Тестировать как
            </div>
            <div className="flex flex-col gap-1">
              {(["customer", "master", "supplier"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left",
                    role === r
                      ? "bg-wood-dark text-paper"
                      : "bg-bg-warm text-ink-soft hover:bg-line-soft",
                  )}
                >
                  {r === "customer"
                    ? "🛒 Заказчик"
                    : r === "master"
                      ? "👨‍🔧 Мастер"
                      : "📦 Поставщик"}
                </button>
              ))}
            </div>
          </div>

          {/* Выйти */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line text-sm font-semibold text-ink-muted hover:bg-bg-warm hover:text-ink transition-colors"
          >
            <LogOut size={15} /> Выйти из аккаунта
          </button>
        </aside>

        {/* ─── ОСНОВНОЙ КОНТЕНТ ─── */}
        <main>
          {/* Заголовок */}
          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-4xl font-semibold tracking-tight">
              {role === "master"
                ? "Кабинет мастера"
                : role === "supplier"
                  ? "Кабинет поставщика"
                  : "Личный кабинет"}
            </h1>
            <p className="text-ink-muted mt-1">
              {role === "master"
                ? "Управляйте заказами, портфолио и услугами"
                : role === "supplier"
                  ? "Управляйте каталогом материалов"
                  : "Ваши заказы, избранное и проекты"}
            </p>
          </div>

          {role === "master" && <MasterDashboard profile={profile} />}
          {role === "supplier" && <SupplierDashboard profile={profile} />}
          {role === "customer" && <CustomerDashboard profile={profile} />}
        </main>
      </div>

      {/* Модал редактирования */}
      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
