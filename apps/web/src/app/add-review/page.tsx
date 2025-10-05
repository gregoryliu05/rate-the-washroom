'use client';

import Navbar from "../components/navbar";
import { useState } from "react";

function AddReview() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const reviewData = {
            title,
            content,
            rating,
            listingId: '', // TODO: Get from context or props
            userId: '' // TODO: Get from auth context
        };
        console.log('Submitting review:', reviewData);
        // TODO: Call API to create review
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold">Add Review</h1>
            </div>
            <div id="navbar" className="py-4 w-full h-full flex justify-center items-center">
                <Navbar />
            </div>
            {/* Main section: block layout for simple centering */}
            <main className="flex-1 pt-8">
                {/* Centered, responsive form */}
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-2/3 max-w-2xl mx-auto px-4">
                    <input
                        type="text"
                        placeholder="Review Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                    <textarea
                        placeholder="Write your review..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Overall Rating (1-5)"
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value) || 0)}
                        min="1"
                        max="5"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                    <div className="flex space-x-4 w-full">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                        >
                            Add Review
                        </button>
                        <button
                            type="button"
                            className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default AddReview;
