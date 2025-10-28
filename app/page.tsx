'use client'

import React, { useMemo, useState, useEffect } from "react";

/**
 * Aztec Contributors Board — MVP (single-file React component)
 * -----------------------------------------------------------
 * Modes:
 *  - People: classic directory (filter by role/name)
 *  - Awards by Role: group awardees by Town Hall (AMA) per selected role
 *
 * Updates in this revision
 *  - Fix: modal now opens from **both** People and Awards views
 *  - Default detail tab = **Posts**, so твиты сразу видны
 *  - Если список твитов пуст, рендерится **Twitter Timeline** (автомatically с фото/видео)
 *  - Awards карточки кликабельны, открывают модалку по твиттер-хэндлу
 *  - Исправлен опечатка класса `bg白/10` → `bg-white/10`
 *  - Защита от undefined для amaRoles
 *  - Добавлен runtime-тест для резолва по twitter
 */

// ----------------------
// Config
// ----------------------

const ENABLE_EXTERNAL = true; // fonts, X embeds, avatars

// ----------------------
// Types
// ----------------------

type RoleKey =
  | "Meme Lord"
  | "Bug Hunter"
  | "Community Builder"
  | "Content Crafter"
  | "Node Runner"
  | "Homestaker Sentinel"
  | "Content Chronicler"
  | "Proposer Commander"
  | "High Attester";

type GalleryItem = {
  src: string; // image url (square preferred)
  href?: string; // link to original
  caption?: string;
};

type Contributor = {
  id: string;
  displayName: string;
  discord?: string;
  twitter?: string; // without @
  roles: RoleKey[];
  bio?: string;
  tweets?: string[]; // tweet URLs
  gallery?: GalleryItem[];
};

type AmaAward = { role: RoleKey; twitter: string; displayName?: string };

type AmaSession = {
  id: number; // Town Hall #
  dateISO: string;
  tweetUrl?: string;
  awards: AmaAward[];
};

type DataShape = { roles: RoleKey[]; contributors: Contributor[]; amas: AmaSession[] };

// ----------------------
// Data (sample + your real AMA snippets)
// ----------------------

