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
    const { message, lang = "en" } = await req.json();
    if (typeof message !== "string" || message.trim().length === 0 || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langName = LANG_NAMES[lang] ?? "English";

    const systemPrompt = `You are FinSaathi AI, an expert in Indian financial scam detection (UPI fraud, fake KYC, OTP scams, phishing SMS, lottery scams, fake bank messages). Analyze the message for scam indicators: urgency words, suspicious links, impersonation, requests for OTP/PIN/CVV, unusual UPI requests, grammar issues, mismatched sender names. Be culturally aware of Indian scam patterns. Respond in ${langName} for the explanation field, but keep flagged_keywords in the original language of the message.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this message:\n\n"""${message}"""` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_scam_analysis",
            description: "Report scam risk analysis",
            parameters: {
              type: "object",
              properties: {
                risk_score: { type: "number", description: "0-100 risk score" },
                risk_level: { type: "string", enum: ["low", "medium", "high"] },
                explanation: { type: "string", description: `Clear 2-3 sentence explanation in ${langName} of why this is or isn't a scam.` },
                flagged_keywords: { type: "array", items: { type: "string" }, description: "Suspicious words/phrases from the message verbatim" },
                advice: { type: "string", description: `Single actionable safety tip in ${langName}.` },
              },
              required: ["risk_score", "risk_level", "explanation", "flagged_keywords", "advice"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_scam_analysis" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "no_analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-scam error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
