import { Link, useLocation } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { LANGUAGES, Lang } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Menu, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/scam", label: t("nav_scam") },
    { to: "/insights", label: t("nav_insights") },
    { to: "/learn", label: t("nav_learn") },
    { to: "/profile", label: t("nav_profile") },
  ];

  const isActive = (to: string) => to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant transition-bounce group-hover:scale-110">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">{t("brand")}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-smooth",
                isActive(l.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {LANGUAGES.find(l => l.code === lang)?.native}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              {LANGUAGES.map(l => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className={cn("cursor-pointer rounded-xl", lang === l.code && "bg-primary/10 text-primary font-semibold")}
                >
                  <span>{l.native}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-2 pt-8">
                {links.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-base font-medium transition-smooth",
                      isActive(l.to) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
