'use client';
import { useState } from 'react';
import { MapPage } from './components/MapPage';
import { AddReviewPage } from './components/AddReviewPage';
import { AddListingPage } from './components/AddListingPage';

type Page = "map" | "add-review" | "add-listing";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("map");
  const [prefillReviewWashroomId, setPrefillReviewWashroomId] = useState<string | undefined>(undefined);
  const [listingReturnPage, setListingReturnPage] = useState<Page>("map");

  // Simple router
  if (currentPage === "add-review") {
    return (
      <AddReviewPage
        prefillWashroomId={prefillReviewWashroomId}
        onBack={() => {
          setCurrentPage("map");
          setPrefillReviewWashroomId(undefined);
        }}
        onAddWashroom={() => {
          setListingReturnPage("add-review");
          setCurrentPage("add-listing");
        }}
      />
    );
  }

  if (currentPage === "add-listing") {
    return (
      <AddListingPage
        onBack={() => setCurrentPage(listingReturnPage)}
        onCreated={(washroomId) => {
          if (listingReturnPage === "add-review") {
            setPrefillReviewWashroomId(washroomId);
            setCurrentPage("add-review");
            return;
          }
          setCurrentPage("map");
        }}
      />
    );
  }

  return (
    <MapPage
      onAddReview={(washroomId) => {
        setPrefillReviewWashroomId(washroomId);
        setCurrentPage("add-review");
      }}
      onAddListing={() => {
        setListingReturnPage("map");
        setCurrentPage("add-listing");
      }}
    />
  );
}
