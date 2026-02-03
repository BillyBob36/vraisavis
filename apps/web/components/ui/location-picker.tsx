'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { MapPin, Search } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
}

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

export function LocationPicker({
  onLocationSelect,
  initialAddress = '',
  initialLatitude = 48.8566,
  initialLongitude = 2.3522,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    address: initialAddress,
    latitude: initialLatitude,
    longitude: initialLongitude,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const loadLeaflet = async () => {
      if (!window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
        });
      }

      if (mapInstanceRef.current) return;

      const L = window.L;
      const map = L.map(mapRef.current!).setView([initialLatitude, initialLongitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([initialLatitude, initialLongitude], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        await reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', async (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        await reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLatitude, initialLongitude]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr',
          },
        }
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      const newLocation = { address, latitude: lat, longitude: lng };
      setSelectedLocation(newLocation);
      setSearchQuery(address);
      onLocationSelect(newLocation);
    } catch (error) {
      const newLocation = { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, latitude: lat, longitude: lng };
      setSelectedLocation(newLocation);
      onLocationSelect(newLocation);
    }
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'fr',
          },
        }
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        const newLocation = { address: display_name, latitude, longitude };
        setSelectedLocation(newLocation);
        setSearchQuery(display_name);
        onLocationSelect(newLocation);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
            className="pl-9"
          />
        </div>
        <Button type="button" onClick={searchAddress} disabled={isLoading} variant="secondary">
          {isLoading ? 'Recherche...' : 'Rechercher'}
        </Button>
      </div>

      <div
        ref={mapRef}
        className="h-64 w-full rounded-lg border border-input overflow-hidden"
        style={{ minHeight: '250px' }}
      />

      {selectedLocation.latitude !== 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{selectedLocation.address || 'Emplacement sélectionné'}</span>
        </div>
      )}
    </div>
  );
}
