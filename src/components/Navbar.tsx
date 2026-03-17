import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Flame, Search, Bell, User, LayoutDashboard, MessageCircle, Rss, LogOut, UserCircle2, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SearchDialog from "@/components/SearchDialog";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loggedIn = !!user;

  const guestLinks = [
    { label: "Início", to: "/" },
    { label: "Descobrir", to: "/discover" },
  ];

  const authLinks = [
    { label: "Feed", to: "/feed", icon: Rss },
    { label: "Mensagens", to: "/messages", icon: MessageCircle },
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  ];

  const navLinks = loggedIn ? authLinks : guestLinks;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    setDropdownOpen(false);
    navigate("/");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow animate-pulse-glow">
            <Flame className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-gradient">Flare</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === to ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50">
            <Search className="h-4 w-4" />
          </button>

          {loggedIn ? (
            <>
              <Link
                to="/messages"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
              >
                <Bell className="h-4 w-4" />
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="h-9 w-9 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center hover:scale-105 transition-transform overflow-hidden"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <User className="h-4 w-4 text-primary-foreground" />
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-11 w-48 rounded-xl bg-card border border-border/50 shadow-lg py-1 z-50">
                    <Link
                      to={`/profile/${user?.id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      Meu perfil
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Configurações
                    </Link>
                    <div className="border-t border-border/40 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_20px_hsl(340_80%_58%_/_0.5)]"
              >
                <User className="h-3.5 w-3.5" />
                Criar conta
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-muted-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-4">
          {navLinks.map(({ label, to }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">{label}</Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            {loggedIn ? (
              <>
                <Link to={`/profile/${user?.id}`} onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">Meu perfil</Link>
                <Link to="/settings" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">Configurações</Link>
                <button onClick={handleSignOut} className="text-sm text-left font-medium text-muted-foreground">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">Entrar</Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