const DATA: DataShape = {
  roles: [
    "Meme Lord",
    "Bug Hunter",
    "Community Builder",
    "Content Crafter",
    "Node Runner",
    "Homestaker Sentinel",
    "Content Chronicler",
    "Proposer Commander",
    "High Attester",
  ],
  contributors: [
    {
      id: "c1",
      displayName: "Noma",
      discord: "Noma#7777",
      twitter: "MemeManLabs",
      roles: ["Meme Lord", "Content Crafter"],
      bio: "Creates viral Aztec memes and weekly highlights.",
      tweets: ["https://x.com/Interior/status/463440424141459456"],
      gallery: [
        { src: "https://picsum.photos/seed/az1/800/800", href: "https://x.com/MemeManLabs", caption: "Poster A" },
        { src: "https://picsum.photos/seed/az2/800/800", href: "https://x.com/MemeManLabs", caption: "Poster B" },
        { src: "https://picsum.photos/seed/az3/800/800", href: "https://x.com/MemeManLabs", caption: "Poster C" },
        { src: "https://picsum.photos/seed/az4/800/800", href: "https://x.com/MemeManLabs", caption: "Poster D" },
        { src: "https://picsum.photos/seed/az5/800/800", href: "https://x.com/MemeManLabs", caption: "Poster E" },
        { src: "https://picsum.photos/seed/az6/800/800", href: "https://x.com/MemeManLabs", caption: "Poster F" },
      ],
    },
    {
      id: "c2",
      displayName: "Kahari",
      discord: "kahari_dev",
      twitter: "kahari_dev",
      roles: ["Node Runner", "Bug Hunter"],
      bio: "Runs Aztec testnet nodes and reports bugs from AMAs.",
      tweets: [],
      gallery: [],
    },
    {
      id: "c3",
      displayName: "Maya",
      discord: "maya.builds",
      twitter: "aztec_maya",
      roles: ["Community Builder"],
      bio: "Keeps the Discord tidy and helpful, organizes AMA notes.",
      tweets: ["https://x.com/TwitterDev/status/560070183650213889"],
      gallery: [
        { src: "https://picsum.photos/seed/az7/800/800", href: "https://x.com/aztec_maya", caption: "Community Art 1" },
        { src: "https://picsum.photos/seed/az8/800/800", href: "https://x.com/aztec_maya", caption: "Community Art 2" },
      ],
    },
    // Added: XZNSEI (Meme Lord) with provided tweets
    {
      id: "c4",
      displayName: "XZNSEI",
      twitter: "XZNSEI",
      roles: ["Meme Lord"],
      bio: "Aztec Meme Lord winner.",
      tweets: [
        "https://x.com/XZNSEI/status/1981078095923655098",
        "https://x.com/XZNSEI/status/1979307501851152444",
        "https://x.com/XZNSEI/status/1978770579302875464",
      ],
      gallery: [],
    },
  ],
  amas: [
    {
      id: 10,
      dateISO: "2025-10-25",
      awards: [
        { role: "Homestaker Sentinel", twitter: "ment0san" },
        { role: "Meme Lord", twitter: "XZNSEI" },
        { role: "Content Chronicler", twitter: "ElTorito2602" },
        { role: "Proposer Commander", twitter: "viviann11656036" },
        { role: "High Attester", twitter: "BacotPatrik" },
      ],
    },
    {
      id: 9,
      dateISO: "2025-10-18",
      awards: [
        { role: "Homestaker Sentinel", twitter: "pashamuhran" },
        { role: "Meme Lord", twitter: "HELL4Ndr" },
        { role: "Content Chronicler", twitter: "Not_Boredd" },
        { role: "Proposer Commander", twitter: "l3asKT" },
        { role: "High Attester", twitter: "Jlvlartin" },
      ],
    },
    {
      id: 8,
      dateISO: "2025-10-11",
      awards: [
        { role: "Homestaker Sentinel", twitter: "OmololaOlo96415" },
        { role: "Meme Lord", twitter: "0x_nazo" },
        { role: "Content Chronicler", twitter: "ZhugeLyang" },
        { role: "Proposer Commander", twitter: "zoomerfren" },
        { role: "High Attester", twitter: "Sniperx432" },
      ],
    },
  ],
};

// ----------------------
// Helpers
// ----------------------

function avatarFromTwitter(handle?: string) {
  if (!handle) return undefined;
  if (!ENABLE_EXTERNAL) return undefined;
  return `https://unavatar.io/twitter/${handle}`;
}

function useTwitterWidgets() {
  useEffect(() => {
    if (!ENABLE_EXTERNAL) return;
    // inject widgets.js once
    if (!document.getElementById("twitter-widgets")) {
      const s = document.createElement("script");
      s.id = "twitter-widgets";
      s.async = true;
      s.src = "https://platform.twitter.com/widgets.js";
      document.body.appendChild(s);
    }
  }, []);
}

function loadTwitterEmbeds(target?: HTMLElement | null) {
  try {
    const tw = (window as any).twttr;
    if (tw && tw.widgets && typeof tw.widgets.load === 'function') {
      tw.widgets.load(target || undefined);
    }
  } catch {}
}

function whenTwitterReady(cb: (tw: any) => void) {
  let tries = 0;
  const tick = () => {
    const tw = (window as any).twttr;
    if (tw && tw.widgets && typeof tw.widgets.load === 'function') return cb(tw);
    if (tries++ < 60) setTimeout(tick, 100);
  };
  tick();
}

function filterContributors(list: Contributor[], role: RoleKey | "All", query: string): Contributor[] {
  const q = query.trim().toLowerCase();
  return list.filter((c) => {
    const matchesRole = role === "All" || c.roles.includes(role);
    const matchesQuery =
      q === "" ||
      c.displayName.toLowerCase().includes(q) ||
      (c.discord || "").toLowerCase().includes(q) ||
      (c.twitter || "").toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });
}

