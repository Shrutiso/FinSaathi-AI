import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { LANG_NAMES } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, ShieldX, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScamResult {
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  explanation: string;
  flagged_keywords: string[];
  advice: string;
}

const SAMPLES: Record<string, string> = {
  en: "Dear customer, your SBI account will be BLOCKED today. Click http://bit.ly/sbi-kyc immediately to update KYC. Share OTP with our agent to verify.",
  hi: "प्रिय ग्राहक, आपका SBI खाता आज ब्लॉक हो जाएगा। KYC अपडेट के लिए तुरंत http://bit.ly/sbi-kyc पर क्लिक करें। एजेंट को OTP शेयर करें।",
  te: "ప్రియ కస్టమర్, మీ SBI ఖాతా ఈరోజు బ్లాక్ అవుతుంది. KYC అప్‌డేట్ కోసం వెంటనే http://bit.ly/sbi-kyc క్లిక్ చేయండి. ఏజెంట్‌తో OTP పంచుకోండి.",
  ta: "அன்பான வாடிக்கையாளர், உங்கள் SBI கணக்கு இன்று முடக்கப்படும். KYC க்காக உடனே http://bit.ly/sbi-kyc கிளிக் செய்யவும். OTP ஐ பகிரவும்.",
  pa: "ਪਿਆਰੇ ਗਾਹਕ, ਤੁਹਾਡਾ SBI ਖਾਤਾ ਅੱਜ ਬਲਾਕ ਹੋ ਜਾਵੇਗਾ। KYC ਲਈ ਤੁਰੰਤ http://bit.ly/sbi-kyc ਕਲਿੱਕ ਕਰੋ। OTP ਏਜੰਟ ਨਾਲ ਸਾਂਝਾ ਕਰੋ।",
};

function highlightKeywords(text: string, keywords: string[]) {
  if (!keywords?.length) return text;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).filter(Boolean);
  if (!escaped.length) return text;
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((p, i) =>
    keywords.some(k => k.toLowerCase() === p.toLowerCase())
      ? <mark key={i} className="bg-destructive/20 text-destructive font-semibold px-1 rounded">{p}</mark>
      : <span key={i}>{p}</span>
  );
}

export default function ScamDetector() {
  const { t, lang } = useLang();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);

  const analyze = async () => {
    if (!input.trim()) {
      toast.error("Please paste a message first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-scam", {
        body: { message: input, lang },
      });
      if (error) throw error;
      if ((data as any)?.error === "rate_limit") { toast.error(t("err_rate")); return; }
      if ((data as any)?.error === "credits") { toast.error(t("err_credits")); return; }
      if ((data as any)?.error) { toast.error(t("err_generic")); return; }
      setResult(data as ScamResult);
    } catch (e) {
      console.error(e);
      toast.error(t("err_generic"));
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => setInput(SAMPLES[lang] ?? SAMPLES.en);

  const levelStyles = {
    low: { bg: "bg-gradient-success", icon: ShieldCheck, text: "text-success", border: "border-success/30", soft: "bg-success/10" },
    medium: { bg: "bg-gradient-warning", icon: ShieldAlert, text: "text-warning", border: "border-warning/30", soft: "bg-warning/10" },
    high: { bg: "bg-gradient-danger", icon: ShieldX, text: "text-destructive", border: "border-destructive/30", soft: "bg-destructive/10" },
  };

  const style = result ? levelStyles[result.risk_level] : null;

  return (
    <div className="container py-10 md:py-14 max-w-4xl">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t("scam_title")}</h1>
        <p className="text-muted-foreground">{t("scam_sub")}</p>
      </div>

      <Card className="rounded-3xl border-border/50 shadow-card p-6 md:p-8 bg-gradient-card">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t("scam_placeholder")}
          rows={6}
          className="rounded-2xl text-base resize-none border-border/60 focus-visible:ring-primary"
          maxLength={5000}
        />
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button
            onClick={analyze}
            disabled={loading}
            size="lg"
            className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant gap-2 px-6"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("scam_analyzing")}</> : <><Sparkles className="h-4 w-4" />{t("scam_analyze")}</>}
          </Button>
          <Button onClick={loadSample} variant="outline" size="lg" className="rounded-full" disabled={loading}>
            {t("scam_demo")}
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{input.length}/5000</span>
        </div>
      </Card>

      {loading && (
        <Card className="mt-6 rounded-3xl p-8 border-border/50 shadow-card animate-pulse">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{t("scam_analyzing")}</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-3 rounded bg-muted w-3/4" />
            <div className="h-3 rounded bg-muted w-1/2" />
            <div className="h-3 rounded bg-muted w-2/3" />
          </div>
        </Card>
      )}

      {result && style && (
        <div className="mt-6 grid gap-5 animate-scale-in">
          <Card className={cn("rounded-3xl overflow-hidden border-2 shadow-elegant", style.border)}>
            <div className={cn("p-6 md:p-8", style.bg, "text-white")}>
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <style.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-sm font-medium opacity-90">{t("risk_level")}</div>
                    <div className="text-2xl font-extrabold">{t(`level_${result.risk_level}`)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium opacity-90">{t("risk_score")}</div>
                  <div className="text-4xl font-extrabold">{result.risk_score}<span className="text-xl opacity-70">/100</span></div>
                </div>
              </div>
              <Progress value={result.risk_score} className="mt-5 h-2 bg-white/20" />
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("explanation")}</div>
                <p className="text-base leading-relaxed">{result.explanation}</p>
              </div>

              {result.advice && (
                <div className={cn("rounded-2xl p-4 flex gap-3", style.soft)}>
                  <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", style.text)} />
                  <p className="text-sm leading-relaxed">{result.advice}</p>
                </div>
              )}

              {result.flagged_keywords?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("flagged")}</div>
                  <div className="flex flex-wrap gap-2">
                    {result.flagged_keywords.map((k, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Original Message</div>
                <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {highlightKeywords(input, result.flagged_keywords ?? [])}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!loading && !result && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t("empty_scam")}
        </div>
      )}
    </div>
  );
}
