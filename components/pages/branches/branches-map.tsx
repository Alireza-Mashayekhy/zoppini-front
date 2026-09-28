'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Fix for default marker icons in Leaflet
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

interface locationsPropes {
  name: string;
  address: string;
  phone?: string | null;
  tel?: string | null;
  email?: string | null;
  coords: [number, number];
}

export default function BranchesMap({
  location,
}: {
  location: locationsPropes;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    fixLeafletIcons();
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse" />
    );
  }

  return (
    <MapContainer
      center={location?.coords}
      zoom={11}
      className="w-full h-full rounded-xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={location?.coords as L.LatLngExpression}>
        <Popup>
          <div className="text-sm max-w-[200px]">
            <h3 className="font-semibold text-base">{location.name}</h3>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              {location.address}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