// AMA helpers
function getAllAmaRoles(amas: AmaSession[]): RoleKey[] {
  const set = new Set<RoleKey>();
  (amas || []).forEach((a) => a.awards.forEach((aw) => set.add(aw.role)));
  return Array.from(set);
}

function getAwardeesByRole(amas: AmaSession[], role: RoleKey, townHall: number | "All") {
  const sessions = (amas || [])
    .filter((a) => townHall === "All" || a.id === townHall)
    .sort((a, b) => b.id - a.id);
  return sessions.map((s) => ({ session: s, awardees: s.awards.filter((aw) => aw.role === role) }));
}

// ----------------------
// Runtime tests (console)
// ----------------------
(function runBasicTestsOnce() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__AZTEC_TESTS_DONE__) return;
  w.__AZTEC_TESTS_DONE__ = true;

  console.assert(
    filterContributors(DATA.contributors, "All", "").length === DATA.contributors.length,
    "[Test] filter: All + empty should return all"
  );
  const memeLords = filterContributors(DATA.contributors, "Meme Lord", "");
  console.assert(memeLords.some((c) => c.displayName === "Noma"), "[Test] filter: Meme Lord should include Noma");
  const byHandle = filterContributors(DATA.contributors, "All", "AZTEC_MAYA");
  console.assert(byHandle.length === 1 && byHandle[0].displayName === "Maya", "[Test] filter: twitter handle find Maya");

  const rolesFromAma = getAllAmaRoles(DATA.amas);
  console.assert(rolesFromAma.includes("Meme Lord") && rolesFromAma.includes("High Attester"), "[Test] AMA roles extraction");
  const r = getAwardeesByRole(DATA.amas, "Meme Lord", "All");
  console.assert(r.length >= 3 && r[0].awardees.length >= 1, "[Test] AMA awardees by role");

  const g = DATA.contributors.find((c) => c.id === "c1")?.gallery || [];
  console.assert(Array.isArray(g) && g.length >= 3, "[Test] gallery exists for c1");

  const x = DATA.contributors.find((c) => c.twitter === "XZNSEI");
  console.assert(x && x.tweets && x.tweets.length === 3, "[Test] XZNSEI should have 3 tweets");

  const resolveByTwitter = (h: string) => DATA.contributors.find((c) => (c.twitter || "").toLowerCase() === h.toLowerCase());
  console.assert(resolveByTwitter("xznsei")?.twitter === "XZNSEI", "[Test] resolve contributor by twitter handle");
})();

// ----------------------
// Small UI bits
// ----------------------

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="az-badge inline-flex items-center rounded-2xl border px-3 py-1 text-xs font-medium shadow-sm">
      {children}
    </span>
  );
}

function Card({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`az-card group cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:shadow-md`}>
      {children}
    </div>
  );
}

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`az-pill rounded-2xl border px-4 py-2 text-sm transition ${active ? "active" : "hover:bg-black/5"}`}
      style={{ borderColor: "var(--az-ink)" }}
    >
      {label}
    </button>
  );
}

function Seg({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-1 text-xs ${active ? "bg-white/10" : "hover:bg-white/5"}`}
      style={{ borderColor: "var(--az-border)" }}
    >
      {label}
    </button>
  );
}

function TwitterTimeline({ handle }: { handle: string }) {
  if (!ENABLE_EXTERNAL) return null;
  return (
    <a className="twitter-timeline" href={`https://twitter.com/${handle}?ref_src=twsrc%5Etfw`}>
      Tweets by @{handle}
    </a>
  );
}

function BlockquoteTweet({ url }: { url: string }) {
  if (!ENABLE_EXTERNAL) {
    try {
      const u = new URL(url);
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block rounded-2xl border p-4 hover:bg-black/5">
          <div className="text-xs opacity-70">{u.hostname}</div>
          <div className="mt-1 text-sm az-link break-all">{u.pathname + u.search}</div>
        </a>
      );
    } catch {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block rounded-2xl border p-4 az-link break-all">
          {url}
        </a>
      );
    }
  }
  const ref = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    whenTwitterReady(() => loadTwitterEmbeds(ref.current));
  }, []);
  return (
    <div ref={ref}>
      <blockquote className="twitter-tweet">
        <a href={url}>{url}</a>
      </blockquote>
    </div>
  );
}

