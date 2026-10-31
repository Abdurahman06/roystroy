"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { ExternalLink, LocateFixed, Minus, Plus, RefreshCw } from "lucide-react";
import "leaflet/dist/leaflet.css";
import styles from "./CrimeaMap.module.css";

interface MapSpot {
  id: string;
  city: string;
  coords: { lat: number; lng: number };
}

interface Props {
  spots: MapSpot[];
  selectedSpotId: string;
  focusRequest: number;
  onSelect: (id: string) => void;
}

const CRIMEA_BOUNDS: Leaflet.LatLngBoundsExpression = [[44.32, 32.45], [46.23, 36.65]];
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function CrimeaMapCanvas({ spots, selectedSpotId, focusRequest, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef(new Map<string, Leaflet.Marker>());
  const latestRef = useRef({ selectedSpotId, focusRequest, onSelect });
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasTiles, setHasTiles] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(7);

  useEffect(() => {
    latestRef.current = { selectedSpotId, focusRequest, onSelect };
    const map = mapRef.current;
    const spot = spots.find(item => item.id === selectedSpotId);
    if (!map || !spot) return;
    markersRef.current.forEach((marker, id) => {
      const selected = id === selectedSpotId;
      const element = marker.getElement();
      element?.classList.toggle(styles.markerSelected, selected);
      element?.setAttribute("aria-pressed", String(selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
      marker.closeTooltip();
    });
    markersRef.current.get(selectedSpotId)?.openTooltip();
    if (focusRequest > 0) {
      const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.flyTo([spot.coords.lat, spot.coords.lng], 11, { animate, duration: .7 });
    }
  }, [selectedSpotId, focusRequest, onSelect, spots]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let started = false;
    let dispose = () => {};

    const initialize = async () => {
      if (started) return;
      started = true;
      setReady(false);
      setHasTiles(false);
      setFailed(false);
      try {
        const L = await import("leaflet");
        if (cancelled) return;
        const map = L.map(host, {
          zoomControl: false,
          scrollWheelZoom: false,
          minZoom: 6,
          maxZoom: 18,
          zoomSnap: .25,
          maxBounds: [[42.5, 29.5], [48, 39]],
          maxBoundsViscosity: .8,
        });
        mapRef.current = map;
        let timeout: number | undefined;
        let resize: ResizeObserver | undefined;
        let disposed = false;
        dispose = () => {
          if (disposed) return;
          disposed = true;
          window.clearTimeout(timeout);
          resize?.disconnect();
          map.remove();
          mapRef.current = null;
          markersRef.current.clear();
        };
        map.attributionControl.setPrefix(false);
        map.fitBounds(CRIMEA_BOUNDS, { padding: [24, 30], animate: false });

        const tiles = L.tileLayer(TILE_URL, {
          maxZoom: 19,
          keepBuffer: 1,
          updateWhenIdle: true,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        });
        let errors = 0;
        let loaded = 0;
        timeout = window.setTimeout(() => {
          if (!cancelled && loaded === 0) setFailed(true);
        }, 15000);
        tiles.on("loading", () => { errors = 0; loaded = 0; });
        tiles.on("tileload", () => {
          loaded += 1;
          window.clearTimeout(timeout);
          setHasTiles(true);
          setFailed(false);
        });
        tiles.on("tileerror", () => { errors += 1; });
        tiles.on("load", () => { setFailed(errors > 0); });
        tiles.addTo(map);

        spots.forEach(spot => {
          const marker = L.marker([spot.coords.lat, spot.coords.lng], {
            icon: L.divIcon({
              className: styles.marker,
              html: `<span class="${styles.markerDot}"></span>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
            title: spot.city,
            keyboard: true,
          }).addTo(map);
          const label = document.createElement("span");
          label.textContent = spot.city;
          marker.bindTooltip(label, { direction: "top", offset: [0, -15], className: styles.mapLabel });
          marker.on("click", () => latestRef.current.onSelect(spot.id));
          const element = marker.getElement();
          const selected = latestRef.current.selectedSpotId === spot.id;
          if (element) {
            element.dataset.locationId = spot.id;
            element.setAttribute("aria-label", `Выбрать: ${spot.city}`);
            element.setAttribute("aria-pressed", String(selected));
            element.setAttribute("aria-controls", "map-location-details");
            element.classList.toggle(styles.markerSelected, selected);
            element.addEventListener("keydown", event => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                latestRef.current.onSelect(spot.id);
              }
            });
          }
          marker.setZIndexOffset(selected ? 1000 : 0);
          markersRef.current.set(spot.id, marker);
        });

        const syncZoom = () => {
          setZoom(map.getZoom());
          host.dataset.zoom = String(map.getZoom());
        };
        map.on("zoomend", syncZoom);
        syncZoom();
        const selected = spots.find(spot => spot.id === latestRef.current.selectedSpotId);
        if (selected && latestRef.current.focusRequest > 0) {
          map.setView([selected.coords.lat, selected.coords.lng], 11, { animate: false });
        }
        markersRef.current.get(latestRef.current.selectedSpotId)?.openTooltip();
        resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resize.observe(host);
        setReady(true);
      } catch {
        dispose();
        if (!cancelled) setFailed(true);
      }
    };

    // Request only the tiles the visitor can see, not during the long intro.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        void initialize();
      }
    });
    observer.observe(host);
    return () => { cancelled = true; observer.disconnect(); dispose(); };
  }, [spots, attempt]);

  const selected = spots.find(spot => spot.id === selectedSpotId) ?? spots[0];
  const externalHref = `https://www.openstreetmap.org/?mlat=${selected.coords.lat}&mlon=${selected.coords.lng}#map=12/${selected.coords.lat}/${selected.coords.lng}`;
  const animated = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className={styles.mapFrame}>
      <div ref={hostRef} className={styles.map} role="region" aria-label="Карта Крыма: города и районы работы" />
      {!hasTiles && !failed && <div className={styles.mapStatus} role="status">Загрузка карты…</div>}
      <div className={styles.mapTools} role="group" aria-label="Управление картой">
        <button type="button" title="Приблизить" aria-label="Приблизить карту" disabled={!ready || zoom >= 18} onClick={() => mapRef.current?.zoomIn(1, { animate: animated() })}><Plus size={19} /></button>
        <button type="button" title="Отдалить" aria-label="Отдалить карту" disabled={!ready || zoom <= 6} onClick={() => mapRef.current?.zoomOut(1, { animate: animated() })}><Minus size={19} /></button>
        <button type="button" title="Показать весь Крым" aria-label="Показать весь Крым" disabled={!ready} onClick={() => mapRef.current?.fitBounds(CRIMEA_BOUNDS, { padding: [24, 30], animate: animated() })}><LocateFixed size={18} /></button>
        <a href={externalHref} target="_blank" rel="noopener noreferrer" title="Открыть в OpenStreetMap" aria-label="Открыть выбранный город в OpenStreetMap"><ExternalLink size={17} /></a>
      </div>
      {failed && (
        <div className={styles.mapError} role="status">
          <span>{hasTiles ? "Часть карты не загрузилась" : "Не удалось загрузить карту"}</span>
          <button type="button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={15} /> Повторить</button>
        </div>
      )}
    </div>
  );
}
