import Navbar from "./Navbar";
import { ReactNode } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { ShieldCheck, Heart } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/40 mt-12">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t("brand")} • {t("tagline")}</span>
          </div>
          <div className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" /> for India
          </div>
        </div>
      </footer>
    </div>
  );
}
