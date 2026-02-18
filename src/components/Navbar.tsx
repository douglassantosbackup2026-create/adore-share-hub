import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Flame, Search, Bell, User } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow animate-pulse-glow">
            <Flame className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-gradient">
            Flare
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Início", to: "/" },
            { label: "Descobrir", to: "/discover" },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50">
            <Search className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50">
            <Bell className="h-4 w-4" />
          </button>
          <Link
            to="/discover"
            className="flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_20px_hsl(340_80%_58%_/_0.5)]"
          >
            <User className="h-3.5 w-3.5" />
            Entrar
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-muted-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-4">
          <Link to="/" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">Início</Link>
          <Link to="/discover" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">Descobrir</Link>
          <Link
            to="/discover"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Entrar na plataforma
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
