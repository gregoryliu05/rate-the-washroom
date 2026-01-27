import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { 
  createWashroom, 
  getCurrentLocation,
  createPointGeometry,
  WashroomCreate 
} from "../lib/api";
import { useAuth } from "../../context/authContext";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";

interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface AddListingPageProps {
  onBack: () => void;
  onCreated?: (washroomId: string) => void;
}

type MapboxContextItem = {
  id: string;
  text: string;
};

type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  place_type?: string[];
  context?: MapboxContextItem[];
  address?: string;
};

type MapboxGeocodeResponse = {
  features: MapboxFeature[];
};

export function AddListingPage({ onBack, onCreated }: AddListingPageProps) {
  const { getToken } = useAuth();
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState(0);
  const [long, setLong] = useState(0);
  const [openingHours, setOpeningHours] = useState<Record<string, string>>({});
  const [floor, setFloor] = useState<number | undefined>(undefined);
  const [wheelchairAccess, setWheelchairAccess] = useState(false);
  
  // UI state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOpeningHours, setShowOpeningHours] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<MapboxFeature[]>([]);
  const [addressSuggestionsError, setAddressSuggestionsError] = useState<string | null>(null);
  const addressAbortController = useRef<AbortController | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Handle "Use My Location" functionality
  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      
      if (!location) {
        toast.error("Unable to get your location", {
          description: "Please enable location services and try again."
        });
        return;
      }

      setLat(location.lat);
      setLong(location.lng);

      toast.success("Location detected!", {
        description: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      });
    } catch {
      toast.error("Error getting location");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const selectAddressSuggestion = (feature: MapboxFeature) => {
    const nextAddress =
      feature.place_type?.includes("address") && feature.address
        ? `${feature.address} ${feature.text}`
        : feature.place_name;

    setAddress(nextAddress);

    const [lng, latValue] = feature.center;
    if (Number.isFinite(latValue) && Number.isFinite(lng)) {
      setLat(latValue);
      setLong(lng);
    }

    const cityContext =
      feature.context?.find((c) => c.id.startsWith("place."))?.text ||
      feature.context?.find((c) => c.id.startsWith("locality."))?.text;
    const countryContext = feature.context?.find((c) => c.id.startsWith("country."))?.text;

    if (cityContext) setCity(cityContext);
    if (countryContext) setCountry(countryContext);

    if (!name && feature.place_type?.includes("poi") && feature.text) {
      setName(feature.text);
    }

    setIsAddressFocused(false);
  };

  useEffect(() => {
    const hasToken = mapboxToken.trim().length > 0;
    const hasCoords = lat !== 0 && long !== 0;
    const query = address.trim();
    const shouldSuggestNearby = query.length === 0 && hasCoords;
    const shouldFetch = hasToken && (isAddressFocused || shouldSuggestNearby);

    if (!shouldFetch) {
      setAddressSuggestions([]);
      setAddressSuggestionsError(null);
      setIsLoadingAddressSuggestions(false);
      addressAbortController.current?.abort();
      addressAbortController.current = null;
      return;
    }

    const timeout = setTimeout(async () => {
      addressAbortController.current?.abort();
      const controller = new AbortController();
      addressAbortController.current = controller;

      setIsLoadingAddressSuggestions(true);
      setAddressSuggestionsError(null);

      try {
        let url: string | null = null;

        if (query.length >= 3) {
          const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
          const params = new URLSearchParams({
            access_token: mapboxToken,
            autocomplete: "true",
            limit: "6",
            types: "address,poi",
          });
          if (hasCoords) {
            params.set("proximity", `${long},${lat}`);
          }
          url = `${base}?${params.toString()}`;
        } else if (query.length === 0 && hasCoords) {
          const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json`;
          const params = new URLSearchParams({
            access_token: mapboxToken,
            limit: "6",
            types: "address,poi",
          });
          url = `${base}?${params.toString()}`;
        }

        if (!url) {
          setAddressSuggestions([]);
          setIsLoadingAddressSuggestions(false);
          return;
        }

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Mapbox search failed: ${response.status}`);
        }

        const data = (await response.json()) as MapboxGeocodeResponse;
        setAddressSuggestions(data.features || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAddressSuggestions([]);
        setAddressSuggestionsError(error instanceof Error ? error.message : "Failed to load suggestions");
      } finally {
        setIsLoadingAddressSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [address, isAddressFocused, lat, long, mapboxToken]);

  // Handle opening hours change
  const handleOpeningHoursChange = (day: string, value: string) => {
    setOpeningHours({
      ...openingHours,
      [day.toLowerCase()]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name || !description || !address || !city || !country) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (lat === 0 || long === 0) {
      toast.error("Please add location coordinates", {
        description: "Use 'Use My Location' button"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to add a washroom");
        setIsSubmitting(false);
        return;
      }

      // Prepare payload according to your schema
      const payload: WashroomCreate = {
        name,
        description,
        address,
        city,
        country,
        lat,
        long,
        geom: createPointGeometry(lat, long), // Create PostGIS POINT
        overall_rating: 0, // Initial rating
        rating_count: 0, // No reviews yet
        wheelchair_access: wheelchairAccess,
        opening_hours: Object.keys(openingHours).length > 0 ? openingHours : undefined,
      };

      // Call API
      const response = await createWashroom(payload, token);

      if (response.error) {
        throw new Error(response.error);
      }
      const createdWashroomId = response.data?.id;

      toast.success("Washroom listing created!", {
        description: "Thank you for contributing to the community."
      });

      // Reset form
      setName("");
      setDescription("");
      setAddress("");
      setCity("");
      setCountry("");
      setLat(0);
      setLong(0);
      setOpeningHours({});
      setFloor(undefined);
      setWheelchairAccess(false);

      // Navigate back after brief delay
      setTimeout(() => {
        if (onCreated && createdWashroomId) {
          onCreated(createdWashroomId);
          return;
        }
        onBack();
      }, 1500);
      
    } catch (error) {
      toast.error("Failed to create listing", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="size-5 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Add New Washroom
          </h1>
          <p className="text-muted-foreground mt-2">
            Help others find great restrooms by adding a new location
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="p-8 md:p-12 border-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Name */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Starbucks Downtown, Central Park Restroom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 text-base"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the washroom facilities, cleanliness, accessibility features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="mt-2 text-base"
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Address *</Label>
              <div className="relative">
                <Input
                  id="address"
                  type="text"
                  placeholder="Start typing an address or nearby building…"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setIsAddressFocused(true);
                  }}
                  onFocus={() => setIsAddressFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsAddressFocused(false), 150);
                  }}
                  required
                  className="mt-2"
                />

                {mapboxToken.trim().length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable address suggestions.
                  </p>
                )}

                {(isAddressFocused || (address.trim().length === 0 && lat !== 0 && long !== 0)) &&
                  mapboxToken.trim().length > 0 && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-white/95 backdrop-blur-md shadow-lg">
                      <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                        {isLoadingAddressSuggestions
                          ? "Searching…"
                          : address.trim().length >= 3
                            ? "Suggested matches"
                            : "Nearby addresses"}
                      </div>

                      {addressSuggestionsError && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {addressSuggestionsError}
                        </div>
                      )}

                      {!isLoadingAddressSuggestions && !addressSuggestionsError && addressSuggestions.length === 0 && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          {address.trim().length > 0 && address.trim().length < 3
                            ? "Type at least 3 characters to search."
                            : "No suggestions found."}
                        </div>
                      )}

                      {addressSuggestions.length > 0 && (
                        <div className="max-h-64 overflow-auto">
                          {addressSuggestions.map((feature) => (
                            <button
                              key={feature.id}
                              type="button"
                              className="w-full px-3 py-3 text-left hover:bg-muted/50 transition-colors"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectAddressSuggestion(feature)}
                            >
                              <div className="text-sm font-medium truncate">
                                {feature.place_type?.includes("address") && feature.address
                                  ? `${feature.address} ${feature.text}`
                                  : feature.text}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {feature.place_name}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            {/* Floor (Optional) */}
            <div>
              <Label htmlFor="floor">Floor (Optional)</Label>
              <Input
                id="floor"
                type="number"
                placeholder="e.g., 2 for 2nd floor, 0 for ground floor"
                value={floor ?? ""}
                onChange={(e) => setFloor(e.target.value ? parseInt(e.target.value) : undefined)}
                className="mt-2"
              />
            </div>

            {/* Location Button */}
            <div>
              <Label>Location Coordinates *</Label>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLoadingLocation}
                  className="rounded-xl"
                  style={{ backgroundColor: 'var(--pastel-blue)' }}
                >
                  {isLoadingLocation ? (
                    <>
                      <Loader2 className="size-5 animate-spin mr-2" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="size-5 mr-2" />
                      Use My Location
                    </>
                  )}
                </Button>
              </div>
              {(lat !== 0 || long !== 0) && (
                <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--pastel-green)' }}>
                  <p className="text-sm">
                    <strong>Coordinates:</strong> {lat.toFixed(6)}, {long.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {/* Wheelchair Access */}
            <div className="flex items-center gap-3">
              <input
                id="wheelchair"
                type="checkbox"
                checked={wheelchairAccess}
                onChange={(e) => setWheelchairAccess(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-coral focus:ring-coral"
              />
              <Label htmlFor="wheelchair" className="cursor-pointer">
                Wheelchair Accessible
              </Label>
            </div>

            {/* Opening Hours */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Clock className="size-5" />
                  Opening Hours (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOpeningHours(!showOpeningHours)}
                  className="rounded-full"
                >
                  {showOpeningHours ? "Hide" : "Add Hours"}
                </Button>
              </div>

              {showOpeningHours && (
                <Card className="p-6 space-y-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="grid grid-cols-3 gap-4 items-center">
                      <Label htmlFor={day} className="col-span-1">
                        {day}
                      </Label>
                      <Input
                        id={day}
                        type="text"
                        placeholder="e.g., 9:00 AM - 6:00 PM or 24/7"
                        value={openingHours[day.toLowerCase() as keyof OpeningHours] || ""}
                        onChange={(e) => handleOpeningHoursChange(day, e.target.value)}
                        className="col-span-2"
                      />
                    </div>
                  ))}
                </Card>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full py-6 text-base"
                onClick={onBack}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                className="flex-1 rounded-full py-6 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Listing"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
