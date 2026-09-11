"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
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
  const min = 0;
  const max = 1_800_000;
  const y = Math.min(max, Math.max(min, year));
  // more resolution in the last 100 ka
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

export function Experience() {
  const [chapter, setChapter] = useState(2);
  const [year, setYear] = useState(CHAPTERS[2].year);
  const [playing, setPlaying] = useState(false);
  const [intro, setIntro] = useState(true);
  const [sources, setSources] = useState(false);
  const [enabled, setEnabled] = useState(allOn);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [legend, setLegend] = useState(false);

  const ch = CHAPTERS[chapter];
  const climate = sampleClimate(year);
  const site = SITES.find((s) => s.id === siteId) ?? null;

  const goChapter = useCallback((i: number) => {
    const next = (i + CHAPTERS.length) % CHAPTERS.length;
    setChapter(next);
    setYear(CHAPTERS[next].year);
    setSiteId(null);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("start") === "1") setIntro(false);
    const raw = q.get("chapter");
    if (raw !== null) {
      const ch = Number(raw);
      if (!Number.isNaN(ch) && CHAPTERS[ch]) {
        setChapter(ch);
        setYear(CHAPTERS[ch].year);
      }
    }
  }, []);

  useEffect(() => {
    if (!playing || intro) return;
    const id = window.setInterval(() => {
      setChapter((c) => {
        const n = (c + 1) % CHAPTERS.length;
        setYear(CHAPTERS[n].year);
        return n;
      });
    }, 9000);
    return () => window.clearInterval(id);
  }, [playing, intro]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goChapter(chapter + 1);
      if (e.key === "ArrowLeft") goChapter(chapter - 1);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "Escape") {
        setSources(false);
        setIntro(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapter, goChapter]);

  return (
    <div className="app">
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
          <span className="brand-sub">a deep-time atlas</span>
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
              <small>{prettyYear(s.from)} – {s.to === 0 ? "now" : prettyYear(s.to)}</small>
            </button>
          );
        })}
        <p className="legend-note">{SPECIES[ch.species[0] ?? "sapiens"].blurb}</p>
      </aside>

      <section className="panel">
        <div className="kicker">
          <span>{String(chapter + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}</span>
          <span>{ch.kicker}</span>
        </div>
        <h1>{ch.title}</h1>
        <p className="lede">{ch.body}</p>
        {ch.note && <p className="caveat">{ch.note}</p>}
        {site && (
          <div className="site-card">
            <b>{site.name}</b>
            <span>{prettyYear(site.year)}</span>
            <p>{site.text}</p>
          </div>
        )}
        <figure className="chapter-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ch.image} alt="" />
        </figure>
        <div className="panel-nav">
          <button className="ghost" onClick={() => goChapter(chapter - 1)}>
            ← Prev
          </button>
          <button className="play" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play chapters"}
          </button>
          <button className="ghost" onClick={() => goChapter(chapter + 1)}>
            Next →
          </button>
        </div>
      </section>

      <div className="climate-chip">
        <span>{climate.label}</span>
        <span>ice {Math.round(climate.ice * 100)}%</span>
        <span>sea {Math.round(-120 * climate.shelf)} m</span>
      </div>

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
            let best = 0;
            let d = Infinity;
            CHAPTERS.forEach((c, i) => {
              const dd = Math.abs(Math.log10(c.year + 1) - Math.log10(y + 1));
              if (dd < d) {
                d = dd;
                best = i;
              }
            });
            setChapter(best);
            setPlaying(false);
          }}
        />
        <div className="ticks">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              className={i === chapter ? "tick on" : "tick"}
              style={{ left: `${yearToSlider(c.year) * 100}%` }}
              onClick={() => goChapter(i)}
              title={c.title}
            >
              <span>{prettyYear(c.year)}</span>
            </button>
          ))}
        </div>
      </footer>

      {intro && (
        <div className="intro">
          <div className="intro-inner">
            <p className="eyebrow">From Africa, into ice, across water</p>
            <h2>MANKIND</h2>
            <p>
              A globe of the last two million years: how Homo sapiens spread, how Neanderthals,
              Denisovans, hobbits and others lived beside us, and how ice and drowned land rewrote
              the map. Built from research through 2026.
            </p>
            <ul>
              <li>Drag the world. Scrub time. Open a chapter.</li>
              <li>Gold is us. Ember is Neanderthal. Violet is Denisovan. Teal is Flores.</li>
              <li>Ice and shelves are schematic, not a GIS reconstruction.</li>
            </ul>
            <button
              className="play big"
              onClick={() => {
                setIntro(false);
                setPlaying(true);
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
