import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  MapPin,
  PenSquare,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { messagesApi } from "@/api/client";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Главная", end: true },
  { to: "/materials", label: "Материалы" },
  { to: "/masters", label: "Мастера" },
  { to: "/orders", label: "Заказы" },
  { to: "/constructor", label: "Конструктор" },
];

const roleLabels = {
  customer: "Заказчик",
  master: "Мастер",
  supplier: "Поставщик",
} as const;

export function Header() {
  const { role, setRole, city } = useAppStore();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  // Считаем непрочитанные сообщения
  const { data: threads = [] } = useQuery({
    queryKey: ["threads"],
    queryFn: () => messagesApi.getThreads(),
    refetchInterval: 10000,
  });
  const unreadCount = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line">
      <div className="max-w-[1400px] mx-auto px-8 py-3.5 flex items-center gap-8 flex-wrap">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-[22px] font-semibold tracking-tight"
        >
          <div className="w-9 h-9 bg-wood-dark rounded-full grid place-items-center text-amber-soft font-display italic font-bold text-[18px]">
            J
          </div>
          <span>Jygach</span>
          <span className="italic text-amber-deep font-medium">bazaar</span>
        </Link>

        {/* Nav */}
        <nav className="flex gap-1 flex-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-wood-dark text-paper"
                    : "text-ink-soft hover:bg-bg-warm hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper border border-line text-[13px] font-medium">
            <MapPin size={14} />
            {city}
          </div>

          {/* Новый заказ */}
          <Link
            to="/orders/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-soft text-amber-deep text-[13px] font-semibold border border-amber-soft hover:bg-amber-deep hover:text-paper transition-colors"
            title="Создать заявку"
          >
            <PenSquare size={14} />
            Заказать
          </Link>

          {/* Избранное */}
          <button
            className="w-[38px] h-[38px] rounded-full bg-paper border border-line grid place-items-center transition-all hover:bg-bg-warm hover:-translate-y-0.5"
            title="Избранное"
          >
            <Heart size={16} />
          </button>

          {/* Чат с бейджем */}
          <Link
            to="/messages"
            className="relative w-[38px] h-[38px] rounded-full bg-paper border border-line grid place-items-center transition-all hover:bg-bg-warm hover:-translate-y-0.5"
            title="Сообщения"
          >
            <MessageCircle size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-deep text-paper text-[10px] font-bold grid place-items-center border-2 border-bg">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Role selector */}
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="appearance-none bg-wood-dark text-paper text-[13px] font-semibold px-4 py-2 pr-8 rounded-full cursor-pointer hover:bg-amber-deep transition-colors"
            >
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-paper pointer-events-none text-xs">
              ▾
            </span>
          </div>

          {/* Auth button */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="w-[38px] h-[38px] rounded-full bg-amber-soft border border-amber text-amber-deep grid place-items-center hover:bg-amber transition-colors"
                title={user.email}
              >
                <User size={16} />
              </Link>
              <button
                onClick={handleSignOut}
                className="w-[38px] h-[38px] rounded-full bg-paper border border-line grid place-items-center hover:bg-bg-warm transition-colors"
                title="Выйти"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-wood-dark text-paper text-[13px] font-semibold hover:bg-amber-deep transition-colors"
            >
              <LogIn size={14} />
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
