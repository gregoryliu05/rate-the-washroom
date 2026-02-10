import { Star, MapPin, Users } from "lucide-react";
import { Card } from "./ui/card";

interface WashroomCardProps {
  id: string;
  name: string;
  location: string;
  type: string;
  overallRating: number;
  cleanlinessRating: number;
  amenitiesRating: number;
  totalReviews: number;
  tags: string[];
  onClick: () => void;
}

export function WashroomCard({
  name,
  location,
  type,
  overallRating,
  totalReviews,
  tags,
  onClick,
}: WashroomCardProps) {
  return (
    <Card
      onClick={onClick}
      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-border bg-card group"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              {name}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MapPin className="size-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="size-4" />
              <span>{type}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl" style={{ fontFamily: 'var(--font-serif)', color: 'var(--coral)' }}>
                {overallRating.toFixed(1)}
              </span>
              <Star className="size-6 fill-current" style={{ color: 'var(--coral)' }} />
            </div>
            <span className="text-sm text-muted-foreground">{totalReviews} reviews</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full text-xs"
              style={{ 
                backgroundColor: index % 3 === 0 ? 'var(--pastel-blue)' : index % 3 === 1 ? 'var(--pastel-green)' : 'var(--pastel-yellow)',
                color: 'var(--foreground)'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
