const showcases = [
  {
    title: "Bring your documents",
    description: "Upload PDFs and text snippets to create a searchable knowledge vault with instant answers.",
    tag: "Docs",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Save web research",
    description: "Blend real-time web results with your personal files for richer conversations.",
    tag: "Web",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Recall every chat",
    description: "History stays synced in the cloud so you can jump back into any thread instantly.",
    tag: "History",
    image:
      "https://images.unsplash.com/photo-1526378787940-576a539ba69b?auto=format&fit=crop&w=900&q=80",
  },
];

const HomeShowcase = () => {
  return (
    <section className="bg-[#050507] text-white py-16">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Why Brainly</p>
            <h2 className="text-3xl font-bold mt-1">A calmer, more visual homepage</h2>
            <p className="text-zinc-400 max-w-xl mt-2">
              Thoughtful UI, ambient photography, and quick highlights make it easy to see what you can
              do with your assistant.
            </p>
          </div>
          <div className="text-zinc-300 text-sm">
            Drag, drop, and explore. Everything stays saved so you can return whenever inspiration strikes.
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {showcases.map((card) => (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 group"
            >
              <div className="h-44 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs border border-white/10">
                {card.tag}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="text-sm text-zinc-300">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeShowcase;
