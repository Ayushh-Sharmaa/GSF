"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Lightbulb, TrendingUp, MessageSquare, Shield, Percent, Eye, Heart, Search, ArrowRight, SlidersHorizontal, BarChart2, Rocket, DollarSign, Building2, BookOpen, Loader2, Zap } from "lucide-react";
import { computeValidationScore, getScoreColor } from "@/lib/utils/validationScore";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";

const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FFE4E6", text: "#9F1239" },
  { bg: "#CFFAFE", text: "#155E75" },
  { bg: "#FEE2E2", text: "#991B1B" },
  { bg: "#F0FDF4", text: "#14532D" },
  { bg: "#FEF9C3", text: "#713F12" },
];

const IDEA_STAGES = [
  "Ideation",
  "Idea Screening",
  "Market Research",
  "MVP",
  "Investment & Funding",
  "Company Launch",
  "Product-Market Fit",
];

const STAGE_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  "Ideation":           { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", icon: Lightbulb },
  "Idea Screening":     { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD", icon: Search },
  "Market Research":    { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD", icon: BarChart2 },
  "MVP":                { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7", icon: Rocket },
  "Investment & Funding":{ bg: "#FEF9C3", text: "#713F12", border: "#FDE68A", icon: DollarSign },
  "Company Launch":     { bg: "#EEF4F9", text: "#1E3A5F", border: "#AACDDC", icon: Building2 },
  "Product-Market Fit": { bg: "#F0FDF4", text: "#14532D", border: "#86EFAC", icon: TrendingUp },
};

const SECTORS = ["All sectors", "EdTech", "B2B SaaS", "HealthTech", "AgriTech", "Logistics", "FinTech", "HRTech", "CleanTech", "LegalTech", "SocialImpact", "Quick Commerce"];
const FUNDING_STAGES = ["All", "Pre-seed", "Seed"];

export default function VenturesPage() {
  const [search, setSearch] = useState("");
  const [ideaStageFilter, setIdeaStageFilter] = useState("All stages");
  const [sectorFilter, setSectorFilter] = useState("All sectors");
  const [fundingFilter, setFundingFilter] = useState("All");
  const [minScore, setMinScore] = useState(0);
  
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundingActionStatus, setFundingActionStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  useEffect(() => {
    async function fetchVentures() {
      try {
        const res = await fetch('/api/ventures/public');
        if (res.ok) {
          const data = await res.json();
          setVentures(data);
        } else {
          console.error("Failed to load ventures.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchVentures();
  }, []);

  const handleFundThis = async (ventureId: string) => {
    setFundingActionStatus(prev => ({ ...prev, [ventureId]: 'loading' }));
    try {
      const res = await fetch('/api/ventures/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, message: "Interested in discussing a potential investment." })
      });
      if (res.ok) {
        setFundingActionStatus(prev => ({ ...prev, [ventureId]: 'success' }));
        setVentures(prev => prev.map(v => v.id === ventureId ? { ...v, interested: (v.interested || 0) + 1 } : v));
        alert("Success! Your interest has been sent to the founder.");
      } else {
        if (res.status === 401) {
          alert("Please sign in to fund a venture.");
        } else {
          alert("Something went wrong. Please try again.");
        }
        setFundingActionStatus(prev => ({ ...prev, [ventureId]: 'error' }));
      }
    } catch (err) {
      console.error(err);
      setFundingActionStatus(prev => ({ ...prev, [ventureId]: 'error' }));
    }
  };

  const filtered = ventures.filter((v) => {
    const safeName = v.name || "";
    const safeFounder = v.founderName || v.founder || "";
    const safeTagline = v.tagline || "";
    const safeTags = Array.isArray(v.tags) ? v.tags : [];

    const matchSearch = search === "" ||
      safeName.toLowerCase().includes(search.toLowerCase()) ||
      safeFounder.toLowerCase().includes(search.toLowerCase()) ||
      safeTagline.toLowerCase().includes(search.toLowerCase()) ||
      safeTags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));

    const matchIdea = ideaStageFilter === "All stages" || v.stage === ideaStageFilter;
    const matchSector = sectorFilter === "All sectors" || v.sector === sectorFilter;
    const matchFunding = fundingFilter === "All" || v.fundingStage === fundingFilter;
    const score = v.validationScore ?? computeValidationScore(v);
    const matchScore = score >= minScore;

    return matchSearch && matchIdea && matchSector && matchFunding && matchScore;
  });

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-background">

        {/* Hero */}
        <section className="relative section-padding overflow-hidden bg-background">
          <div className="absolute inset-0 bg-dot-grid opacity-25" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <span className="badge badge-warm mb-6">
                <Lightbulb className="size-3.5" /> Student Venture Marketplace
              </span>
              <h1 className="text-5xl sm:text-6xl text-text-primary tracking-tight mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Fund the next big idea.{" "}
                <em className="not-italic text-gradient-primary">Before it's big.</em>
              </h1>
              <p className="text-xl text-text-secondary leading-relaxed mb-8 max-w-2xl">
                Students list startup ideas at any stage — from Ideation to Product-Market Fit.
                Venture creators fund them directly. GSF earns a transparent{" "}
                <strong className="text-text-primary">1–2% platform fee</strong> on closed deals.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface dark:bg-slate-900 border border-border shadow-soft-sm">
                  <Percent className="size-5 text-accent-primary" />
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Platform Fee</div>
                    <div className="text-text-primary font-semibold text-sm">1–2% on equity deals</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface dark:bg-slate-900 border border-border shadow-soft-sm">
                  <Shield className="size-5 text-accent-primary" />
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Deal Protection</div>
                    <div className="text-text-primary font-semibold text-sm">Escrow on all trades</div>
                  </div>
                </div>
                <Link href="/ventures/list" className="btn-primary">
                  <Lightbulb className="size-4" /> List Your Venture
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stage legend */}
        <section className="border-y border-border bg-surface dark:bg-slate-900 py-4">
          <div className="section-container">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-2">Idea Stages:</span>
              {IDEA_STAGES.map((stage) => {
                const s = STAGE_STYLES[stage];
                return (
                  <button
                    key={stage}
                    onClick={() => setIdeaStageFilter(ideaStageFilter === stage ? "All stages" : stage)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:opacity-80"
                    style={{
                      background: ideaStageFilter === stage ? s.text : s.bg,
                      color: ideaStageFilter === stage ? "#fff" : s.text,
                      borderColor: s.border,
                    }}
                  >
                    <s.icon className="size-3" /> {stage}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filters + Grid */}
        <section className="bg-canvas py-12 transition-colors">
          <div className="section-container">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                <input
                  id="venture-search"
                  type="text"
                  placeholder="Search by name, founder, or sector..."
                  className="input pl-10 bg-surface dark:bg-slate-900 border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select id="funding-filter" className="input sm:w-36 bg-surface dark:bg-slate-900 border-border" value={fundingFilter} onChange={(e) => setFundingFilter(e.target.value)}>
                {FUNDING_STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select id="sector-filter" className="input sm:w-44 bg-surface dark:bg-slate-900 border-border" value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Validation Score filter */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                <Zap className="size-3.5 text-amber-500" /> Min Score:
              </span>
              {[{ label: "Any", value: 0 }, { label: "4+", value: 4 }, { label: "6+", value: 6 }, { label: "8+", value: 8 }].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setMinScore(value)}
                  className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
                  style={minScore === value
                    ? { backgroundColor: "var(--accent-indigo)", borderColor: "var(--accent-indigo)", color: "white" }
                    : { backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Result count */}
            <p className="text-xs text-text-muted mb-4 flex items-center gap-2">
              <SlidersHorizontal className="size-3.5" />
              Showing <span className="font-semibold text-text-primary">{filtered.length}</span> ventures
              {(ideaStageFilter !== "All stages" || sectorFilter !== "All sectors" || fundingFilter !== "All" || search || minScore > 0) && (
                <button onClick={() => { setSearch(""); setIdeaStageFilter("All stages"); setSectorFilter("All sectors"); setFundingFilter("All"); setMinScore(0); }}
                  className="text-accent-primary hover:underline">Clear filters</button>
              )}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="🚀"
                title="No ventures found"
                description="Try adjusting your filters or search term. Or be the first to list your startup idea and attract investors from the GSF network."
                primaryAction={{ label: "List Your Venture", href: "/sign-up" }}
                secondaryAction={{ label: "Clear Filters", href: "/ventures" }}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filtered.map((v) => {
                  const stageStyle = STAGE_STYLES[v.stage] || STAGE_STYLES["Ideation"];
                  const colorIndex = v.id
                    ? Array.from(v.id as string).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length
                    : 0;
                  const avatarColor = AVATAR_COLORS[colorIndex];
                  const score = v.validationScore ?? computeValidationScore(v);
                  const sc = getScoreColor(score);
                  return (
                      <div key={v.id} className="card card-hover p-6 flex flex-col gap-4 bg-card">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-full border border-border flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: avatarColor.bg, color: avatarColor.text }}>
                            {v.initials || v.name?.charAt(0) || "V"}
                          </div>
                          <div>
                            <h2 className="font-bold text-text-primary text-base">{v.name}</h2>
                            <p className="text-xs text-text-muted">by {v.founderName || "Unknown Founder"}</p>
                            <span className={`badge mt-1 text-[10px] ${v.fundingStage === "Seed" ? "badge-blue" : "badge-warm"}`}>{v.fundingStage || "Pre-seed"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${v.daysLeft <= 7 ? 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 border border-red-100 dark:border-red-500/20' : 'bg-surface-2 border border-border'}`} style={{ color: v.daysLeft <= 7 ? undefined : "var(--text-muted)" }}>
                            {v.daysLeft || 30}d left
                          </span>
                          {/* Validation Score badge */}
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border"
                            style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                            title={`Validation Score: ${score}/10 — ${sc.label}`}
                          >
                            <Zap className="size-2.5" />
                            {score}/10 · {sc.label}
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap">Validation</span>
                        <div className="flex-1 h-1.5 rounded-full bg-surface-2 border border-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${score * 10}%`, backgroundColor: sc.text }}
                          />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: sc.text }}>{score}/10</span>
                      </div>

                      <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{v.tagline}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{v.description}</p>

                      {/* Idea Stage */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Idea Stage</span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ background: stageStyle.bg, color: stageStyle.text, borderColor: stageStyle.border }}
                        >
                          {stageStyle.icon && <stageStyle.icon className="size-3" />} {v.stage || "Ideation"}
                        </span>
                      </div>

                      {/* Equity metrics */}
                      <div className="grid grid-cols-3 gap-2.5">
                        {[{ label: "Seeking", value: v.fundingGoal || "N/A" }, { label: "Equity", value: v.equity || "N/A" }, { label: "Traction", value: v.traction || "N/A" }].map(({ label, value }) => (
                          <div key={label} className="bg-surface-2 border border-border rounded-xl p-3">
                            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</div>
                            <div className="text-sm font-semibold text-text-primary truncate" title={value}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(v.tags) && v.tags.map((tag: string) => (
                          <span key={tag} className="text-xs text-text-secondary bg-surface-2 border border-border px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1.5"><Eye className="size-3.5" />{v.views || 0}</span>
                          <span className="flex items-center gap-1.5"><Heart className="size-3.5 text-red-400" />{v.interested || 0} interested</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`mailto:founder@gsf.com?subject=Interested in ${v.name}`} className="btn-outline py-1.5 px-3 text-xs"><MessageSquare className="size-3.5" /> Chat</Link>
                          <button
                            onClick={() => handleFundThis(v.id)}
                            disabled={fundingActionStatus[v.id] === 'loading' || fundingActionStatus[v.id] === 'success'}
                            className="btn-primary py-1.5 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                            {fundingActionStatus[v.id] === 'loading' ? <Loader2 className="size-3.5 animate-spin" /> : <TrendingUp className="size-3.5" />}
                            {fundingActionStatus[v.id] === 'success' ? 'Funded' : 'Fund This'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section-container py-20 text-center">
          <div className="max-w-2xl mx-auto card p-10 bg-canvas border-border">
            <div className="size-14 rounded-2xl bg-surface-2 dark:bg-slate-800 border border-border flex items-center justify-center mx-auto mb-6 shadow-soft-sm">
              <Lightbulb className="size-7 text-accent-primary" />
            </div>
            <h2 className="text-3xl text-text-primary mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Have a startup idea?
            </h2>
            <p className="text-text-secondary mb-8">
              List your venture on GSF at any stage — from just an idea to a growing company. GSF only earns when you do.
            </p>
            <Link href="/sign-up" className="btn-primary mx-auto text-base px-8 py-3.5">
              <Lightbulb className="size-5" /> List Your Startup Idea
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}