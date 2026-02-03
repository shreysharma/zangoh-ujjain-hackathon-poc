"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  imageUrl?: string;
  alt?: string;
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number;
}

const redMarkerIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z' fill='%23E11D48'/%3E%3Ccircle cx='12' cy='10' r='3' fill='white'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export function MapView({
  imageUrl,
  alt = "Map location",
  latitude,
  longitude,
  zoom = 14,
}: MapViewProps) {
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";
  const center = useMemo(() => {
    return hasCoordinates ? ([latitude, longitude] as [number, number]) : null;
  }, [hasCoordinates, latitude, longitude]);

  return (
    <div className="bg-white content-stretch flex flex-col items-start overflow-hidden relative rounded-[16px] shrink-0 w-full h-[320px] p-4">
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="size-full rounded-[12px] object-cover" />
      ) : hasCoordinates && center ? (
        <>
          <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={false}
            className="size-full rounded-[12px]"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={redMarkerIcon} />
          </MapContainer>
          <a
            href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-5 right-6 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#3840EB]"
          >
            View map
          </a>
        </>
      ) : (
        <div className="size-full rounded-[12px] border border-dashed border-[#E2E2E2] flex items-center justify-center text-sm text-[#747474]">
          No location available
        </div>
      )}
    </div>
  );
}
