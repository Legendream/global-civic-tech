"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type Article } from "@/lib/supabase";
import { tagZh } from "@/lib/tags";

const COUNTRY_COORDS: Record<string, [number, number]> = {
  TW: [23.7, 121.0], US: [37.1, -95.7], GB: [55.4, -3.4],
  DE: [51.2, 10.5], FR: [46.2, 2.2], JP: [36.2, 138.3],
  KR: [36.5, 127.9], IN: [20.6, 78.9], BR: [-14.2, -51.9],
  AU: [-25.3, 133.8], CA: [56.1, -106.3], SG: [1.4, 103.8],
  KE: [-0.0, 37.9], NG: [9.1, 8.7], ZA: [-30.6, 22.9],
  NL: [52.1, 5.3], SE: [60.1, 18.6], FI: [61.9, 25.7],
  NO: [60.5, 8.5], DK: [56.3, 9.5], ES: [40.5, -3.7],
  IT: [41.9, 12.6], PL: [52.1, 19.1], UA: [48.4, 31.2],
  EE: [58.6, 25.0], MX: [23.6, -102.6], AR: [-38.4, -63.6],
  CL: [-35.7, -71.5], CO: [4.6, -74.1], PE: [-9.2, -75.0],
  GH: [7.9, -1.0], TZ: [-6.4, 34.9], UG: [1.4, 32.3],
  RW: [-1.9, 29.9], ID: [-0.8, 113.9], MY: [4.2, 108.0],
  PH: [12.9, 121.8], TH: [15.9, 100.9], VN: [14.1, 108.3],
};

const FLAG: Record<string, string> = {
  TW: "🇹🇼", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷",
  JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳", BR: "🇧🇷", AU: "🇦🇺",
  CA: "🇨🇦", SG: "🇸🇬", KE: "🇰🇪", NG: "🇳🇬", ZA: "🇿🇦",
  NL: "🇳🇱", SE: "🇸🇪", FI: "🇫🇮", NO: "🇳🇴", DK: "🇩🇰",
  ES: "🇪🇸", IT: "🇮🇹", PL: "🇵🇱", UA: "🇺🇦", EE: "🇪🇪",
  MX: "🇲🇽", AR: "🇦🇷", CL: "🇨🇱", CO: "🇨🇴", PE: "🇵🇪",
  GH: "🇬🇭", TZ: "🇹🇿", UG: "🇺🇬", RW: "🇷🇼", ID: "🇮🇩",
  MY: "🇲🇾", PH: "🇵🇭", TH: "🇹🇭", VN: "🇻🇳",
};

type CountryGroup = {
  country: string;
  country_code: string;
  coords: [number, number];
  articles: Article[];
};

