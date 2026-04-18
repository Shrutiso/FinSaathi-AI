import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { calculateTax, formatINR, Occupation } from "@/lib/tax";
import { User, Briefcase, Wallet, Calculator, Save, Info, TrendingDown, PiggyBank } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  occupation: Occupation;
  income: number;
}

const STORAGE_KEY = "finsaathi_profile";

const OCCUPATION_LABELS: Record<Occupation, string> = {
  student: "Student",
  private: "Private Sector",
  govt: "Government Sector",
  self_employed: "Self-Employed / Business",
  unemployed: "Unemployed",
};

export default function Profile() {
  const { t } = useLang();
  const [profile, setProfile] = useState<Profile>({
    name: "", email: "", occupation: "private", income: 0,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...JSON.parse(raw) });
    } catch {}
  }, []);

  const tax = useMemo(() => calculateTax(profile.income, profile.occupation), [profile.income, profile.occupation]);

  const save = () => {
    if (!profile.name.trim()) { toast.error("Please enter your name"); return; }
    if (profile.email && !/^\S+@\S+\.\S+$/.test(profile.email)) { toast.error("Invalid email"); return; }
    if (profile.income < 0) { toast.error("Income can't be negative"); return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaved(true);
      toast.success("Profile saved");
      setTimeout(() => setSaved(false), 2000);
    } catch { toast.error("Could not save profile"); }
  };

  const showTax = profile.income > 0 && profile.occupation !== "unemployed" && profile.occupation !== "student";
  const stipendOk = (profile.occupation === "student" || profile.occupation === "unemployed") && profile.income > 0;

  return (
    <div className="container py-10 md:py-14 max-w-5xl">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Personalize FinSaathi AI and estimate your annual income tax (FY 2025-26, New Regime).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Profile form */}
        <Card className="lg:col-span-2 rounded-3xl border-border/50 shadow-card p-6 md:p-7 bg-gradient-card animate-fade-in-up h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <User className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-lg">Personal Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Aarav Sharma"
                maxLength={80}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="aarav@example.com"
                maxLength={120}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Occupation
              </Label>
              <Select value={profile.occupation} onValueChange={(v: Occupation) => setProfile(p => ({ ...p, occupation: v }))}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {(Object.keys(OCCUPATION_LABELS) as Occupation[]).map(k => (
                    <SelectItem key={k} value={k} className="rounded-xl">{OCCUPATION_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="income" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" /> Annual Gross Income (₹)
              </Label>
              <Input
                id="income"
                type="number"
                inputMode="numeric"
                min={0}
                value={profile.income || ""}
                onChange={e => setProfile(p => ({ ...p, income: Math.max(0, Number(e.target.value) || 0) }))}
                placeholder="e.g. 1200000"
                className="mt-1.5 h-11 rounded-xl"
              />
              {profile.income > 0 && (
                <div className="text-xs text-muted-foreground mt-1.5">{formatINR(profile.income)} per year</div>
              )}
            </div>

            <Button
              onClick={save}
              size="lg"
              className="w-full rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant gap-2 mt-2"
            >
              <Save className="h-4 w-4" />
              {saved ? "Saved!" : "Save Profile"}
            </Button>
          </div>
        </Card>

        {/* Tax estimate */}
        <div className="lg:col-span-3 space-y-6">
          {!showTax && !stipendOk && (
            <Card className="rounded-3xl p-12 text-center border-dashed border-2 border-border/60 bg-transparent">
              <Calculator className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Enter your annual income to see your tax estimate</p>
            </Card>
          )}

          {(showTax || stipendOk) && (
            <Card className="rounded-3xl overflow-hidden border-border/50 shadow-elegant animate-scale-in">
              <div className="bg-gradient-primary text-primary-foreground p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Estimated Annual Tax</div>
                    <div className="text-xs opacity-75">FY 2025-26 • New Regime</div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-4xl md:text-5xl font-extrabold">{formatINR(tax.totalTax)}</div>
                    <div className="text-sm opacity-90 mt-1">{formatINR(tax.monthlyTax)} per month</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-90">Effective rate</div>
                    <div className="text-2xl font-bold">{tax.effectiveRate.toFixed(2)}%</div>
                  </div>
                </div>
                <Progress value={Math.min(tax.effectiveRate * 3, 100)} className="mt-5 h-2 bg-white/20" />
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Highlight cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-success/10 p-4">
                    <div className="flex items-center gap-2 text-success mb-1">
                      <PiggyBank className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Take-home / year</span>
                    </div>
                    <div className="text-xl font-extrabold">{formatINR(tax.takeHomeAnnual)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatINR(tax.takeHomeMonthly)} / month</div>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Taxable income</span>
                    </div>
                    <div className="text-xl font-extrabold">{formatINR(tax.taxableIncome)}</div>
                    {tax.standardDeduction > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">After {formatINR(tax.standardDeduction)} standard ded.</div>
                    )}
                  </div>
                </div>

                {/* Slab breakdown */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Slab-wise Breakdown</h3>
                  <div className="rounded-2xl border border-border/50 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="px-4 py-2.5 font-semibold">Slab</th>
                          <th className="px-4 py-2.5 font-semibold text-center">Rate</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tax.slabBreakup.map((s, i) => (
                          <tr key={i} className="border-t border-border/40">
                            <td className="px-4 py-2.5">
                              {formatINR(s.from)} – {s.to ? formatINR(s.to) : "above"}
                            </td>
                            <td className="px-4 py-2.5 text-center font-medium">{s.rate}%</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{formatINR(s.tax)}</td>
                          </tr>
                        ))}
                        {tax.rebate > 0 && (
                          <tr className="border-t border-border/40 bg-success/5">
                            <td className="px-4 py-2.5 text-success font-medium" colSpan={2}>Rebate u/s 87A (income ≤ ₹12L)</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-success">– {formatINR(tax.rebate)}</td>
                          </tr>
                        )}
                        {tax.surcharge > 0 && (
                          <tr className="border-t border-border/40">
                            <td className="px-4 py-2.5" colSpan={2}>Surcharge</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{formatINR(tax.surcharge)}</td>
                          </tr>
                        )}
                        <tr className="border-t border-border/40">
                          <td className="px-4 py-2.5" colSpan={2}>Health &amp; Education Cess (4%)</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{formatINR(tax.cess)}</td>
                        </tr>
                        <tr className="border-t-2 border-border bg-primary/5">
                          <td className="px-4 py-3 font-bold" colSpan={2}>Total Tax Payable</td>
                          <td className="px-4 py-3 text-right font-extrabold text-primary">{formatINR(tax.totalTax)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4 flex gap-3">
                  <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Estimate based on the Indian <b>New Tax Regime</b> for FY 2025-26 (AY 2026-27). Includes ₹75,000 standard deduction for salaried (private/govt), Section 87A rebate up to ₹12L taxable income, surcharge (10/15/25%) and 4% cess. This is a simplified calculator — for filing, please consult a CA.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
