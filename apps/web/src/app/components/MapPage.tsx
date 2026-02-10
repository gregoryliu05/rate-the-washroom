import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, LineString } from "geojson";
import { WashroomListCard } from "./WashroomListCard";
import { WashroomDetail } from "./WashroomDetail";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  getWashroomsInBounds,
  getCurrentLocation,
  calculateDistance,
  estimateDrivingTime,
  estimateWalkingTime,
  Washroom,
} from "../lib/api";
import { useAuth } from "../../context/authContext";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface WashroomWithDistance extends Washroom {
  distance?: number;
  walkingTime?: string;
  drivingTime?: string;
}

interface MapPageProps {
  onAddReview: (washroomId?: string) => void;
  onAddListing: () => void;
}

type RouteProfile = "walking" | "driving";

type RouteData = {
  profile: RouteProfile;
  distanceMeters: number;
  durationSeconds: number;
  geometry: LineString;
};

export function MapPage({ onAddReview, onAddListing }: MapPageProps) {
  const { user, signOut } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const routeAbortController = useRef<AbortController | null>(null);

  const [washrooms, setWashrooms] = useState<WashroomWithDistance[]>([]);
  const [selectedWashroom, setSelectedWashroom] = useState<Washroom | null>(null);
  const [detailWashroom, setDetailWashroom] = useState<Washroom | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<{
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  } | null>(null);

  const [activeRouteProfile, setActiveRouteProfile] = useState<RouteProfile | null>(null);
  const [routesByProfile, setRoutesByProfile] = useState<Partial<Record<RouteProfile, RouteData>>>({});
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const ROUTE_SOURCE_ID = "washroom-route";
  const ROUTE_LAYER_ID = "washroom-route-line";

  const formatDurationFromSeconds = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const clearRouteLine = () => {
    if (!map.current) return;
    try {
      if (map.current.getLayer(ROUTE_LAYER_ID)) {
        map.current.removeLayer(ROUTE_LAYER_ID);
      }
      if (map.current.getSource(ROUTE_SOURCE_ID)) {
        map.current.removeSource(ROUTE_SOURCE_ID);
      }
    } catch {
      // Ignore map lifecycle errors (e.g., style not ready)
    }
  };

  const setRouteLine = (geometry: LineString) => {
    if (!map.current) return;

    const feature: Feature<LineString> = {
      type: "Feature",
      properties: {},
      geometry,
    };

    const existingSource = map.current.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(feature);
      return;
    }

    map.current.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: feature,
    });

    map.current.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#ff6b6b",
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });
  };

  const fitRouteToView = (geometry: LineString) => {
    if (!map.current) return;
    if (geometry.coordinates.length < 2) return;
    const [firstLng, firstLat] = geometry.coordinates[0];
    const bounds = geometry.coordinates.reduce(
      (b, [lng, lat]) => b.extend([lng, lat]),
      new mapboxgl.LngLatBounds([firstLng, firstLat], [firstLng, firstLat])
    );
    map.current.fitBounds(bounds, {
      padding: 80,
      duration: 800,
    });
  };

  const fetchRoute = async (washroom: Washroom, profile: RouteProfile, signal: AbortSignal): Promise<RouteData> => {
    const token = mapboxgl.accessToken;
    if (!token) {
      throw new Error("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN)");
    }
    if (!userLocation) {
      throw new Error("Location not available. Enable location services to get routes.");
    }

    const origin = `${userLocation.lng},${userLocation.lat}`;
    const destination = `${washroom.long},${washroom.lat}`;
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin};${destination}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Mapbox directions failed: ${response.status}`);
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      throw new Error("No route found");
    }

    return {
      profile,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry as LineString,
    };
  };

  const showRoute = async (washroom: Washroom, profile: RouteProfile) => {
    if (!map.current) return;
    if (!userLocation) {
      toast.error("Enable location to get directions");
      return;
    }

    routeAbortController.current?.abort();
    const controller = new AbortController();
    routeAbortController.current = controller;

    setRouteError(null);
    setActiveRouteProfile(profile);
    setIsLoadingRoute(true);

    try {
      const cached = routesByProfile[profile];
      const route = cached || await fetchRoute(washroom, profile, controller.signal);
      if (controller.signal.aborted) return;

      if (!cached) {
        setRoutesByProfile((prev) => ({ ...prev, [profile]: route }));
      }

      setRouteLine(route.geometry);
      fitRouteToView(route.geometry);
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : "Failed to load route";
      setRouteError(message);
      setActiveRouteProfile(null);
      toast.error("Failed to load directions", { description: message });
      clearRouteLine();
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingRoute(false);
      }
    }
  };

  const clearRoute = () => {
    routeAbortController.current?.abort();
    routeAbortController.current = null;
    setActiveRouteProfile(null);
    setRouteError(null);
    setIsLoadingRoute(false);
    clearRouteLine();
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Get user location first, then initialize map
    getCurrentLocation().then((location) => {
      const center = location || { lat: 43.6532, lng: -79.3832 }; // Default to Toronto
      setUserLocation(location);

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.lng, center.lat],
        zoom: 13,
      });

      map.current.on("load", () => setMapReady(true));

      // Add user location marker
      if (location) {
        new mapboxgl.Marker({ color: "#ff6b6b" })
          .setLngLat([location.lng, location.lat])
          .addTo(map.current);
      }

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());
    });

    return () => {
      routeAbortController.current?.abort();
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    // Reset route when switching washrooms or when location changes.
    setRoutesByProfile({});
    clearRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWashroom?.id, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    if (!mapReady || !map.current) return;

    const updateBounds = () => {
      const bounds = map.current!.getBounds();
      if (!bounds) return;
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      setViewportBounds({
        minLat: sw.lat,
        minLon: sw.lng,
        maxLat: ne.lat,
        maxLon: ne.lng,
      });
    };

    updateBounds();
    map.current.on("moveend", updateBounds);
    map.current.on("zoomend", updateBounds);

    return () => {
      map.current?.off("moveend", updateBounds);
      map.current?.off("zoomend", updateBounds);
    };
  }, [mapReady]);

  // Fetch washrooms in current viewport bounds and sort by distance to map center
  useEffect(() => {
    const fetchWashrooms = async () => {
      setIsLoading(true);
      if (!viewportBounds || !map.current) {
        setIsLoading(false);
        return;
      }

      const response = await getWashroomsInBounds(viewportBounds);

      if (response.error) {
        toast.error("Failed to load washrooms");
        setIsLoading(false);
        return;
      }

      if (response.data) {
        const center = map.current.getCenter();
        const reference = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: center.lat, lng: center.lng };

        const washroomsWithDistance: WashroomWithDistance[] = response.data.map((w): WashroomWithDistance => {
          const distance = calculateDistance(reference.lat, reference.lng, w.lat, w.long);
          return {
            ...w,
            distance,
            walkingTime: estimateWalkingTime(distance),
            drivingTime: estimateDrivingTime(distance),
          };
        });

        washroomsWithDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

        setWashrooms(washroomsWithDistance);
        addMarkersToMap(washroomsWithDistance);
      }

      setIsLoading(false);
    };

    if (mapReady) {
      fetchWashrooms();
    }
  }, [mapReady, viewportBounds, userLocation]);

  // Add markers to map
  const addMarkersToMap = (washrooms: Washroom[]) => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    washrooms.forEach((washroom) => {
      const marker = new mapboxgl.Marker({ color: '#ff6b6b' })
        .setLngLat([washroom.long, washroom.lat])
        .addTo(map.current!);

      const el = marker.getElement();
      el.style.cursor = 'pointer';
      el.style.width = '22px';
      el.style.height = '33px';
      el.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))';

      el.addEventListener('click', () => {
        setSelectedWashroom(washroom);
        setDetailWashroom(null);
        map.current?.flyTo({
          center: [washroom.long, washroom.lat],
          zoom: 15,
        });
      });

      markers.current.push(marker);
    });
  };

  // Handle washroom selection
  const handleWashroomClick = (washroom: Washroom) => {
    setSelectedWashroom(washroom);
    setDetailWashroom(null);
    if (map.current) {
      map.current.flyTo({
        center: [washroom.long, washroom.lat],
        zoom: 15,
      });
    }
  };

  // Filter washrooms by search
  const filteredWashrooms = washrooms.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col">
      <Toaster />
      {detailWashroom && (
        <WashroomDetail
          washroom={detailWashroom}
          userLocation={userLocation}
          onClose={() => setDetailWashroom(null)}
          onAddReview={(washroomId) => onAddReview(washroomId)}
          onShowRoute={(profile) => showRoute(detailWashroom, profile)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-border p-4 shrink-0">
        <div className="flex items-center justify-between gap-4 px-6">
          <h1 className="text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Rate the Washroom
          </h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onAddReview()}
              variant="outline"
              className="rounded-full"
            >
              Add Review
            </Button>
            <Button
              onClick={onAddListing}
              variant="outline"
              className="rounded-full whitespace-nowrap"
            >
              <Plus className="size-5 mr-2" />
              Add Washroom
            </Button>
            {user ? (
              <>
                <Button
                  onClick={signOut}
                  variant="outline"
                  className="rounded-full"
                >
                  Sign Out
                </Button>
                <Link
                  href="/profile"
                  className="rounded-full border border-border bg-card p-1 hover:bg-secondary transition-colors"
                  aria-label="Open profile"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={user.photoURL || undefined} alt="Profile photo" />
                    <AvatarFallback>
                      {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Washroom List */}
        <div className="w-96 bg-background border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4 sticky top-0 bg-background z-10 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search washrooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredWashrooms.length} washroom{filteredWashrooms.length !== 1 ? 's' : ''} nearby
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-8 animate-spin" style={{ color: 'var(--coral)' }} />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredWashrooms.map((washroom) => (
                <WashroomListCard
                  key={washroom.id}
                  washroom={washroom}
                  distance={washroom.distance}
                  walkingTime={washroom.walkingTime}
                  drivingTime={washroom.drivingTime}
                  isSelected={selectedWashroom?.id === washroom.id}
                  onClick={() => handleWashroomClick(washroom)}
                  onViewDetails={() => {
                    handleWashroomClick(washroom);
                    setDetailWashroom(washroom);
                  }}
                />
              ))}
              {filteredWashrooms.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No washrooms found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Selected Washroom Popup */}
          {selectedWashroom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm">
              {(() => {
                const selectedMeta = washrooms.find((w) => w.id === selectedWashroom.id);
                const walkingTime =
                  routesByProfile.walking
                    ? formatDurationFromSeconds(routesByProfile.walking.durationSeconds)
                    : selectedMeta?.walkingTime;
                const drivingTime =
                  routesByProfile.driving
                    ? formatDurationFromSeconds(routesByProfile.driving.durationSeconds)
                    : selectedMeta?.drivingTime;

                return (
              <WashroomListCard
                washroom={selectedWashroom}
                className="bg-white/95 backdrop-blur-md"
                distance={
                  selectedMeta?.distance
                }
                walkingTime={
                  walkingTime
                }
                drivingTime={
                  drivingTime
                }
                isSelected
                onClick={() => setDetailWashroom(selectedWashroom)}
                onViewDetails={() => setDetailWashroom(selectedWashroom)}
              />
                );
              })()}

              <div className="mt-2 rounded-2xl border-2 bg-white/95 backdrop-blur-md p-3 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full w-full sm:flex-1"
                    onClick={() => showRoute(selectedWashroom, "walking")}
                    disabled={!userLocation || isLoadingRoute}
                  >
                    Walk
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full w-full sm:flex-1"
                    onClick={() => showRoute(selectedWashroom, "driving")}
                    disabled={!userLocation || isLoadingRoute}
                  >
                    Drive
                  </Button>
                </div>
                {activeRouteProfile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 rounded-full w-full"
                    onClick={clearRoute}
                  >
                    Clear
                  </Button>
                )}
                {!userLocation && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Enable location services to get directions.
                  </div>
                )}
                {routeError && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {routeError}
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  setSelectedWashroom(null);
                  setDetailWashroom(null);
                  clearRoute();
                }}
                variant="outline"
                size="sm"
                className="w-full mt-2 rounded-full"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
