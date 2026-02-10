import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick: () => void;
}

export function SearchBar({ onSearch, onFilterClick }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by location, name, or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-4 py-6 rounded-2xl border-2 border-border bg-white text-base shadow-sm focus:border-primary transition-all"
          />
        </div>
        <button
          type="button"
          onClick={onFilterClick}
          className="px-6 py-3 rounded-2xl border-2 border-border bg-white hover:bg-secondary transition-all flex items-center gap-2"
        >
          <SlidersHorizontal className="size-5" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </form>
  );
}
