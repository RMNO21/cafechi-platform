"use client";

import { useEffect, useRef } from "react";
import type { CafePublic } from "@/types";

interface CafeMapProps {
  cafes: CafePublic[];
  userLocation: { lat: number; lng: number } | null;
}

export default function CafeMap({ cafes, userLocation }: CafeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Default center: Tehran
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [35.6892, 51.389];

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = L.map(mapRef.current!).setView(defaultCenter, 12);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // User location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:#947151;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
          iconAnchor: [7, 7],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("موقعیت شما");
      }

      // Cafe markers
      cafes.forEach((cafe) => {
        const isOpen = cafe.isOpenNow;
        const cafeIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              background:${isOpen ? "#2E5A44" : "#666560"};
              color:white;
              padding:4px 8px;
              border-radius:8px;
              font-family:'Vazirmatn',sans-serif;
              font-size:11px;
              font-weight:700;
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.2);
              border:1.5px solid white;
              direction:rtl;
            ">${cafe.name}</div>`,
          iconAnchor: [40, 14],
        });

        L.marker([cafe.latitude, cafe.longitude], { icon: cafeIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'Vazirmatn',sans-serif;direction:rtl;text-align:right;padding:4px">
              <strong style="font-size:14px">${cafe.name}</strong><br/>
              <span style="color:#666;font-size:12px">${cafe.address}</span><br/>
              <a href="/c/${cafe.slug}" style="color:#947151;font-size:12px;font-weight:700">مشاهده منو</a>
            </div>
          `);
      });

      // Fit bounds to cafes
      if (cafes.length > 0) {
        const bounds = L.latLngBounds(cafes.map((c) => [c.latitude, c.longitude]));
        if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    })();

    return () => {
      leafletMapRef.current?.remove();
    };
  }, [cafes, userLocation]);

  return (
    <div
      ref={mapRef}
      style={{
        height: 500,
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-md)",
      }}
    />
  );
}
