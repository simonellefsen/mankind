"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAPTERS,
  SITES,
  SOURCES,
  SPECIES,
  formatYear,
  prettyYear,
  sampleClimate,
  type SpeciesId,
} from "@/data/story";

const GlobeCanvas = dynamic(
  () => import("./Globe").then((m) => m.GlobeCanvas),
  {
    ssr: false,
    loading: () => <div className="globe-fallback">Charting deep time…</div>,
  },
);

const SPECIES_ORDER: SpeciesId[] = [
  "sapiens",
  "neanderthal",
  "denisovan",
  "floresiensis",
  "luzonensis",
  "naledi",
  "erectus",
];

function allOn(): Record<SpeciesId, boolean> {
  return {
    sapiens: true,
    neanderthal: true,
    denisovan: true,
    floresiensis: true,
    luzonensis: true,
    naledi: true,
    erectus: true,
  };
}

function yearToSlider(year: number) {
  const max = 1_800_000;
  const y = Math.min(max, Math.max(0, year));
  const logMax = Math.log10(max + 1000);
  const logY = Math.log10(y + 1000);
  return 1 - (logY - Math.log10(1000)) / (logMax - Math.log10(1000));
}

function sliderToYear(t: number) {
  const max = 1_800_000;
  const logMax = Math.log10(max + 1000);
  const logY = Math.log10(1000) + (1 - t) * (logMax - Math.log10(1000));
  return Math.max(0, Math.pow(10, logY) - 1000);
}

function lerpYear(a: number, b: number, t: number) {
  const la = Math.log10(a + 1);
  const lb = Math.log10(b + 1);
  return Math.pow(10, la + (lb - la) * t) - 1;
}

function chapterFromYear(year: number) {
  let best = 0;
  let d = Infinity;
  CHAPTERS.forEach((c, i) => {
    const dd = Math.abs(Math.log10(c.year + 1) - Math.log10(year + 1));
    if (dd < d) {
      d = dd;
      best = i;
    }
  });
  return best;
}

