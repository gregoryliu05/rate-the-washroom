'use client';

import { useEffect, useMemo, useState } from "react";
import { Accessibility, Clock, Loader2, MapPin, Star, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  calculateDistance,
  estimateDrivingTime,
  estimateWalkingTime,
  getReviewsByWashroom,
  ReviewByWashroom,
  Washroom,
} from "../lib/api";

interface WashroomDetailProps {
  washroom: Washroom;
  userLocation?: { lat: number; lng: number } | null;
  onClose: () => void;
  onAddReview?: (washroomId: string) => void;
  onShowRoute?: (profile: "walking" | "driving") => void;
}

export function WashroomDetail({ washroom, userLocation, onClose, onAddReview, onShowRoute }: WashroomDetailProps) {
  const [reviews, setReviews] = useState<ReviewByWashroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      const response = await getReviewsByWashroom(washroom.id);
      if (cancelled) return;
      if (response.error) {
        setReviews([]);
        setLoadError(response.error);
        return;
      }
      setReviews(response.data || []);
    })()
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [washroom.id]);

  const openingHoursRows = useMemo(() => {
    if (!washroom.opening_hours) return [];
    return Object.entries(washroom.opening_hours);
  }, [washroom.opening_hours]);

  const formatReviewDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const travelInfo = useMemo(() => {
    if (!userLocation) return null;
    const distanceKm = calculateDistance(userLocation.lat, userLocation.lng, washroom.lat, washroom.long);
    return {
      distanceKm,
      walkingTime: estimateWalkingTime(distanceKm),
      drivingTime: estimateDrivingTime(distanceKm),
    };
  }, [userLocation, washroom.lat, washroom.long]);

  const filledStars = Math.max(0, Math.min(5, Math.round(washroom.overall_rating)));

  return (
    <div
      className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border-2 bg-white/95 backdrop-blur-md shadow-2xl">
        <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl truncate" style={{ fontFamily: "var(--font-serif)" }}>
                {washroom.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="size-4 shrink-0" />
                  <span className="truncate">
                    {washroom.address}, {washroom.city}
                  </span>
                </div>
                {travelInfo && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <span>
                      {travelInfo.distanceKm.toFixed(1)} km • Walk {travelInfo.walkingTime} • Drive {travelInfo.drivingTime}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Accessibility className="size-4" />
                  <span>{washroom.wheelchair_access ? "Wheelchair accessible" : "Not wheelchair accessible"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="size-6" />
            </button>
          </div>

          {washroom.description && (
            <p className="mt-6 text-muted-foreground">{washroom.description}</p>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-4xl" style={{ fontFamily: "var(--font-serif)", color: "var(--coral)" }}>
                    {washroom.overall_rating.toFixed(1)}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="size-5"
                        style={{
                          fill: star <= filledStars ? "var(--coral)" : "none",
                          color: star <= filledStars ? "var(--coral)" : "#d1d5db",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {washroom.rating_count} {washroom.rating_count === 1 ? "review" : "reviews"}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  {onAddReview && (
                    <Button
                      variant="outline"
                      className="rounded-full w-full sm:w-auto"
                      onClick={() => {
                        onClose();
                        onAddReview(washroom.id);
                      }}
                    >
                      Write a review
                    </Button>
                  )}
                  {onShowRoute && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full w-full sm:w-auto"
                        disabled={!userLocation}
                        onClick={() => {
                          onClose();
                          onShowRoute("walking");
                        }}
                      >
                        Walk
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full w-full sm:w-auto"
                        disabled={!userLocation}
                        onClick={() => {
                          onClose();
                          onShowRoute("driving");
                        }}
                      >
                        Drive
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>Opening hours</span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {openingHoursRows.length === 0 ? (
                  <div className="text-muted-foreground">Not provided</div>
                ) : (
                  openingHoursRows.map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between gap-4">
                      <span className="capitalize">{day}</span>
                      <span className="text-muted-foreground">{hours}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>
                Recent reviews
              </h2>
              <div className="text-xs text-muted-foreground">
                {washroom.rating_count} total
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin" style={{ color: "var(--coral)" }} />
                </div>
              ) : loadError ? (
                <Card className="p-6 border-2">
                  <div className="text-muted-foreground">Failed to load reviews: {loadError}</div>
                </Card>
              ) : reviews.length === 0 ? (
                <Card className="p-6 border-2">
                  <div className="text-muted-foreground">No reviews yet.</div>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="p-6 border-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {review.title || "Review"}
                        </div>
                        {review.description && (
                          <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                            {review.description}
                          </div>
                        )}
                        <div className="mt-3 text-xs text-muted-foreground">
                          {formatReviewDate(review.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="size-4" style={{ fill: "var(--coral)", color: "var(--coral)" }} />
                        <span className="text-sm font-semibold">{review.rating}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="mt-8">
            <Button onClick={onClose} variant="outline" className="w-full rounded-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
