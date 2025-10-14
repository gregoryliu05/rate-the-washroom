import { useState } from "react";

interface Review {
  id?: string;
  title: string;
  content: string;
  rating: number;
  listingId: string;
  userId: string;
}

export default function HandleSubmitReview(review: Review) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);
    const [listingId, setListingId] = useState('');
    const [userId, setUserId] = useState('');

    const handleSubmit = () => {
        const data = {
            title,
            content,
            rating,
            listingId,
            userId,
        };
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </form>
    )
}

