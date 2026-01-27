import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function StarRatingInput({ 
  value, 
  onChange, 
  label = "Rating",
  size = "md" 
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  };

  const starSize = sizeClasses[size];

  return (
    <div>
      {label && (
        <label className="block mb-3 text-sm font-medium">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={starSize}
              style={{
                fill: star <= (hoverValue || value) ? 'var(--coral)' : 'none',
                color: star <= (hoverValue || value) ? 'var(--coral)' : '#d1d5db',
                transition: 'all 0.2s',
              }}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-2xl" style={{ fontFamily: 'var(--font-serif)', color: 'var(--coral)' }}>
            {value}.0
          </span>
        )}
      </div>
    </div>
  );
}
