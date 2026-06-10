import { useState } from "react";
import { Search, SlidersHorizontal, Flame } from "lucide-react";
import Navbar from "@/components/Navbar";
import CreatorCard from "@/components/CreatorCard";
import CreatorCardSkeleton from "@/components/CreatorCardSkeleton";
import { useCreators } from "@/hooks/useCreators";

const categories = ["Todos", "Fitness", "Arte", "Gastronomia", "Música", "Educação", "Lifestyle", "Moda", "Gaming"];

const Discover = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"popular" | "preco" | "novo">("popular");

  const { data: creators = [], isLoading } = useCreators();

  const filtered = creators
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.handle ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === "Todos" || c.category === activeCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.subscribers - a.subscribers;
      if (sortBy === "preco") return a.price - b.price;
      if (sortBy === "novo") {
        const aDate = new Date((a as { created_at?: string }).created_at ?? 0).getTime();
        const bDate = new Date((b as { created_at?: string }).created_at ?? 0).getTime();
        return bDate - aDate;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero strip */}
      <div className="relative pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />
        <div className="container pt-10">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-primary">Descobrir</p>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Encontre seus criadores favoritos
          </h1>
          <p className="text-muted-foreground">
            {creators.length} criadores ativos na plataforma
          </p>
        </div>
      </div>

      <div className="container pb-24">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar criadores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            >
              <option value="popular">Mais populares</option>
              <option value="preco">Menor preço</option>
              <option value="novo">Mais recentes</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-gradient-primary text-primary-foreground shadow-glow scale-105"
                  : "border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CreatorCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((creator, i) => (
              <div
                key={creator.id}
                style={{ animationDelay: `${i * 0.07}s` }}
                className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
              >
                <CreatorCard creator={creator} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-display text-lg font-semibold text-foreground mb-1">Nenhum criador encontrado</p>
            <p className="text-sm text-muted-foreground">Tente ajustar a busca ou os filtros</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
