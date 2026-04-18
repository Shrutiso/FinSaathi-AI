const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", pa: "Punjabi",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transactions, lang = "en" } = await req.json();
    if (typeof transactions !== "string" || transactions.trim().length === 0 || transactions.length > 20000) {
      return new Response(JSON.stringify({ error: "Invalid transactions" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langName = LANG_NAMES[lang] ?? "English";

    const systemPrompt = `You are FinSaathi AI, a financial advisor for Indian users. Categorize transactions and provide insights. Categories must be one of: Food, Transport, Shopping, Bills, Entertainment, Health, Groceries, Education, Other. All amounts are in INR (₹). Write summary and tips in ${langName}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these transactions:\n\n${transactions}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_insights",
            description: "Report financial insights",
            parameters: {
              type: "object",
              properties: {
                total: { type: "number", description: "Total spending in INR" },
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      amount: { type: "number" },
                      percentage: { type: "number" },
                    },
                    required: ["name", "amount", "percentage"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string", description: `2-3 sentence spending summary in ${langName}.` },
                tips: { type: "array", items: { type: "string" }, description: `3-5 actionable money-saving tips in ${langName}.` },
              },
              required: ["total", "categories", "summary", "tips"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (response.status === 429) return new Response(JSON.stringify({ error: "rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (response.status === 402) return new Response(JSON.stringify({ error: "credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "no_analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("financial-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