export function Experience() {
  const [chapter, setChapter] = useState(2);
  const [year, setYear] = useState(CHAPTERS[2].year);
  const [playing, setPlaying] = useState(false);
  const [intro, setIntro] = useState(true);
  const [sources, setSources] = useState(false);
  const [enabled, setEnabled] = useState(allOn);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [legend, setLegend] = useState(false);

  const appRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const ignoreScroll = useRef(false);
  const playTimer = useRef<number | null>(null);

  const ch = CHAPTERS[chapter];
  const climate = sampleClimate(year);
  const site = SITES.find((s) => s.id === siteId) ?? null;

  const scrollToChapter = useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(`[data-chapter="${i}"]`);
    if (!card) return;
    ignoreScroll.current = true;
    card.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    window.setTimeout(() => {
      ignoreScroll.current = false;
    }, smooth ? 420 : 50);
  }, []);

  const goChapter = useCallback(
    (i: number, smooth = true) => {
      const next = (i + CHAPTERS.length) % CHAPTERS.length;
      setChapter(next);
      setYear(CHAPTERS[next].year);
      setSiteId(null);
      scrollToChapter(next, smooth);
    },
    [scrollToChapter],
  );

  const applyRailScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail || ignoreScroll.current) return;
    const h = rail.clientHeight || 1;
    const p = rail.scrollTop / h;
    const maxI = CHAPTERS.length - 1;
    const clamped = Math.min(maxI, Math.max(0, p));
    const i = Math.min(maxI - 1, Math.floor(clamped));
    const t = clamped - i;
    const y =
      i >= maxI
        ? CHAPTERS[maxI].year
        : lerpYear(CHAPTERS[i].year, CHAPTERS[i + 1].year, Math.min(1, Math.max(0, t)));
    const active = Math.min(maxI, Math.max(0, Math.round(clamped)));
    setYear(y);
    setChapter(active);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("start") === "1") setIntro(false);
    const raw = q.get("chapter");
    if (raw !== null) {
      const i = Number(raw);
      if (!Number.isNaN(i) && CHAPTERS[i]) {
        setChapter(i);
        setYear(CHAPTERS[i].year);
        requestAnimationFrame(() => scrollToChapter(i, false));
      }
    } else {
      requestAnimationFrame(() => scrollToChapter(2, false));
    }
  }, [scrollToChapter]);

  useEffect(() => {
    if (!playing || intro) return;
    playTimer.current = window.setInterval(() => {
      setChapter((c) => {
        const n = (c + 1) % CHAPTERS.length;
        setYear(CHAPTERS[n].year);
        scrollToChapter(n, true);
        return n;
      });
    }, 8000);
    return () => {
      if (playTimer.current) window.clearInterval(playTimer.current);
    };
  }, [playing, intro, scrollToChapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setPlaying(false);
        goChapter(chapter + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setPlaying(false);
        goChapter(chapter - 1);
      }
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "Escape") {
        setSources(false);
        setIntro(false);
        setLegend(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapter, goChapter]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const onWheel = (e: WheelEvent) => {
      if (intro || sources) return;
      const rail = railRef.current;
      if (!rail) return;
      const target = e.target as Node | null;
      if (target && rail.contains(target)) return;
      if (target && (target as HTMLElement).closest?.(".legend, .modal, .timeline")) return;
      e.preventDefault();
      setPlaying(false);
      rail.scrollTop += e.deltaY;
    };
    app.addEventListener("wheel", onWheel, { passive: false });
    return () => app.removeEventListener("wheel", onWheel);
  }, [intro, sources]);

  return (
    <div className="app" ref={appRef}>
      <div className="globe-wrap">
        <GlobeCanvas
          chapter={chapter}
          year={year}
          enabled={enabled}
          playing={playing && !intro}
          selectedSite={siteId}
          onSelectSite={(id) => setSiteId(id || null)}
        />
        <div className="vignette" />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">MANKIND</span>
          <span className="brand-sub">scroll to travel time</span>
        </div>
        <div className="year-block">
          <div className="year">{prettyYear(year)}</div>
          <div className="year-long">{formatYear(year)}</div>
        </div>
        <div className="top-actions">
          <button className="ghost species-btn" onClick={() => setLegend((v) => !v)} aria-expanded={legend}>
            Species
          </button>
          <button className="ghost" onClick={() => setSources(true)}>
            Sources
          </button>
        </div>
      </header>

      <aside className={`legend ${legend ? "open" : ""}`}>
        <div className="legend-head">
          <span>Living on this map</span>
          <button className="ghost tight" onClick={() => setLegend(false)}>
            Close
          </button>
        </div>
        {SPECIES_ORDER.map((id) => {
          const s = SPECIES[id];
          const alive = year <= s.from && year >= s.to;
          return (
            <button
              key={id}
              className={`sp ${enabled[id] ? "on" : ""} ${alive ? "alive" : "gone"}`}
              onClick={() => setEnabled((e) => ({ ...e, [id]: !e[id] }))}
            >
              <i style={{ background: s.color }} />
              <span>
                <b>{s.name}</b>
                <em>{s.latin}</em>
              </span>
              <small>
                {prettyYear(s.from)} – {s.to === 0 ? "now" : prettyYear(s.to)}
              </small>
            </button>
          );
        })}
        <p className="legend-note">{SPECIES[ch.species[0] ?? "sapiens"].blurb}</p>
      </aside>

      <section className="panel">
        <div
          className="story-rail"
          ref={railRef}
          onScroll={applyRailScroll}
          aria-label="Deep-time stories"
        >
          {CHAPTERS.map((card, i) => (
            <article
              key={card.id}
              className={`digest ${i === chapter ? "on" : ""}`}
              data-chapter={i}
            >
              <div className="kicker">
                <span>
                  {String(i + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
                </span>
                <span>{card.kicker}</span>
              </div>
              <p className="digest-year">{card.yearLabel}</p>
              <h1>{card.title}</h1>
              <p className="lede">{card.digest}</p>
              {card.facts && (
                <ul className="facts">
                  {card.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              {card.note && <p className="caveat">{card.note}</p>}
              {i === chapter && site && (
                <div className="site-card">
                  <b>{site.name}</b>
                  <span>{prettyYear(site.year)}</span>
                  <p>{site.text}</p>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="panel-nav">
          <button className="ghost" onClick={() => { setPlaying(false); goChapter(chapter - 1); }}>
            ← Prev
          </button>
          <button className="play" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button className="ghost" onClick={() => { setPlaying(false); goChapter(chapter + 1); }}>
            Next →
          </button>
        </div>
      </section>

      <div className="climate-chip">
        <span>{climate.label}</span>
        <span>ice {Math.round(climate.ice * 100)}%</span>
        <span>sea {Math.round(-120 * climate.shelf)} m</span>
      </div>

      <p className="scroll-hint">Scroll or swipe the stories · drag the globe</p>

      <footer className="timeline">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={yearToSlider(year)}
          aria-label="Deep-time slider"
          onChange={(e) => {
            const y = sliderToYear(Number(e.target.value));
            setYear(y);
            const i = chapterFromYear(y);
            setChapter(i);
            setPlaying(false);
            scrollToChapter(i, false);
          }}
        />
        <div className="ticks">
          {CHAPTERS.map((c, i) => {
            const t = yearToSlider(c.year);
            const overlap = CHAPTERS.some(
              (other, j) =>
                j < i && Math.abs(yearToSlider(other.year) - t) < 0.028,
            );
            return (
              <button
                key={c.id}
                className={`tick ${i === chapter ? "on" : ""} ${overlap ? "overlap" : ""}`}
                style={{ left: `${t * 100}%` }}
                onClick={() => {
                  setPlaying(false);
                  goChapter(i);
                }}
                title={`${c.yearLabel} — ${c.title}`}
              >
                <span>{prettyYear(c.year)}</span>
              </button>
            );
          })}
        </div>
      </footer>

      {intro && (
        <div className="intro">
          <div className="intro-inner">
            <p className="eyebrow">From Africa, into ice, across water</p>
            <h2>MANKIND</h2>
            <p>
              Scroll the last two million years. Short stories on a spinning Earth: how sapiens
              spread, how Neanderthals and Denisovans lived beside us, how ice redrew the map —
              and why “Adam and Eve” in genetics were never a couple.
            </p>
            <ul>
              <li>Scroll or swipe to move time. Drag the globe to look around.</li>
              <li>Gold is us. Ember is Neanderthal. Violet is Denisovan. Teal is Flores.</li>
              <li>Y-Adam ~270 ka. Mitochondrial Eve ~155 ka. Different centuries. Same continent.</li>
            </ul>
            <button
              className="play big"
              onClick={() => {
                setIntro(false);
                setPlaying(false);
                scrollToChapter(chapter, false);
              }}
            >
              Begin
            </button>
          </div>
        </div>
      )}

      {sources && (
        <div className="modal" onClick={() => setSources(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="legend-head">
              <span>What this is based on</span>
              <button className="ghost tight" onClick={() => setSources(false)}>
                Close
              </button>
            </div>
            <p className="lede short">
              Dates are rounded. Routes are models. Where 2024–2026 papers disagree, the globe shows
              the consensus and flags the dispute in the chapter note.
            </p>
            <ul className="src">
              {SOURCES.map((s) => (
                <li key={s.title}>
                  <b>{s.title}</b>
                  <span>{s.credit}</span>
                </li>
              ))}
            </ul>
            <p className="caveat">
              Earth texture derived from NASA Blue Marble (public domain). Ice sheets and −120 m
              shelves are original schematic overlays generated for this atlas, UV-mapped in Blender
              with the same TextureMapper used on the web globe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
