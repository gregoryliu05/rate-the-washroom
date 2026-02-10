import { X, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Label } from "./ui/label";

export interface AddReviewFormData {
  name: string;
  location: string;
  address: string;
  type: string;
  overallRating: number;
  cleanlinessRating: number;
  amenitiesRating: number;
  comment: string;
}

interface AddReviewModalProps {
  onClose: () => void;
  onSubmit: (review: AddReviewFormData) => void;
}

export function AddReviewModal({ onClose, onSubmit }: AddReviewModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("Public");
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [amenitiesRating, setAmenitiesRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      location,
      address,
      type,
      overallRating,
      cleanlinessRating,
      amenitiesRating,
      comment,
    });
    onClose();
  };

  const RatingInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
  }) => (
      <div>
        <Label className="mb-2 block">{label}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className="size-8"
                style={{
                  fill: star <= value ? 'var(--coral)' : 'none',
                  color: star <= value ? 'var(--coral)' : '#d1d5db'
                }}
              />
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-3xl max-w-2xl w-full my-8 shadow-2xl">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Add a Review
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="size-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Restroom Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Starbucks Downtown"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="location">Location/City</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="e.g., 123 Main St"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 w-full px-4 py-2 rounded-lg border border-border bg-input-background"
              >
                <option>Public</option>
                <option>Restaurant/Cafe</option>
                <option>Shopping Mall</option>
                <option>Office Building</option>
                <option>Hotel</option>
                <option>Gas Station</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-4 pt-4">
              <RatingInput
                label="Overall Rating"
                value={overallRating}
                onChange={setOverallRating}
              />
              
              <RatingInput
                label="Cleanliness"
                value={cleanlinessRating}
                onChange={setCleanlinessRating}
              />
              
              <RatingInput
                label="Amenities"
                value={amenitiesRating}
                onChange={setAmenitiesRating}
              />
            </div>

            <div>
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                className="flex-1 rounded-full"
              >
                Submit Review
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