// --- Reliable X embeds (tweet + timeline) ---
function TweetEmbed({ url }: { url: string }) {
  if (!ENABLE_EXTERNAL) return <BlockquoteTweet url={url} />;
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const idMatch = url.match(/status\/([0-9]+)/);
    const id = idMatch ? idMatch[1] : undefined;
    if (!id || !ref.current) return;
    let tries = 0;
    const wait = () => {
      const tw = (window as any).twttr;
      if (tw?.widgets?.createTweet) {
        ref.current!.innerHTML = "";
        tw.widgets.createTweet(id, ref.current, { theme: "dark", align: "center", dnt: true });
      } else if (tries++ < 60) setTimeout(wait, 100);
    };
    wait();
  }, [url]);
  return <div ref={ref} className="rounded-2xl overflow-hidden" />;
}

function TwitterTimelineEmbed({ handle }: { handle: string }) {
  if (!ENABLE_EXTERNAL) return null;
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    let tries = 0;
    const wait = () => {
      const tw = (window as any).twttr;
      if (tw?.widgets?.createTimeline) {
        ref.current!.innerHTML = "";
        tw.widgets.createTimeline(
          { sourceType: "profile", screenName: handle },
          ref.current,
          { theme: "dark", dnt: true, chrome: "noheader nofooter noborders transparent" }
        );
      } else if (tries++ < 60) setTimeout(wait, 100);
    };
    wait();
  }, [handle]);
  return <div ref={ref} className="rounded-2xl overflow-hidden" />;
}

// ----------------------
// Main component
// ----------------------

