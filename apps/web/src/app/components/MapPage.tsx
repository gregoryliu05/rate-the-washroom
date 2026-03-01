import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, LineString } from "geojson";
import { WashroomListCard } from "./WashroomListCard";
import { WashroomDetail } from "./WashroomDetail";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Search, Plus, Loader2, Menu } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Link from "next/link";
import {
  getWashrooms,
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
import { cn } from "./ui/utils";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isJumpingToClosest, setIsJumpingToClosest] = useState(false);
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

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(media.matches);
    apply();

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

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

  const handleJumpToClosestWashroom = async () => {
    if (!map.current) return;

    setIsJumpingToClosest(true);
    try {
      const response = await getWashrooms();
      if (response.error || !response.data) {
        throw new Error(response.error || "Could not load washrooms");
      }

      if (response.data.length === 0) {
        toast.info("No washrooms have been added yet");
        return;
      }

      const mapCenter = map.current.getCenter();
      const reference = userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : { lat: mapCenter.lat, lng: mapCenter.lng };

      let closest = response.data[0];
      let closestDistance = calculateDistance(reference.lat, reference.lng, closest.lat, closest.long);

      for (const washroom of response.data.slice(1)) {
        const distance = calculateDistance(reference.lat, reference.lng, washroom.lat, washroom.long);
        if (distance < closestDistance) {
          closest = washroom;
          closestDistance = distance;
        }
      }

      map.current.flyTo({
        center: [closest.long, closest.lat],
        zoom: 14,
        essential: true,
      });
      setSelectedWashroom(closest);
      setDetailWashroom(null);
      toast.success("Jumped to the closest washroom");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to find closest washroom";
      toast.error("Could not jump to closest washroom", { description: message });
    } finally {
      setIsJumpingToClosest(false);
    }
  };

  // Filter washrooms by search
  const filteredWashrooms = washrooms.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showNearbyEmptyState = !isLoading && washrooms.length === 0 && searchQuery.trim().length === 0;

  const mapSection = (
    <div className="relative h-full min-h-0">
      <div ref={mapContainer} className="w-full h-full" />

      {selectedWashroom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm z-20">
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
                distance={selectedMeta?.distance}
                walkingTime={walkingTime}
                drivingTime={drivingTime}
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
                className="rounded-full w-full sm:flex-1 h-11 px-6 text-base font-medium border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
                onClick={() => showRoute(selectedWashroom, "walking")}
                disabled={!userLocation || isLoadingRoute}
              >
                Walk
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full w-full sm:flex-1 h-11 px-6 text-base font-medium border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
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
                className="mt-2 rounded-full w-full h-11 px-6 text-base font-medium border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
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
            className="w-full mt-2 rounded-full h-11 px-6 text-base font-medium border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );

  const listSection = (
    <div className="h-full bg-background md:border-r border-border overflow-y-auto min-h-0">
      <div className="p-4 space-y-4 md:sticky md:top-0 bg-background z-10 border-b border-border">
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
          {filteredWashrooms.length} washroom{filteredWashrooms.length !== 1 ? "s" : ""} nearby
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--coral)" }} />
        </div>
      ) : filteredWashrooms.length > 0 ? (
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
        </div>
      ) : showNearbyEmptyState ? (
        <div className="h-[calc(100%-90px)] flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-base font-medium">
              No nearby washrooms found yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tip: zoom out until your area shows washrooms.
            </p>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Button
              type="button"
              className="mt-4 w-full rounded-full"
              onClick={handleJumpToClosestWashroom}
              disabled={isJumpingToClosest}
            >
              {isJumpingToClosest ? "Finding closest washroom..." : "Jump to closest washroom"}
            </Button>

          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No washrooms found
        </div>
      )}
    </div>
  );

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
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
      <div className="bg-white border-b border-border p-3 sm:p-4 shrink-0 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3 px-1 sm:px-3 md:px-6">
          <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Rate the Washroom
          </h1>

          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] max-w-xs border-l border-border bg-white">
                <SheetHeader>
                  <SheetTitle style={{ fontFamily: "var(--font-serif)" }}>Menu</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6 flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAddReview();
                    }}
                  >
                    Add Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAddListing();
                    }}
                  >
                    <Plus className="size-5 mr-2" />
                    Add Washroom
                  </Button>
                  {user ? (
                    <>
                      <Button asChild variant="outline" className="rounded-full justify-start">
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                          Profile
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut();
                        }}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="rounded-full justify-start">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Log In
                        </Link>
                      </Button>
                      <Button asChild className="rounded-full justify-start">
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={() => onAddReview()}
              variant="outline"
              className="rounded-full text-sm px-4"
            >
              Add Review
            </Button>
            <Button
              onClick={onAddListing}
              variant="outline"
              className="rounded-full whitespace-nowrap text-sm px-4"
            >
              <Plus className="size-5 mr-2" />
              Add Washroom
            </Button>
            {user ? (
              <>
                <Button
                  onClick={signOut}
                  variant="outline"
                  className="rounded-full text-sm px-4"
                >
                  Sign Out
                </Button>
                <Link
                  href="/profile"
                  className="rounded-full border border-border bg-card p-1 hover:bg-secondary transition-colors"
                  aria-label="Open profile"
                >
                  <Avatar className="size-8 sm:size-9">
                    <AvatarImage src={user.photoURL || undefined} alt="Profile photo" />
                    <AvatarFallback>
                      {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full text-sm px-4">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="rounded-full text-sm px-4">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <PanelGroup
        direction={isDesktop ? "horizontal" : "vertical"}
        className="flex-1 min-h-0"
        onLayout={() => map.current?.resize()}
      >
        {isDesktop ? (
          <>
            <Panel defaultSize={25} minSize={20} maxSize={40} className="min-w-0">
              {listSection}
            </Panel>
            <PanelResizeHandle
              className={cn(
                "group shrink-0 bg-border/70 transition-colors hover:bg-border data-[resize-handle-active]:bg-[var(--coral)]",
                "w-2 cursor-col-resize flex items-center justify-center"
              )}
            >
              <div className="h-20 w-1 rounded-full bg-muted-foreground/40 group-hover:bg-muted-foreground/70" />
            </PanelResizeHandle>
            <Panel defaultSize={75} minSize={60} className="min-w-0">
              {mapSection}
            </Panel>
          </>
        ) : (
          <>
            <Panel defaultSize={67} minSize={40} className="min-h-0">
              {mapSection}
            </Panel>
            <PanelResizeHandle
              className={cn(
                "group shrink-0 bg-border/70 transition-colors hover:bg-border data-[resize-handle-active]:bg-[var(--coral)]",
                "h-3 cursor-row-resize flex items-center justify-center"
              )}
            >
              <div className="h-1 w-16 rounded-full bg-muted-foreground/40 group-hover:bg-muted-foreground/70" />
            </PanelResizeHandle>
            <Panel defaultSize={33} minSize={20} className="min-h-0">
              {listSection}
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
