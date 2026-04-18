import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BarChart3, GraduationCap, ArrowRight, Sparkles, Lock, Zap, Globe } from "lucide-react";

export default function Home() {
  const { t } = useLang();

  const features = [
    { icon: ShieldCheck, to: "/scam", title: t("feature_scam_t"), desc: t("feature_scam_d"), gradient: "bg-gradient-danger" },
    { icon: BarChart3, to: "/insights", title: t("feature_insights_t"), desc: t("feature_insights_d"), gradient: "bg-gradient-success" },
    { icon: GraduationCap, to: "/learn", title: t("feature_learn_t"), desc: t("feature_learn_d"), gradient: "bg-gradient-primary" },
  ];

  const trust = [
    { icon: Zap, label: "Instant" },
    { icon: Lock, label: "Private" },
    { icon: Globe, label: "5 Languages" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="container pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>{t("tagline")}</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="text-gradient">{t("hero_title")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {t("hero_sub")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant h-12 px-7 text-base">
              <Link to="/scam">
                {t("cta_try")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-7 text-base">
              <Link to="/learn">{t("cta_learn")}</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            {trust.map(x => (
              <div key={x.label} className="flex items-center gap-2">
                <x.icon className="h-4 w-4 text-accent" />
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Link
              key={f.to}
              to={f.to}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 p-7 shadow-card hover:shadow-elegant transition-smooth animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${f.gradient} shadow-soft mb-5 transition-bounce group-hover:scale-110`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-smooth">
                Open <ArrowRight className="h-4 w-4" />
              </div>
              <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-smooth" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
