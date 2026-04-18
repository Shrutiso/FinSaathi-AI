import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, TrendingUp, Lightbulb, Wallet, Inbox } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface CategoryItem { name: string; amount: number; percentage: number; }
interface InsightsResult {
  total: number;
  categories: CategoryItem[];
  summary: string;
  tips: string[];
}

const DEMO = `Date, Description, Amount
2025-04-01, Swiggy - Lunch, 450
2025-04-02, Ola Cabs, 230
2025-04-03, Amazon Shopping, 1899
2025-04-04, Electricity Bill BESCOM, 2200
2025-04-05, Zomato Dinner, 680
2025-04-06, Netflix Subscription, 649
2025-04-07, BigBasket Groceries, 3200
2025-04-08, Uber, 180
2025-04-09, Swiggy Breakfast, 220
2025-04-10, Apollo Pharmacy, 540
2025-04-11, Petrol HP, 1500
2025-04-12, Myntra Clothing, 2400
2025-04-14, Spotify, 119
2025-04-15, Mobile Recharge Jio, 299
2025-04-17, Swiggy Lunch, 380
2025-04-18, Ola, 290
2025-04-20, BookMyShow Movie, 750
2025-04-22, BigBasket, 1850
2025-04-24, Zomato, 520
2025-04-26, DMart Groceries, 2700
2025-04-28, Internet Bill ACT, 999
2025-04-29, Swiggy, 410
2025-04-30, Cult Fitness, 1499`;

const COLORS = ["hsl(250 84% 60%)", "hsl(175 75% 45%)", "hsl(38 95% 55%)", "hsl(355 80% 58%)", "hsl(265 90% 70%)", "hsl(152 70% 42%)", "hsl(200 80% 55%)", "hsl(290 70% 60%)", "hsl(15 85% 60%)"];

export default function Insights() {
  const { t, lang } = useLang();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightsResult | null>(null);

  const analyze = async () => {
    if (!input.trim()) { toast.error("Please paste transactions or load demo data"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("financial-insights", {
        body: { transactions: input, lang },
      });
      if (error) throw error;
      if ((data as any)?.error === "rate_limit") { toast.error(t("err_rate")); return; }
      if ((data as any)?.error === "credits") { toast.error(t("err_credits")); return; }
      if ((data as any)?.error) { toast.error(t("err_generic")); return; }
      setResult(data as InsightsResult);
    } catch (e) {
      console.error(e); toast.error(t("err_generic"));
    } finally { setLoading(false); }
  };

  return (
    <div className="container py-10 md:py-14 max-w-6xl">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t("insights_title")}</h1>
        <p className="text-muted-foreground">{t("insights_sub")}</p>
      </div>

      <Card className="rounded-3xl border-border/50 shadow-card p-6 md:p-8 bg-gradient-card">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t("insights_placeholder")}
          rows={8}
          className="rounded-2xl text-sm font-mono resize-none border-border/60"
          maxLength={20000}
        />
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button onClick={analyze} disabled={loading} size="lg" className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant gap-2 px-6">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("scam_analyzing")}</> : <><Sparkles className="h-4 w-4" />{t("insights_analyze")}</>}
          </Button>
          <Button onClick={() => setInput(DEMO)} variant="outline" size="lg" className="rounded-full" disabled={loading}>
            {t("insights_demo")}
          </Button>
        </div>
      </Card>

      {!loading && !result && (
        <Card className="mt-8 rounded-3xl p-12 text-center border-dashed border-2 border-border/60 bg-transparent">
          <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("empty_insights")}</p>
        </Card>
      )}

      {loading && (
        <Card className="mt-8 rounded-3xl p-8 border-border/50 shadow-card animate-pulse">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{t("scam_analyzing")}</span>
          </div>
        </Card>
      )}

      {result && (
        <div className="mt-8 space-y-6 animate-scale-in">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-3xl p-6 bg-gradient-primary text-primary-foreground shadow-elegant md:col-span-1">
              <Wallet className="h-8 w-8 opacity-80 mb-3" />
              <div className="text-sm font-medium opacity-90">{t("insights_total")}</div>
              <div className="text-3xl font-extrabold mt-1">₹{result.total.toLocaleString("en-IN")}</div>
              <div className="text-xs opacity-80 mt-2">{result.categories.length} categories</div>
            </Card>

            <Card className="rounded-3xl p-6 border-border/50 shadow-card md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-bold">{t("insights_summary")}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl p-6 border-border/50 shadow-card">
              <h3 className="font-bold mb-4">{t("insights_categories")}</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={result.categories} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                      {result.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {result.categories.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto font-semibold text-muted-foreground">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-3xl p-6 border-border/50 shadow-card">
              <h3 className="font-bold mb-4">Spending by Category</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={result.categories} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {result.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="rounded-3xl p-6 md:p-8 border-border/50 shadow-card bg-gradient-card">
            <div className="flex items-center gap-2 mb-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-warning text-white">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">{t("insights_tips")}</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {result.tips.map((tip, i) => (
                <div key={i} className="rounded-2xl bg-muted/40 p-4 flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center shrink-0">{i + 1}</div>
                  <p className="text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