export default function MapClient({ articles }: { articles: Article[] }) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);
  const LRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState<CountryGroup | null>(null);
  const [coord, setCoord] = useState<[number, number] | null>(null);

  const groups = useMemo<CountryGroup[]>(() => {
    const map = new Map<string, CountryGroup>();
    for (const a of articles) {
      if (!a.country_code || !COUNTRY_COORDS[a.country_code]) continue;
      if (!map.has(a.country_code)) {
        map.set(a.country_code, {
          country: a.country ?? a.country_code,
          country_code: a.country_code,
          coords: COUNTRY_COORDS[a.country_code],
          articles: [],
        });
      }
      map.get(a.country_code)!.articles.push(a);
    }
    return [...map.values()].sort((a, b) => b.articles.length - a.articles.length);
  }, [articles]);

  const totalCases = useMemo(
    () => groups.reduce((n, g) => n + g.articles.length, 0),
    [groups]
  );
  const maxCount = groups[0]?.articles.length || 1;
  const sourcesCount = useMemo(
    () => new Set(articles.map((a) => a.source).filter(Boolean)).size,
    [articles]
  );

  // Initialise raw Leaflet map (once)
  useEffect(() => {
    if (mapRef.current || !mapElRef.current) return;
    let destroyed = false;

    Promise.all([
      import("leaflet"),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      import("leaflet/dist/leaflet.css"),
    ]).then(([LModule]) => {
      if (destroyed || mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (LModule as any).default ?? LModule;
      LRef.current = L;

      const map = L.map(mapElRef.current, {
        scrollWheelZoom: false,
        worldCopyJump: true,
        minZoom: 2,
        maxBounds: [[-85, -200], [85, 200]],
        zoomControl: true,
      }).setView([25, 12], 2);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setTimeout(() => (map as { invalidateSize: () => void }).invalidateSize(), 60);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("mousemove", (e: any) => setCoord([e.latlng.lat, e.latlng.lng]));
      map.on("mouseout", () => setCoord(null));

      setMapReady(true);
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        layerRef.current = null;
        LRef.current = null;
      }
    };
  }, []);

  // Redraw markers when map is ready, groups change, or selection changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = LRef.current as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = layerRef.current as any;
    if (!L || !layer) return;

    layer.clearLayers();
    groups.forEach((g) => {
      const count = g.articles.length;
      const size = Math.round(22 + Math.min(count, 8) * 4);
      const sel = selected?.country_code === g.country_code;
      const icon = L.divIcon({
        className: "cmark-wrap",
        html: `<div class="cmark${sel ? " sel" : ""}">${count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const m = L.marker(g.coords, { icon, riseOnHover: true });
      m.on("click", () => {
        setSelected(g);
        (mapRef.current as { flyTo: (c: unknown, z: number, o: unknown) => void } | null)
          ?.flyTo(g.coords, 4, { duration: 0.7 });
      });
      m.addTo(layer);
    });
  }, [mapReady, groups, selected]);

  const stats = [
    { k: "國家 / 地區", v: groups.length },
    { k: "案例總數", v: totalCases },
    { k: "追蹤來源", v: sourcesCount },
  ];

  return (
    <>
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.k} className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
            <div className="text-2xl font-bold text-zinc-900 tabular-nums tech-mono">{s.v}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map console */}
        <div
          className="flex-1 map-frame min-h-[520px] rounded-xl overflow-hidden border border-zinc-200"
          style={{ height: 520 }}
        >
          <div ref={mapElRef} style={{ position: "absolute", inset: 0 }} />
          <span className="map-tick tl" />
          <span className="map-tick tr" />
          <span className="map-tick bl" />
          <span className="map-tick br" />
          <div className="map-readout">
            {coord
              ? `LAT ${coord[0].toFixed(2)}  LNG ${coord[1].toFixed(2)}`
              : `NODES ${groups.length}  ·  CASES ${totalCases}`}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 flex-shrink-0 space-y-4">
          {selected ? (
            /* Country detail */
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{FLAG[selected.country_code] ?? "🌐"}</span>
                    <h3 className="font-semibold text-zinc-900">{selected.country}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 tech-mono">{selected.articles.length} CASES</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="返回列表"
                  className="text-zinc-400 hover:text-zinc-700 text-lg leading-none cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  ×
                </button>
              </div>
              <ul className="divide-y divide-zinc-50 max-h-[360px] overflow-y-auto">
                {selected.articles.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 hover:bg-zinc-50 transition-colors"
                    >
                      <span className="block text-sm text-zinc-800 leading-snug">
                        {a.title_zh ?? a.title_original}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span className="text-indigo-600">{a.source}</span>
                        {a.tags?.[0] && (
                          <span className="tech-mono">#{tagZh(a.tags[0])}</span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* Ranking list */
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-700">案例排行</h3>
                <span className="text-xs text-zinc-400 tech-mono">RANK</span>
              </div>
              <div className="p-2">
                {groups.map((g, i) => (
                  <button
                    key={g.country_code}
                    onClick={() => {
                      setSelected(g);
                      (mapRef.current as { flyTo: (c: unknown, z: number, o: unknown) => void } | null)
                        ?.flyTo(g.coords, 4, { duration: 0.7 });
                    }}
                    className="w-full group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="w-5 text-xs text-zinc-300 tech-mono shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base leading-none shrink-0">
                      {FLAG[g.country_code] ?? "🌐"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm text-zinc-700 truncate">{g.country}</span>
                        <span className="text-xs text-zinc-400 tech-mono shrink-0">{g.articles.length}</span>
                      </span>
                      <span className="block mt-1 h-1 rounded-full bg-zinc-100 overflow-hidden">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(g.articles.length / maxCount) * 100}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-zinc-400 leading-relaxed px-1">
            節點大小對應案例數量。國際／跨國專案未標記於特定國家，故不顯示在地圖上。
          </p>
        </aside>
      </div>
    </>
  );
}
