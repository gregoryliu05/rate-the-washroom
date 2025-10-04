import Header from '@/components/Header';
import RatingForm from '@/components/RatingForm';

export default function AddReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Share Your Washroom Experience
          </h1>
          <p className="text-lg text-gray-600">
            Help others by rating a washroom you've visited. Your review makes a difference!
          </p>
        </div>
        
        <RatingForm />
        
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Review Guidelines</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Be honest and constructive in your ratings</li>
            <li>• Include specific details about cleanliness and accessibility</li>
            <li>• Mention any amenities that were available or missing</li>
            <li>• Keep comments respectful and helpful to other users</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
