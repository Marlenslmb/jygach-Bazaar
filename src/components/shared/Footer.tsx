export function Footer() {
  return (
    <footer className="mt-20 bg-wood-dark text-paper py-12 px-8 relative z-[2]">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="font-display text-[32px] tracking-tight mb-4">
            Jygach<span className="italic text-amber-soft">bazaar</span>
          </div>
          <p className="text-[13px] text-paper/60 max-w-sm leading-relaxed">
            Площадка для мастеров, заказчиков и поставщиков мебельной индустрии Кыргызстана.
            От доски до дома вашей мечты.
          </p>
        </div>

        {[
          {
            title: 'Платформа',
            links: ['Как это работает', 'Стать мастером', 'Стать поставщиком', 'Тарифы'],
          },
          {
            title: 'Помощь',
            links: ['Поддержка', 'Гарантии', 'Споры', 'FAQ'],
          },
          {
            title: 'Города',
            links: ['Бишкек', 'Ош', 'Каракол', 'Джалал-Абад'],
          },
        ].map((col) => (
          <div key={col.title}>
            <h5 className="text-[12px] uppercase tracking-[0.1em] text-amber-soft mb-4 font-semibold">
              {col.title}
            </h5>
            {col.links.map((link) => (
              <a
                key={link}
                href="#"
                className="block py-1 text-sm text-paper/80 hover:text-paper transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto mt-8 pt-6 border-t border-paper/10 flex justify-between text-[12px] text-paper/50 flex-wrap gap-2">
        <span>© 2026 Jygach Bazaar · Бета-версия</span>
        <span>Сделано в Кыргызстане 🇰🇬</span>
      </div>
    </footer>
  )
}
