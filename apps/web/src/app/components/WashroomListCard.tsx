import { Star, MapPin, Clock, Car } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { Washroom } from "../lib/api";

interface WashroomListCardProps {
  washroom: Washroom;
  distance?: number; // in km
  walkingTime?: string;
  drivingTime?: string;
  isSelected?: boolean;
  onClick?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function WashroomListCard({
  washroom,
  distance,
  walkingTime,
  drivingTime,
  isSelected = false,
  onClick,
  onViewDetails,
  className,
}: WashroomListCardProps) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-300 hover:shadow-lg",
        isSelected && "ring-2 border-2 shadow-xl scale-105",
        className,
      )}
      style={{
        borderColor: isSelected ? 'var(--coral)' : undefined,
      }}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-xl truncate" 
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {washroom.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {washroom.address}, {washroom.city}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 shrink-0">
            <Star
              className="size-5"
              style={{ fill: 'var(--coral)', color: 'var(--coral)' }}
            />
            <span className="font-semibold">
              {washroom.overall_rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        {washroom.description && (
          <p className="text-sm line-clamp-2">
            {washroom.description}
          </p>
        )}

        {/* Distance & Time */}
        {(distance !== undefined || walkingTime || drivingTime) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                <span>{distance.toFixed(1)} km away</span>
              </div>
            )}
            {walkingTime && (
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>Walk {walkingTime}</span>
              </div>
            )}
            {drivingTime && (
              <div className="flex items-center gap-1">
                <Car className="size-4" />
                <span>Drive {drivingTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Rating Count */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {washroom.rating_count} {washroom.rating_count === 1 ? 'review' : 'reviews'}
          </span>
          {onViewDetails && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
