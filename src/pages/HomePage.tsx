import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mastersApi } from "@/api/client";
import { SectionHead } from "@/components/shared/SectionHead";

export function HomePage() {
  const { data: portfolio = [] } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => mastersApi.getPortfolio(),
  });

  return (
    <div className="animate-page-in">
      {/* HERO */}
      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-10 mb-16 items-end">
        <div className="py-8">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-amber-deep font-bold mb-6 before:content-[''] before:w-6 before:h-px before:bg-amber-deep">
            Мебельная мастерская КР
          </div>
          <h1 className="font-display text-[clamp(48px,6vw,88px)] font-normal tracking-tight leading-[0.95] mb-6">
            От доски
            <br />
            до{" "}
            <em className="italic text-amber-deep font-medium">
              дома вашей мечты
            </em>
          </h1>
          <p className="text-lg text-ink-muted max-w-lg mb-8 leading-relaxed">
            Площадка, где встречаются заказчики, мастера-мебельщики и поставщики
            материалов Кыргызстана. Найдите идею, нарисуйте проект, получите
            предложение — всё в одном месте.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/constructor" className="btn-primary">
              Начать проект
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <Link to="/masters" className="btn-secondary">
              Найти мастера
            </Link>
          </div>
        </div>

        {/* Hero visual cards */}
        <div className="relative h-[460px] hidden lg:block">
          <div className="absolute top-0 right-10 w-[280px] -rotate-3 bg-paper rounded-2xl shadow-lift p-4 border border-line-soft">
            <div className="h-[140px] rounded-lg mb-3 relative overflow-hidden bg-gradient-to-br from-[#8b6f47] to-[#c8a571]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent 0, transparent 12px, rgba(0,0,0,0.08) 12px, rgba(0,0,0,0.08) 13px), repeating-linear-gradient(0deg, transparent 0, transparent 30px, rgba(255,255,255,0.05) 30px, rgba(255,255,255,0.05) 31px)",
                }}
              />
            </div>
            <div className="font-display text-[17px] font-semibold mb-1">
              Кухня «Алтын»
            </div>
            <div className="text-xs text-ink-muted">
              Усталык Studio • 14 дней
            </div>
          </div>
          <div className="absolute top-20 left-10 w-[240px] rotate-2 bg-wood-dark text-paper rounded-2xl shadow-lift p-4">
            <div className="h-[140px] rounded-lg mb-3 bg-gradient-to-br from-moss to-[#8a9a5b]" />
            <div className="font-display text-[17px] italic font-semibold text-amber-soft mb-1">
              ЛДСП Egger
            </div>
            <div className="text-xs text-paper/70">от 1 850 сом / лист</div>
          </div>
          <div className="absolute bottom-0 right-10 w-[260px] -rotate-1 bg-paper rounded-2xl shadow-lift p-4 border border-line-soft">
            <div className="h-[140px] rounded-lg mb-3 bg-gradient-to-br from-amber to-[#e89b4d]" />
            <div className="font-display text-[17px] font-semibold mb-1">
              Гардероб «Ала-Тоо»
            </div>
            <div className="text-xs text-ink-muted">Ремесло КГ • 4.9 ★</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-2xl overflow-hidden mb-20">
        {[
          { num: "248", label: "Проверенных мастеров", emphasis: true },
          { num: "62", label: "Поставщика материалов" },
          { num: "1.4K", label: "Завершённых проектов", emphasis: true },
          { num: "7", label: "Городов Кыргызстана" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-paper p-7 transition-colors hover:bg-bg-warm"
          >
            <div className="font-display text-4xl font-medium tracking-tight leading-none mb-1.5">
              {s.emphasis ? (
                <em className="italic text-amber-deep">{s.num}</em>
              ) : (
                s.num
              )}
            </div>
            <div className="text-[13px] text-ink-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* INSPIRATION */}
      <section className="mb-20">
        <SectionHead
          title="Идеи и"
          emphasis="вдохновение"
          description="Реальные работы мастеров. Понравилось — напишите автору одним кликом."
          action={
            <a
              href="#"
              className="text-sm font-semibold border-b border-current pb-0.5"
            >
              Смотреть всё →
            </a>
          }
        />
        <div className="columns-2 md:columns-3 lg:columns-4 gap-5">
          {portfolio.map((item) => (
            <Link
              key={item.id}
              to={`/masters/${item.authorId}`}
              className="break-inside-avoid mb-5 rounded-2xl overflow-hidden relative cursor-pointer transition-transform hover:-translate-y-1 bg-paper shadow-soft hover:shadow-lift group block"
            >
              <div
                className={`mi-tag absolute top-3 left-3 z-10 bg-paper px-2.5 py-1 rounded-full text-[11px] font-bold`}
              >
                {categoryLabel(item.category)}
              </div>
              <div
                className={`${item.imageStyle} w-full relative overflow-hidden`}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-wood-dark/85 p-4 flex flex-col justify-end text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs opacity-80 mb-1">
                  {item.authorHandle}
                </div>
                <div className="font-display text-base font-medium">
                  {item.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function categoryLabel(c: string): string {
  const map: Record<string, string> = {
    kitchen: "Кухня",
    living: "Гостиная",
    bedroom: "Спальня",
    office: "Офис",
    hallway: "Прихожая",
    kids: "Детская",
    wardrobe: "Шкаф-купе",
    other: "Декор",
  };
  return map[c] ?? c;
}
