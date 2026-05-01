"use client";

import { useEffect, useMemo, useState } from "react";
import { type Article } from "@/lib/supabase";

// Country code → approximate lat/lng center
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

type CountryGroup = {
  country: string;
  country_code: string;
  coords: [number, number];
  articles: Article[];
};

export default function MapClient({
  articles,
  locale,
}: {
  articles: Article[];
  locale: string;
}) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet")["MapContainer"];
    TileLayer: typeof import("react-leaflet")["TileLayer"];
    CircleMarker: typeof import("react-leaflet")["CircleMarker"];
    Popup: typeof import("react-leaflet")["Popup"];
  } | null>(null);

  const [selected, setSelected] = useState<CountryGroup | null>(null);
  const isZh = locale === "zh";

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl]) => {
      setMapComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        CircleMarker: rl.CircleMarker,
        Popup: rl.Popup,
      });
    });
  }, []);

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
    return [...map.values()];
  }, [articles]);

  if (!MapComponents) {
    return (
      <div className="h-[500px] bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
        {isZh ? "地圖載入中..." : "Loading map..."}
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 rounded-xl overflow-hidden border border-zinc-200" style={{ height: 500 }}>
        <MapContainer
          center={[20, 10]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {groups.map((g) => (
            <CircleMarker
              key={g.country_code}
              center={g.coords}
              radius={Math.min(6 + g.articles.length * 1.5, 20)}
              pathOptions={{
                color: "#18181b",
                fillColor: "#18181b",
                fillOpacity: 0.7,
                weight: 1,
              }}
              eventHandlers={{ click: () => setSelected(g) }}
            >
              <Popup>
                <div className="text-sm font-medium">{g.country}</div>
                <div className="text-xs text-zinc-500">
                  {g.articles.length} {isZh ? "件案例" : "cases"}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <aside className="lg:w-72 flex-shrink-0">
        {selected ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">{selected.country}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              {selected.articles.length} {isZh ? "件案例" : "cases"}
            </p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {selected.articles.slice(0, 10).map((a) => {
                const title = isZh ? (a.title_zh ?? a.title_original) : (a.title_en ?? a.title_original);
                return (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-zinc-700 hover:text-zinc-900 leading-snug"
                    >
                      {title}
                      <span className="block text-xs text-zinc-400 mt-0.5">{a.source}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <a
              href={`/${locale}/cases`}
              className="block text-center text-sm text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-lg py-2 transition-colors"
            >
              {isZh ? "查看全部案例" : "View all cases"}
            </a>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-6 text-center text-zinc-400 text-sm">
            {isZh ? "點擊地圖上的點查看各國案例" : "Click a dot on the map to see cases"}
          </div>
        )}

        <div className="mt-4 space-y-1">
          {groups
            .sort((a, b) => b.articles.length - a.articles.length)
            .slice(0, 8)
            .map((g) => (
              <button
                key={g.country_code}
                onClick={() => setSelected(g)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 text-sm transition-colors"
              >
                <span className="text-zinc-700">{g.country}</span>
                <span className="text-zinc-400">{g.articles.length}</span>
              </button>
            ))}
        </div>
      </aside>
    </div>
  );
}