export default function AztecContributorsBoard() {
  // Fonts
  useEffect(() => {
    if (!ENABLE_EXTERNAL) return;
    if (!document.getElementById("geist-font-css")) {
      const link = document.createElement("link");
      link.id = "geist-font-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/geist@1.5.1/font/font.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("aztec-google-fonts")) {
      const gf = document.createElement("link");
      gf.id = "aztec-google-fonts";
      gf.rel = "stylesheet";
      gf.href = "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Martel:wght@300;400&family=Workbench&display=swap";
      document.head.appendChild(gf);
    }
  }, []);

  useTwitterWidgets();

  // find contributor by twitter
  const getContributorByTwitter = (handle?: string) =>
    handle ? DATA.contributors.find((c) => (c.twitter || "").toLowerCase() === handle.toLowerCase()) : undefined;

  const [mode, setMode] = useState<"People" | "Awards">("Awards");
  const [query, setQuery] = useState("");

  const amaRoles = useMemo<RoleKey[]>(() => {
    try {
      return getAllAmaRoles(DATA.amas) || [];
    } catch {
      return [] as RoleKey[];
    }
  }, []);

  const [role, setRole] = useState<RoleKey | "All">("All");
  useEffect(() => {
    if (amaRoles && amaRoles.includes("Meme Lord")) setRole("Meme Lord");
  }, [amaRoles]);

  const [townHall, setTownHall] = useState<number | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openTwitter, setOpenTwitter] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"Gallery" | "Posts">("Posts");
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  const rolesForPeople: (RoleKey | "All")[] = useMemo(() => ["All", ...DATA.roles], []);
  const filtered = useMemo(() => filterContributors(DATA.contributors, role, query), [role, query]);
  const openContributor = useMemo(() => filtered.find((c) => c.id === openId), [filtered, openId]);
  const openFromTwitter = useMemo(() => getContributorByTwitter(openTwitter || undefined), [openTwitter]);
  const openPerson: Contributor | undefined = openContributor || openFromTwitter || (openTwitter
    ? { id: `virtual-${openTwitter}`, displayName: openTwitter!, twitter: openTwitter!, roles: [], bio: "", tweets: [], gallery: [] }
    : undefined);

  // For awards view
  const awardsGroups = useMemo(() => {
    if (role === "All") return [] as { session: AmaSession; awardees: AmaAward[] }[];
    return getAwardeesByRole(DATA.amas, role as RoleKey, townHall);
  }, [role, townHall]);

  const allTownHalls = useMemo(() => {
    const ids = Array.from(new Set(DATA.amas.map((a) => a.id))).sort((a, b) => b - a);
    return ["All" as const, ...ids];
  }, []);

  const galleryItems = openPerson?.gallery || [];

  // Ensure embeds are upgraded when the modal opens or tab changes
  useEffect(() => {
    if (openPerson && detailTab === 'Posts' && ENABLE_EXTERNAL) {
      const t = setTimeout(() => loadTwitterEmbeds(document.body), 50);
      return () => clearTimeout(t);
    }
  }, [openPerson, detailTab]);

  return (
    <>
      {/* Brand theming to mirror aztec.network */}
      <style>{`
        :root {
          --az-bg: #0B0D12;
          --az-ink: rgba(245,245,245,0.95);
          --az-muted: rgba(235,235,235,0.65);
          --az-border: rgba(255,255,255,0.08);
          --az-border-strong: rgba(255,255,255,0.16);
          --az-chartreuse: #D4FF28;
          --az-orchid: #FF2DF4;
          --az-aqua: #2BFAE9;
          --az-card: rgba(12,14,18,0.6);
          --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
          --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          --font-h1: "Martel", Georgia, "Times New Roman", serif;
          --font-h3: "Workbench", var(--font-sans);
          --font-h4: "EB Garamond", Georgia, serif;
        }
        html, body { background: var(--az-bg); color: var(--az-ink); font-family: var(--font-sans); }
        .az-grid { background:
          radial-gradient(1000px 600px at 10% -20%, rgba(212,255,40,0.12), transparent 60%),
          radial-gradient(700px 500px at 95% 0%, rgba(43,250,233,0.10), transparent 60%),
          radial-gradient(800px 600px at 50% 120%, rgba(255,45,244,0.08), transparent 60%),
          linear-gradient(var(--az-bg), var(--az-bg)); }
        .az-grid:before { content: ''; position: fixed; inset: 0; pointer-events: none; background:
          repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 24px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 24px);
          mask-image: radial-gradient(ellipse at 50% 40%, black 55%, transparent 90%); }
        .az-card { background: var(--az-card); border: 1px solid var(--az-border); backdrop-filter: blur(10px); box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 40px rgba(0,0,0,0.45); }
        .az-pill { border-color: var(--az-border-strong); color: var(--az-muted); }
        .az-pill.active { color: #000; background: var(--az-chartreuse); box-shadow: 0 0 0 1px rgba(212,255,40,0.4), 0 0 40px rgba(212,255,40,0.2); }
        .az-pill:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.12); }
        .az-badge { border-color: var(--az-border); color: var(--az-muted); }
        .az-link { text-decoration: underline; text-underline-offset: 2px; }
        .az-input { background: rgba(255,255,255,0.04); border-color: var(--az-border); color: var(--az-ink); }
        h1.az { font-family: var(--font-h1); letter-spacing: -0.02em; color: var(--az-ink); }
        h2.az { font-family: var(--font-mono); letter-spacing: 0; color: var(--az-ink); }
        h3.az { font-family: var(--font-h3); color: var(--az-ink); }
        h4.az { font-family: var(--font-h4); color: var(--az-ink); }
        .az-gradient-text { background: linear-gradient(90deg, var(--az-chartreuse), var(--az-aqua) 50%, var(--az-orchid)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 16px rgba(212,255,40,0.18)); }
      `}</style>

      <div className="min-h-screen w-full az-grid">
        <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="az text-3xl font-light tracking-tight az-gradient-text">Aztec Contributors</h1>
              <p className="text-sm opacity-80 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
                Town Hall awards & people directory • Filter by role and AMA.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Seg label="Awards by Role" active={mode === "Awards"} onClick={() => setMode("Awards")} />
              <Seg label="People" active={mode === "People"} onClick={() => setMode("People")} />
            </div>
          </div>

          {mode === "People" ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, Discord, Twitter…"
                className="az-input h-10 w-64 rounded-xl border px-3 text-sm"
              />
              <div className="flex flex-wrap gap-2 ml-auto">
                {rolesForPeople.map((r) => (
                  <Pill key={r} label={r} active={r === role} onClick={() => setRole(r)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-2">
                {(amaRoles || []).map((r) => (
                  <Pill key={r} label={r} active={r === role} onClick={() => setRole(r)} />
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs opacity-70">Town Hall</span>
                <select
                  value={String(townHall)}
                  onChange={(e) => setTownHall(e.target.value === "All" ? "All" : Number(e.target.value))}
                  className="az-input h-9 rounded-lg border px-2 text-sm"
                >
                  {allTownHalls.map((id) => (
                    <option key={String(id)} value={String(id)}>
                      {id === "All" ? "All" : `#${id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        {mode === "People" ? (
          <main className="mx-auto max-w-6xl px-4 pb-20">
            {filtered.length === 0 ? (
              <p className="text-sm opacity-70">No contributors match your filters yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <Card
                    key={c.id}
                    onClick={() => {
                      setOpenId(c.id);
                      setOpenTwitter(null);
                      setDetailTab("Posts");
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={avatarFromTwitter(c.twitter) || "/avatar-placeholder.png"}
                        alt={c.displayName}
                        className="h-14 w-14 rounded-2xl object-cover border"
                        style={{ borderColor: "rgba(26,20,0,0.18)" }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold" style={{ fontFamily: "var(--font-h4)" }}>
                            {c.displayName}
                          </h3>
                          {c.twitter && (
                            <a
                              href={`https://x.com/${c.twitter}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs az-link opacity-70 hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              @{c.twitter}
                            </a>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.roles.map((r) => (
                            <Badge key={r}>{r}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {c.bio && <p className="mt-3 line-clamp-2 text-sm opacity-80">{c.bio}</p>}
                  </Card>
                ))}
              </div>
            )}
          </main>
        ) : (
          <main className="mx-auto max-w-6xl px-4 pb-24">
            {role === "All" ? (
              <p className="text-sm opacity-70">Pick a role above to see awardees per Town Hall.</p>
            ) : (
              <div className="space-y-8">
                {awardsGroups.map(({ session, awardees }) => (
                  <section key={session.id}>
                    <div className="mb-3 flex items-baseline gap-3">
                      <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-h3)" }}>
                        Town Hall #{session.id}
                      </h3>
                      <span className="text-xs opacity-70">
                        {new Date(session.dateISO).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {session.tweetUrl && (
                        <a href={session.tweetUrl} target="_blank" rel="noreferrer" className="text-xs az-link">
                          source
                        </a>
                      )}
                    </div>
                    {awardees.length === 0 ? (
                      <p className="text-sm opacity-60">No awardees for this role in TH #{session.id}.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {awardees.map((aw, i) => (
                          <Card key={`${session.id}-${aw.twitter}-${i}`} onClick={() => { setOpenTwitter(aw.twitter); setOpenId(null); setDetailTab("Posts"); }}>
                            <div className="flex items-center gap-4">
                              <img
                                src={avatarFromTwitter(aw.twitter) || "/avatar-placeholder.png"}
                                alt={aw.twitter}
                                className="h-14 w-14 rounded-2xl object-cover border"
                                style={{ borderColor: "rgba(26,20,0,0.18)" }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="truncate text-base font-semibold" style={{ fontFamily: "var(--font-h4)" }}>
                                    {aw.displayName || aw.twitter}
                                  </h4>
                                  <a
                                    href={`https://x.com/${aw.twitter}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs az-link opacity-70 hover:opacity-100"
                                  >
                                    @{aw.twitter}
                                  </a>
                                </div>
                                <div className="mt-1">
                                  <Badge>{role}</Badge>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </main>
        )}

        {/* Detail Drawer (opens for People or Awards) */}
        {openPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" onClick={() => { setOpenId(null); setOpenTwitter(null); }}>
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-6 shadow-xl az-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={avatarFromTwitter(openPerson.twitter) || "/avatar-placeholder.png"} alt={openPerson.displayName || openPerson.twitter || "person"} className="h-16 w-16 rounded-2xl object-cover border" />
                  <div>
                    <h2 className="az text-2xl font-light" style={{ fontFamily: "var(--font-h1)" }}>{openPerson.displayName || `@${openPerson.twitter}`}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm opacity-80">
                      {openPerson.discord && <span>Discord: {openPerson.discord}</span>}
                      {openPerson.twitter && (
                        <a href={`https://x.com/${openPerson.twitter}`} target="_blank" rel="noreferrer" className="underline">@{openPerson.twitter}</a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">{(openPerson.roles || []).map((r) => (<Badge key={r}>{r}</Badge>))}</div>
                  </div>
                </div>
                <button onClick={() => { setOpenId(null); setOpenTwitter(null); }} className="rounded-xl border px-3 py-1 text-sm hover:bg-black/5">Close</button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <Seg label="Gallery" active={detailTab === "Gallery"} onClick={() => setDetailTab("Gallery")} />
                <Seg label="Posts" active={detailTab === "Posts"} onClick={() => setDetailTab("Posts")} />
              </div>

              {/* POSTS (default) */}
              {detailTab === "Posts" && (
                <section className="mt-4">
                  {/* If tweets list present → specific embeds; else → timeline (auto, with photos/videos) */}
                  {openPerson.tweets && openPerson.tweets.length > 0 ? (
                    <div className="mt-3 space-y-6">
                      {openPerson.tweets.map((url) => (<TweetEmbed key={url} url={url} />))}
                    </div>
                  ) : openPerson.twitter ? (
                    <div className="mt-3"><TwitterTimelineEmbed handle={openPerson.twitter} /></div>
                  ) : (
                    <p className="text-sm opacity-70">No posts available.</p>
                  )}
                </section>
              )}

              {/* GALLERY */}
              {detailTab === "Gallery" && (
                <section className="mt-4">
                  {galleryItems.length === 0 ? (
                    <p className="text-sm opacity-70">No gallery items yet. Add images to the contributor's `gallery` array.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {galleryItems.map((it, idx) => (
                        <button key={idx} className="relative aspect-square overflow-hidden rounded-xl border group" onClick={() => setLightbox({ open: true, index: idx })} title={it.caption || ""}>
                          <img src={it.src} alt={it.caption || `image-${idx}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                          {it.caption && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[10px] text-white opacity-0 group-hover:opacity-100">{it.caption}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {lightbox.open && openPerson && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setLightbox({ open: false, index: 0 })}>
            <div className="relative max-h-[92vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
              <img src={galleryItems[lightbox.index]?.src} alt="full" className="max-h-[92vh] max-w-[92vw] object-contain rounded-xl" />
              <button className="absolute -left-14 top-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-sm bg-white/10" onClick={() => setLightbox({ open: true, index: (lightbox.index - 1 + galleryItems.length) % galleryItems.length })}>‹</button>
              <button className="absolute -right-14 top-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-sm bg-white/10" onClick={() => setLightbox({ open: true, index: (lightbox.index + 1) % galleryItems.length })}>›</button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border bg-white/10 px-3 py-1 text-xs">{lightbox.index + 1} / {galleryItems.length}</div>
              {galleryItems[lightbox.index]?.href && (
                <a href={galleryItems[lightbox.index]?.href} target="_blank" rel="noreferrer" className="absolute right-2 top-2 rounded-full border bg-white/10 px-3 py-1 text-xs">Open post</a>
              )}
              <button className="absolute right-2 bottom-2 rounded-full border bg-white/10 px-3 py-1 text-xs" onClick={() => setLightbox({ open: false, index: 0 })}>Close</button>
            </div>
          </div>
        )}

        <footer className="mx-auto max-w-6xl px-4 pb-16 text-center text-xs opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
          Built for Aztec AMA role tracking • MVP • Edit the DATA object to add more contributors and AMA winners.
        </footer>
      </div>
    </>
  );
}
