"use client";
// app/experts/page.tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ALL_EXPERTS, nameToSlug } from "@/lib/data/experts";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  MessageSquare,
  Video,
  Search,
  Briefcase,
  Mail,
  Filter,
  X,
  ArrowUpDown,
  DollarSign,
} from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";

// ── Constants ────────────────────────────────────────────────────────────────

const DOMAINS = [
  "All",
  ...Array.from(new Set(ALL_EXPERTS.map((e) => e.domain))),
].sort();

const PRICE_MIN = 0;
const PRICE_MAX = 400;

type SortOption = "relevance" | "rating" | "price_asc" | "price_desc" | "availability";

const SORT_LABELS: Record<SortOption, string> = {
  relevance:    "Relevance",
  rating:       "Top Rated",
  price_asc:    "Price: Low → High",
  price_desc:   "Price: High → Low",
  availability: "Available First",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Read a URL param safely on the client */
function readParam(params: URLSearchParams, key: string, fallback: string) {
  return params.get(key) ?? fallback;
}

// ── Component ─────────────────────────────────────────────────────────────────

function ExpertsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── State — initialise from URL params ──────────────────────────────────
  const [search,    setSearch]    = useState(() => readParam(searchParams, "q",       ""));
  const [domain,    setDomain]    = useState(() => readParam(searchParams, "domain",  "All"));
  const [sort,      setSort]      = useState<SortOption>(() => (readParam(searchParams, "sort", "relevance") as SortOption));
  const [priceMin,  setPriceMin]  = useState(() => Number(readParam(searchParams, "minPrice", String(PRICE_MIN))));
  const [priceMax,  setPriceMax]  = useState(() => Number(readParam(searchParams, "maxPrice", String(PRICE_MAX))));
  const [availOnly, setAvailOnly] = useState(() => readParam(searchParams, "available", "") === "1");
  const [loading,   setLoading]   = useState(true);
  const [sortOpen,  setSortOpen]  = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // ── Sync state → URL params ──────────────────────────────────────────────
  const syncURL = useCallback(
    (overrides: Partial<{
      q: string; domain: string; sort: string;
      minPrice: number; maxPrice: number; available: string;
    }>) => {
      const params = new URLSearchParams();
      const q         = overrides.q         ?? search;
      const d         = overrides.domain    ?? domain;
      const s         = overrides.sort      ?? sort;
      const minP      = overrides.minPrice  ?? priceMin;
      const maxP      = overrides.maxPrice  ?? priceMax;
      const avail     = overrides.available ?? (availOnly ? "1" : "");

      if (q)              params.set("q",         q);
      if (d !== "All")    params.set("domain",    d);
      if (s !== "relevance") params.set("sort",   s);
      if (minP !== PRICE_MIN) params.set("minPrice", String(minP));
      if (maxP !== PRICE_MAX) params.set("maxPrice", String(maxP));
      if (avail === "1")  params.set("available", "1");

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [search, domain, sort, priceMin, priceMax, availOnly, router]
  );

  // ── Filter + Sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    const matched = ALL_EXPERTS.filter((e) => {
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q) ||
        e.company.toLowerCase().includes(q) ||
        e.bio.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q));

      const matchD    = domain === "All" || e.domain === domain;
      const matchA    = !availOnly || e.available;
      const matchP    = e.pricePerSession >= priceMin && e.pricePerSession <= priceMax;

      return matchQ && matchD && matchA && matchP;
    });

    // Sort
    switch (sort) {
      case "rating":
        return [...matched].sort((a, b) => b.rating - a.rating);
      case "price_asc":
        return [...matched].sort((a, b) => a.pricePerSession - b.pricePerSession);
      case "price_desc":
        return [...matched].sort((a, b) => b.pricePerSession - a.pricePerSession);
      case "availability":
        return [...matched].sort((a, b) => Number(b.available) - Number(a.available));
      default:
        return matched;
    }
  }, [search, domain, availOnly, priceMin, priceMax, sort]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSearch = (val: string) => {
    setSearch(val);
    syncURL({ q: val });
  };

  const handleDomain = (val: string) => {
    setDomain(val);
    syncURL({ domain: val });
  };

  const handleSort = (val: SortOption) => {
    setSort(val);
    setSortOpen(false);
    syncURL({ sort: val });
  };

  const handleAvail = () => {
    const next = !availOnly;
    setAvailOnly(next);
    syncURL({ available: next ? "1" : "" });
  };

  const handlePriceMin = (val: number) => {
    const v = Math.min(val, priceMax - 10);
    setPriceMin(v);
    syncURL({ minPrice: v });
  };

  const handlePriceMax = (val: number) => {
    const v = Math.max(val, priceMin + 10);
    setPriceMax(v);
    syncURL({ maxPrice: v });
  };

  const clearFilters = () => {
    setSearch("");
    setDomain("All");
    setAvailOnly(false);
    setSort("relevance");
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
    router.replace("?", { scroll: false });
  };

  const hasActiveFilters =
    search || domain !== "All" || availOnly ||
    sort !== "relevance" || priceMin !== PRICE_MIN || priceMax !== PRICE_MAX;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      <main className="pt-24 min-h-screen bg-background">

        {/* ── Hero ── */}
        <section className="relative section-padding bg-soft-pattern dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-25" />

          <div className="section-container relative z-10 text-center">
            <span className="badge badge-blue mb-6">
              <Star className="size-3.5" />
              {ALL_EXPERTS.length}+ world-class experts
            </span>

            <h1
              className="text-5xl sm:text-6xl text-text-primary tracking-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Learn from founders{" "}
              <em className="not-italic text-gradient-primary">
                who&apos;ve done it
              </em>
            </h1>

            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
              Book video calls and chat directly with operators, investors, and
              domain experts. Available directly to every GSF member.
            </p>

            {/* ── Search row ── */}
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                  <input
                    id="expert-search"
                    type="text"
                    placeholder="Search by name, company, or expertise..."
                    className="input pl-10 w-full bg-surface border-border"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      onClick={() => handleSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <Link
                  href="/sign-up"
                  className="btn-primary whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  Join to Book
                </Link>
              </div>

              {/* ── Domain chips ── */}
              <div className="flex flex-wrap gap-2 justify-center">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDomain(d)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap ${
                      domain === d
                        ? "bg-accent-indigo text-white shadow-md"
                        : "bg-surface dark:bg-slate-800 text-text-secondary border border-border hover:bg-surface-2 dark:hover:bg-slate-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* ── Availability + clear ── */}
              <div className="flex items-center justify-center gap-4 mt-2">
                <button
                  onClick={handleAvail}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                    availOnly
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-surface dark:bg-slate-900 text-text-secondary border-border"
                  }`}
                >
                  ● Available now only
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
                  >
                    <X className="size-3" /> Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Toolbar: results count + sort + price range ── */}
        <div className="section-container py-4 flex flex-wrap items-center gap-4 justify-between">

          {/* Count */}
          <p className="text-sm text-text-secondary">
            Showing{" "}
            <strong className="text-text-primary">{filtered.length}</strong>{" "}
            of{" "}
            <strong className="text-text-primary">{ALL_EXPERTS.length}</strong>{" "}
            experts
            {domain !== "All" && (
              <> in <strong className="text-accent-primary">{domain}</strong></>
            )}
          </p>

          <div className="flex items-center gap-3 flex-wrap">

            {/* ── Price range ── */}
            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
              <DollarSign className="size-3.5 text-text-muted shrink-0" />
              <div className="flex flex-col gap-1 min-w-[160px]">
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>${priceMin}</span>
                  <span>${priceMax === PRICE_MAX ? `${PRICE_MAX}+` : priceMax}</span>
                </div>
                {/* Min slider */}
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  value={priceMin}
                  onChange={(e) => handlePriceMin(Number(e.target.value))}
                  className="w-full h-1 accent-blue-500 cursor-pointer"
                  aria-label="Minimum price"
                />
                {/* Max slider */}
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  value={priceMax}
                  onChange={(e) => handlePriceMax(Number(e.target.value))}
                  className="w-full h-1 accent-blue-500 cursor-pointer"
                  aria-label="Maximum price"
                />
                <p className="text-[10px] text-text-muted text-center">Price per session (USD)</p>
              </div>
            </div>

            {/* ── Sort dropdown ── */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 text-sm bg-surface border border-border rounded-xl px-3 py-2 hover:bg-surface-2 transition-colors"
              >
                <ArrowUpDown className="size-3.5 text-text-muted" />
                <span className="text-text-secondary">{SORT_LABELS[sort]}</span>
              </button>

              {sortOpen && (
                <>
                  {/* Backdrop to close */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSort(key)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          sort === key
                            ? "text-accent-primary bg-surface-2"
                            : "text-text-secondary hover:bg-surface-2"
                        }`}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Filter className="size-3.5" />
              {filtered.length} results
            </div>
          </div>
        </div>

        {/* ── Experts Grid ── */}
        <section className="section-container pb-24 pt-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((expert) => (
                <Link
                  key={expert.name}
                  href={`/experts/${nameToSlug(expert.name)}`}
                  className="card p-6 card-hover flex flex-col gap-4 bg-surface border-border group"
                >
                  {/* ── Card header ── */}
                  <div className="flex items-start gap-3">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${expert.avatarBg}, ${expert.avatarBg}99)`,
                      }}
                    >
                      {expert.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-sm font-semibold text-text-primary leading-tight group-hover:text-accent-primary transition-colors">
                          {expert.name}
                        </h2>

                        {/* ── Available Today badge ── */}
                        {expert.available ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20 flex items-center gap-1">
                            <span className="inline-block size-1.5 rounded-full bg-green-500 animate-pulse" />
                            Available Today
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-surface-2 text-text-muted dark:bg-slate-700 dark:text-slate-400">
                            Away
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {expert.role}
                      </p>

                      <p className="text-xs font-semibold text-accent-dark dark:text-blue-300 truncate">
                        {expert.company}
                      </p>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="badge badge-blue text-[10px]">
                          {expert.domain}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {expert.experience} exp
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {expert.bio}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {expert.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-text-secondary bg-surface-2 border border-border px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Rating + price */}
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        {expert.rating}
                      </span>
                      <span>{expert.sessions} sessions</span>
                    </div>

                    {/* Price badge */}
                    <span className="font-semibold text-text-primary text-xs bg-surface-2 border border-border px-2 py-0.5 rounded-full">
                      ${expert.pricePerSession}/session
                    </span>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="btn-primary w-full justify-center text-xs py-2 flex items-center gap-1.5 pointer-events-none">
                      <Video className="size-3.5" />
                      View Profile
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`https://${expert.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-[#0077B5] transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 flex-1 justify-center"
                      >
                        <svg className="size-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>

                      <a
                        href={`mailto:${expert.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-dark transition-colors px-2 py-1 rounded-lg hover:bg-surface-2 flex-1 justify-center"
                      >
                        <Mail className="size-3.5 flex-shrink-0" />
                        Email
                      </a>

                      <span className="flex items-center gap-1.5 text-xs text-text-secondary px-2 py-1 rounded-lg flex-1 justify-center">
                        <MessageSquare className="size-3.5 flex-shrink-0" />
                        Chat
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🔍"
              title="No experts found"
              description="Try a different search term, domain filter, or adjust the price range. Our expert network spans fundraising, product, growth, legal, and impact."
              primaryAction={{ label: "Browse All Experts", href: "/experts" }}
              secondaryAction={{ label: "Join GSF", href: "/sign-up" }}
            />
          )}
        </section>

        {/* ── CTA ── */}
        <section className="bg-canvas border-t border-border py-20">
          <div className="section-container text-center max-w-2xl mx-auto">
            <div className="size-14 rounded-2xl bg-surface-2 dark:bg-slate-800 border border-border flex items-center justify-center mx-auto mb-6">
              <Briefcase className="size-7 text-accent-primary dark:text-blue-300" />
            </div>

            <h2
              className="text-3xl text-text-primary mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Are you an expert?
            </h2>

            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              Join the GSF expert network and give back to the next generation
              of founders. We match you with students who need your exact
              expertise.
            </p>

            <Link href="/sign-up" className="btn-primary px-8 py-3">
              Apply as an expert
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function ExpertsPage() {
  return (
    <Suspense fallback={
      <div className="pt-24 min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ExpertsContent />
    </Suspense>
  );
}