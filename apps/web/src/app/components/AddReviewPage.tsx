import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { StarRatingInput } from "./StarRatingInput";
import { ArrowLeft, Loader2, MapPin, Plus } from "lucide-react";
import { 
  createReview, 
  getCurrentLocation,
  getWashroomById,
  getWashrooms,
  getWashroomsInBounds,
  calculateDistance,
  estimateDrivingTime,
  estimateWalkingTime,
  Washroom,
  ReviewCreate 
} from "../lib/api";
import { useAuth } from "../../context/authContext";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";

interface AddReviewPageProps {
  onBack: () => void;
  prefillWashroomId?: string;
  onAddWashroom?: () => void;
}

interface WashroomWithDistance extends Washroom {
  distance?: number;
  walkingTime?: string;
  drivingTime?: string;
}

const DEFAULT_RADIUS_KM = 8;

function boundsAround(lat: number, lng: number, radiusKm: number) {
  const deltaLat = radiusKm / 111;
  const latRad = (lat * Math.PI) / 180;
  const denom = 111 * Math.cos(latRad);
  const deltaLon = radiusKm / (Number.isFinite(denom) && denom !== 0 ? denom : 111);

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLon: lng - deltaLon,
    maxLon: lng + deltaLon,
  };
}

export function AddReviewPage({ onBack, prefillWashroomId, onAddWashroom }: AddReviewPageProps) {
  const { getToken } = useAuth();
  // Form state
  const [selectedWashroomId, setSelectedWashroomId] = useState(prefillWashroomId || "");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [washrooms, setWashrooms] = useState<WashroomWithDistance[]>([]);
  const [isLoadingWashrooms, setIsLoadingWashrooms] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [washroomScope, setWashroomScope] = useState<"nearby" | "all">("nearby");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAllWashrooms = async (location?: { lat: number; lng: number } | null) => {
    const response = await getWashrooms();
    if (response.error) {
      toast.error("Failed to load washrooms", { description: response.error });
      setWashrooms([]);
      return;
    }

    const rawWashrooms = response.data || [];
    const withDistance: WashroomWithDistance[] = location
      ? rawWashrooms
          .map((w) => {
            const distance = calculateDistance(location.lat, location.lng, w.lat, w.long);
            return {
              ...w,
              distance,
              walkingTime: estimateWalkingTime(distance),
              drivingTime: estimateDrivingTime(distance),
            };
          })
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      : rawWashrooms;

    setWashrooms(withDistance);
    setWashroomScope("all");
  };

  const handleUseMyLocationForSuggestions = async () => {
    setIsLoadingWashrooms(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        toast.error("Unable to get your location", {
          description: "Please enable location services and try again.",
        });
        return;
      }

      setUserLocation(location);
      const bounds = boundsAround(location.lat, location.lng, DEFAULT_RADIUS_KM);
      const response = await getWashroomsInBounds(bounds);

      if (response.error) {
        toast.error("Failed to load nearby washrooms", { description: response.error });
        return;
      }

      const withDistance: WashroomWithDistance[] = (response.data || [])
        .map((w) => {
          const distance = calculateDistance(location.lat, location.lng, w.lat, w.long);
          return {
            ...w,
            distance,
            walkingTime: estimateWalkingTime(distance),
            drivingTime: estimateDrivingTime(distance),
          };
        })
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      setWashrooms(withDistance);
      setWashroomScope("nearby");
    } finally {
      setIsLoadingWashrooms(false);
    }
  };

  const handleSearchAllWashrooms = async () => {
    setIsLoadingWashrooms(true);
    try {
      await loadAllWashrooms(userLocation);
    } finally {
      setIsLoadingWashrooms(false);
    }
  };

  useEffect(() => {
    if (prefillWashroomId) setSelectedWashroomId(prefillWashroomId);
  }, [prefillWashroomId]);

  // Fetch washrooms for selection
  useEffect(() => {
    let cancelled = false;

    const fetchWashrooms = async () => {
      setIsLoadingWashrooms(true);
      try {
        const location = await getCurrentLocation();
        if (cancelled) return;
        setUserLocation(location);

        let response:
          | Awaited<ReturnType<typeof getWashroomsInBounds>>
          | Awaited<ReturnType<typeof getWashrooms>>;

        if (location) {
          const bounds = boundsAround(location.lat, location.lng, DEFAULT_RADIUS_KM);
          response = await getWashroomsInBounds(bounds);
        } else {
          response = await getWashrooms();
        }

        if (cancelled) return;

        if (response.error) {
          toast.error("Failed to load washrooms", { description: response.error });
          setWashrooms([]);
          return;
        }

        const rawWashrooms = response.data || [];

        const withDistance: WashroomWithDistance[] = location
          ? rawWashrooms
              .map((w) => {
                const distance = calculateDistance(location.lat, location.lng, w.lat, w.long);
                return {
                  ...w,
                  distance,
                  walkingTime: estimateWalkingTime(distance),
                  drivingTime: estimateDrivingTime(distance),
                };
              })
              .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
          : rawWashrooms;

        setWashroomScope(location ? "nearby" : "all");

        // If we were deep-linked into a washroom, ensure it's present in the list.
        if (prefillWashroomId && !withDistance.some((w) => w.id === prefillWashroomId)) {
          const fallback = await getWashroomById(prefillWashroomId);
          if (fallback.data) {
            const w = fallback.data;
            const distance = location ? calculateDistance(location.lat, location.lng, w.lat, w.long) : undefined;
            withDistance.unshift({
              ...w,
              distance,
              walkingTime: distance !== undefined ? estimateWalkingTime(distance) : undefined,
              drivingTime: distance !== undefined ? estimateDrivingTime(distance) : undefined,
            });
          }
        }

        setWashrooms(withDistance);
      } finally {
        if (!cancelled) setIsLoadingWashrooms(false);
      }
    };

    fetchWashrooms();
    return () => {
      cancelled = true;
    };
  }, [prefillWashroomId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedWashroomId) {
      toast.error("Please select a washroom");
      return;
    }

    if (rating === 0) {
      toast.error("Please add a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to submit a review");
        setIsSubmitting(false);
        return;
      }

      const payload: ReviewCreate = {
        washroom_id: selectedWashroomId,
        rating,
        title: title || undefined,
        description: description || undefined,
      };

      const response = await createReview(payload, token);

      if (response.error) {
        throw new Error(response.error);
      }

      const wasUpdate = response.status === 200;
      toast.success(wasUpdate ? "Review updated!" : "Review submitted!", {
        description: wasUpdate
          ? "We updated your existing review for this washroom."
          : "Thank you for sharing your experience.",
      });

      // Reset form
      setSelectedWashroomId("");
      setRating(0);
      setTitle("");
      setDescription("");

      // Navigate back after brief delay
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error) {
      toast.error("Failed to submit review", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter washrooms by search
  const filteredWashrooms = washrooms.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Add Review
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your experience and help others
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="p-8 md:p-12 border-2">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Washroom Selection */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="washroom">Select Washroom *</Label>
                {!userLocation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={handleUseMyLocationForSuggestions}
                    disabled={isLoadingWashrooms}
                  >
                    <MapPin className="size-4" />
                    Use my location
                  </Button>
                )}
              </div>
              
              {isLoadingWashrooms ? (
                <div className="mt-2 p-4 flex items-center justify-center border rounded-xl">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mt-2">
                    {userLocation
                      ? washroomScope === "nearby"
                        ? `Showing washrooms near you (within ~${DEFAULT_RADIUS_KM} km).`
                        : "Showing all washrooms (sorted by distance)."
                      : "Tip: enable location to see nearby washrooms first."}
                  </p>

                  {/* Search */}
                  <Input
                    type="text"
                    placeholder="Search washrooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-2 mb-3"
                  />

                  {/* Washroom List */}
                  <div className="border rounded-xl max-h-64 overflow-y-auto">
                    {filteredWashrooms.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No washrooms found
                      </div>
                    ) : (
                      filteredWashrooms.map((washroom) => (
                        <label
                          key={washroom.id}
                          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 transition-colors ${
                            selectedWashroomId === washroom.id ? 'bg-muted' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="washroom"
                            value={washroom.id}
                            checked={selectedWashroomId === washroom.id}
                            onChange={(e) => setSelectedWashroomId(e.target.value)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{washroom.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {washroom.address}, {washroom.city}
                            </div>
                          </div>
                          {washroom.distance !== undefined && (
                            <div className="shrink-0 text-right text-xs text-muted-foreground">
                              <div>{washroom.distance.toFixed(1)} km</div>
                              {washroom.walkingTime && <div>Walk {washroom.walkingTime}</div>}
                              {washroom.drivingTime && <div>Drive {washroom.drivingTime}</div>}
                            </div>
                          )}
                        </label>
                      ))
                    )}
                  </div>

                  {filteredWashrooms.length === 0 &&
                    washroomScope === "nearby" &&
                    searchQuery.trim().length >= 3 && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Not seeing it nearby?
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={handleSearchAllWashrooms}
                        >
                          Search all washrooms
                        </Button>
                      </div>
                    )}

                  {onAddWashroom && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Can’t find the washroom you used?
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={onAddWashroom}
                      >
                        <Plus className="size-4" />
                        Add washroom
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Rating */}
            <div className="pt-4">
              <StarRatingInput
                label="Your Rating *"
                value={rating}
                onChange={setRating}
                size="lg"
              />
              <p className="text-sm text-muted-foreground mt-2">
                How would you rate this washroom?
              </p>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Review Title (Optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Clean and well-maintained"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Your Review (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Share your experience... Was it clean? Well-stocked? Any issues?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="mt-2"
              />
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
                disabled={isSubmitting}
                variant="outline"
                className="flex-1 rounded-full py-6 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
