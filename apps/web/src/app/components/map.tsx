import { useEffect, useRef, useState } from 'react';
import mapboxgl from "mapbox-gl"
import Head from "next/head";
import Script from "next/script";
import { MapBounds, Listing } from "./types"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
console.log("Mapbox token:", process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

 const mockNearbyListings: Listing[] = [
  {
    id: "1",
    name: "Central Library Washroom",
    address: "350 West Georgia St",
    city: "Vancouver",
    description: "Clean and accessible washroom on the main floor",
    coordinates: { lat: 49.2606, lng: -123.246 }
  },
  {
    id: "2",
    name: "Pacific Centre Mall Washroom",
    address: "701 W Georgia St",
    city: "Vancouver",
    description: "Modern facilities near the food court",
    coordinates: { lat: 49.275, lng: -123.22 }
  },
  {
    id: "3",
    name: "Waterfront Station Washroom",
    address: "601 W Cordova St",
    city: "Vancouver",
    description: "Public washroom inside the transit station",
    coordinates: { lat: 49.240, lng: -123.35 }
  },
  {
    id: "4",
    name: "Canada Place Washroom",
    address: "999 Canada Pl",
    city: "Vancouver",
    description: "Tourist-friendly facilities with harbor views",
    coordinates: { lat: 49.290, lng: -123.18 }
  }
];

export default function MapBoxMap() {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())

  const lng: number = -123.246
  const lat: number = 49.2606
  const zoom: number = 15

  // Function to fetch nearby listings from API
  const fetchNearbyListings = async (bounds: MapBounds) => {
    try {
      const response = await fetch(`http://localhost:8000/washrooms/?min_lat=${bounds.min_lat}&min_lon=${bounds.min_lon}&max_lat=${bounds.max_lat}&max_lon=${bounds.max_lon}`);

      if (!response.ok) {
        throw new Error('Failed to fetch nearby listings');
      }

      const listings = await response.json();
      setNearbyListings(listings);
      console.log(nearbyListings.length)
    } catch (error) {
      console.error('Error fetching nearby listings:', error);
      setNearbyListings([]);
    }
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
      maxZoom: 24,
      minZoom: 11
    })

    const updateBounds = () => {
      if (map.current) {
        console.log("Current zoom:", map.current.getZoom())
        const bounds = map.current.getBounds()
        if (bounds) {
          const newBounds = {
            min_lat: bounds.getSouth(),
            min_lon: bounds.getWest(),
            max_lat: bounds.getNorth(),
            max_lon: bounds.getEast()
          }
          setMapBounds(newBounds)
          console.log("newBounds", newBounds)
          // fetchNearbyListings(newBounds)
          setNearbyListings(mockNearbyListings);
        }
      }
    }

    map.current.on('zoom', updateBounds)
    map.current.on('moveend', updateBounds)
    map.current.on('load', updateBounds)
  }, [])

  useEffect(() => {
  // Set mock data on component mount
  setNearbyListings(mockNearbyListings);
}, [])

// Add a simple test marker after map creation
useEffect(() => {
  if (!map.current) return;

  const addTestMarker = () => {
    console.log("Adding test marker...");
    try {
      const marker = new mapboxgl.Marker({ color: 'blue' })
        .setLngLat([-123.246, 49.2606])
        .addTo(map.current!);
      console.log("Test marker added:", marker);
    } catch (error) {
      console.error("Error adding marker:", error);
    }
  };

  if (map.current.loaded()) {
    addTestMarker();
  } else {
    map.current.on('load', addTestMarker);
  }
}, []);

  useEffect(() => {
    if (!map.current || nearbyListings.length === 0) return;


    // Wait for map to be loaded before adding markers
    if (!map.current.loaded()) {
      map.current.on('load', () => {
        console.log("Map loaded, now adding markers");
        addMarkersToMap();
      });
    } else {
      addMarkersToMap();
    }

    function addMarkersToMap() {
    const currentIds = new Set(nearbyListings.map(listing => listing.id));

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    nearbyListings.forEach(listing => {
      if (!markersRef.current.has(listing.id)) {
        console.log("Adding marker for:", listing.name);

        // Create a div element for the marker
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = 'url(https://docs.mapbox.com/help/demos/custom-markers-gl-js/mapbox-icon.png)';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundSize = '100%';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([listing.coordinates.lng, listing.coordinates.lat])
          .setPopup(new mapboxgl.Popup().setHTML(
            `<h3>${listing.name}</h3>
            <p>${listing.address}</p>`
          ))
          .addTo(map.current!);

        markersRef.current.set(listing.id, marker);
      }
    });

    console.log("Markers in ref:", markersRef.current.size);
  }


  }, [nearbyListings])

  return (
    <>
    <Head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js"
        strategy="afterInteractive"
        onLoad={() => console.log("Mapbox loaded")}
      />

  <div
  ref={mapContainer} style={{ width: "100%", height: "400px" }}>

  </div>
  </>
)
}
