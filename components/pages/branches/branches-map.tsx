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

const locations = [
  {
    id: 'tehran',
    name: 'دفتر مرکزی زوپینی (تهران)',
    address:
      'تهران، خیابان فردوسی، خیابان منوچهری، خیابان ارباب جمشید، پلاک ۱۷، واحد ۲۹',
    coords: [35.69776219399375, 51.42114981432789],
  },
  {
    id: 'kerman',
    name: 'شعبه کرمان زوپینی',
    address: 'کرمان، خیابان هزار و یک شب، نبش کوچه ۶',
    coords: [30.286455507638387, 57.03517457530013],
  },
];

export default function BranchesMap({ location }: { location: number }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
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
      center={locations?.[location]?.coords}
      zoom={11}
      className="w-full h-full rounded-xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        key={locations[location].id}
        position={locations[location].coords as L.LatLngExpression}
      >
        <Popup>
          <div className="text-sm max-w-[200px]">
            <h3 className="font-semibold text-base">
              {locations[location].name}
            </h3>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              {locations[location].address}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
