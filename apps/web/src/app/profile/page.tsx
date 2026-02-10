'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../../context/authContext";
import { Toaster } from "../components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { ApiResponse, getMyWashrooms, getReviewsByUser, getWashroomById, ReviewByUser, Washroom } from "../lib/api";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewByUser[]>([]);
  const [reviewWashroomsById, setReviewWashroomsById] = useState<Record<string, Washroom>>({});
  const [myWashrooms, setMyWashrooms] = useState<Washroom[]>([]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const token = await user.getIdToken();
      const emptyWashroomsResponse: ApiResponse<Washroom[]> = { data: [] };

      const [reviewsResponse, myWashroomsResponse] = await Promise.all([
        getReviewsByUser(user.uid, token),
        token ? getMyWashrooms(token) : Promise.resolve(emptyWashroomsResponse),
      ]);

      if (cancelled) return;

      if (reviewsResponse.error) {
        toast.error("Failed to load your reviews", { description: reviewsResponse.error });
      }

      if (myWashroomsResponse.error) {
        toast.error("Failed to load your washrooms", { description: myWashroomsResponse.error });
      }

      const reviewData = reviewsResponse.data || [];
      setReviews(reviewData);
      setMyWashrooms(myWashroomsResponse.data || []);

      const uniqueWashroomIds = Array.from(new Set(reviewData.map((r) => r.washroom_id)));
      if (uniqueWashroomIds.length === 0) {
        setReviewWashroomsById({});
        return;
      }

      const washroomEntries = await Promise.all(
        uniqueWashroomIds.map(async (id) => {
          const response = await getWashroomById(id);
          return response.data ? [id, response.data] as const : null;
        })
      );

      if (cancelled) return;

      const mapping: Record<string, Washroom> = {};
      for (const entry of washroomEntries) {
        if (!entry) continue;
        mapping[entry[0]] = entry[1];
      }
      setReviewWashroomsById(mapping);
    })()
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const recentReviewedWashrooms = useMemo(() => {
    const seen = new Set<string>();
    const ordered: Washroom[] = [];
    for (const review of reviews) {
      if (seen.has(review.washroom_id)) continue;
      seen.add(review.washroom_id);
      const washroom = reviewWashroomsById[review.washroom_id];
      if (washroom) ordered.push(washroom);
    }
    return ordered.slice(0, 6);
  }, [reviews, reviewWashroomsById]);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-4xl md:text-5xl" style={{ fontFamily: "var(--font-serif)" }}>
            Your Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Keep track of your reviews and favorite spots.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {!user ? (
          <Card className="p-8 border-2 text-center">
            <p className="text-lg mb-4">Sign in to view your profile.</p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-8 border-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="size-16 border border-border">
                    <AvatarImage src={user.photoURL || undefined} alt="Profile photo" />
                    <AvatarFallback>
                      {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-2xl truncate" style={{ fontFamily: "var(--font-serif)" }}>
                      {user.displayName || "Community Member"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/">Back to map</Link>
                  </Button>
                  <Button onClick={signOut} variant="outline" className="rounded-full">
                    Sign Out
                  </Button>
                </div>
              </div>

              {isLoading && (
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading your activity…
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-2">
                <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                  Recent Reviews
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">You haven’t posted any reviews yet.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {reviews.slice(0, 6).map((review) => {
                      const washroom = reviewWashroomsById[review.washroom_id];
                      return (
                        <Card key={review.id} className="p-4 border">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {washroom?.name || "Washroom"}
                              </div>
                              {review.title && (
                                <div className="mt-1 text-sm text-muted-foreground truncate">
                                  {review.title}
                                </div>
                              )}
                              {review.description && (
                                <div className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                  {review.description}
                                </div>
                              )}
                              <div className="mt-3 text-xs text-muted-foreground">
                                {formatDate(review.created_at)}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="size-4" style={{ fill: "var(--coral)", color: "var(--coral)" }} />
                              <span className="text-sm font-semibold">{review.rating}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
              <Card className="p-6 border-2">
                <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                  Recent Washrooms
                </h2>
                {recentReviewedWashrooms.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Review a washroom to see it here.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {recentReviewedWashrooms.map((w) => (
                      <Card key={w.id} className="p-4 border">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{w.name}</div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              <span className="truncate">
                                {w.address}, {w.city}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {w.rating_count} {w.rating_count === 1 ? "review" : "reviews"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="size-4" style={{ fill: "var(--coral)", color: "var(--coral)" }} />
                            <span className="text-sm font-semibold">{w.overall_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6 border-2">
              <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                Your Listings
              </h2>
              {myWashrooms.length === 0 ? (
                <p className="text-muted-foreground text-sm">You haven’t added any washrooms yet.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myWashrooms.map((w) => (
                    <Card key={w.id} className="p-4 border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{w.name}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span className="truncate">
                              {w.address}, {w.city}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {w.rating_count} {w.rating_count === 1 ? "review" : "reviews"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="size-4" style={{ fill: "var(--coral)", color: "var(--coral)" }} />
                          <span className="text-sm font-semibold">{w.overall_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
