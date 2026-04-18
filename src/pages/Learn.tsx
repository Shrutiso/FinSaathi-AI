import { useState, useRef, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, Send, Sparkles, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string; }

export default function Learn() {
  const { t, lang } = useLang();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, lang }),
      });

      if (resp.status === 429) { toast.error(t("err_rate")); setLoading(false); return; }
      if (resp.status === 402) { toast.error(t("err_credits")); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error(t("err_generic")); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let createdAssistant = false;
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              if (!createdAssistant) {
                createdAssistant = true;
                setMessages(prev => [...prev, { role: "assistant", content: assistantSoFar }]);
              } else {
                setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e); toast.error(t("err_generic"));
    } finally {
      setLoading(false);
    }
  };

  const examples = [t("ex1"), t("ex2"), t("ex3"), t("ex4")];

  return (
    <div className="container py-10 md:py-14 max-w-4xl">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t("learn_title")}</h1>
        <p className="text-muted-foreground">{t("learn_sub")}</p>
      </div>

      <Card className="rounded-3xl border-border/50 shadow-card overflow-hidden flex flex-col h-[70vh] bg-gradient-card">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-primary shadow-elegant mb-5">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">{t("empty_chat")}</p>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("learn_examples")}</div>
              <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => send(ex)}
                    className="px-4 py-2 rounded-full bg-card border border-border/60 hover:border-primary hover:bg-primary/5 transition-smooth text-sm font-medium"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-soft">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "rounded-3xl px-4 py-3 max-w-[80%] shadow-soft",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-md"
                  : "bg-card border border-border/50 rounded-tl-md"
              )}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 dark:prose-invert">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                )}
              </div>
              {m.role === "user" && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 justify-start">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-3xl rounded-tl-md px-4 py-3 bg-card border border-border/50 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{t("scam_analyzing")}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-sm">
          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t("learn_placeholder")}
              className="rounded-full h-12 px-5 text-base border-border/60"
              disabled={loading}
              maxLength={1000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="rounded-full h-12 w-12 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
