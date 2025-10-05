import { useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map when component mounts
    const initMap = async () => {
      await google.maps.importLibrary("maps");
      await google.maps.importLibrary("marker");

      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 49.2827, lng: -123.1207 },
        zoom: 8,
        mapId: "DEMO_MAP_ID",
      });

      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: 49.2827, lng: -123.1207 },
      });
    };

    initMap();
  }, []);

  return <div ref={mapRef} id="map" className="w-full h-96" />;
}