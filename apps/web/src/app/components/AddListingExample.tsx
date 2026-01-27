/**
 * Example of how to integrate the AddListingPage component into your app
 * 
 * You can use this in two ways:
 * 
 * 1. As a standalone page (replace App.tsx content)
 * 2. As a route in your app with conditional rendering
 */

'use client'

import { useState } from "react";
import { AddListingPage } from "./AddListingPage";
import { Header } from "./Header";

// Example: Using it as a conditional view
export function AddListingExample() {
  const [currentView, setCurrentView] = useState<"home" | "add-listing">("home");

  if (currentView === "add-listing") {
    return <AddListingPage onBack={() => setCurrentView("home")} />;
  }

  // Your home page content
  return (
    <div className="min-h-screen">
      <Header
        onAddReview={() => setCurrentView("add-listing")}
        onAddListing={() => setCurrentView("add-listing")}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
          Browse Washrooms
        </h1>
        
        {/* Your washroom cards, etc. */}
        <button
          onClick={() => setCurrentView("add-listing")}
          className="px-6 py-3 rounded-full"
          style={{ backgroundColor: 'var(--coral)', color: 'white' }}
        >
          Add New Listing
        </button>
      </main>
    </div>
  );
}

// Example: Using it as the only page (simple standalone)
export function SimpleAddListingPage() {
  return (
    <div>
      {/* Optional: Add a simple header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Rate the Washroom
          </h1>
        </div>
      </div>
      
      {/* The main add listing component */}
      <AddListingPage onBack={() => {}} />
    </div>
  );
}
