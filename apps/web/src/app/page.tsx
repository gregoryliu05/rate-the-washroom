import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find the Best Washrooms Near You
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover, rate, and review washrooms in your area. Help others find clean, accessible facilities.
          </p>
          <SearchBar />
        </div>

        {/* Call to Action */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Help Others Find Great Washrooms</h2>
          <p className="text-blue-100 mb-6">
            Share your experience and help build a comprehensive database of washroom locations.
          </p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Add a Review
          </button>
        </div>
      </main>
    </div>
  );
}
