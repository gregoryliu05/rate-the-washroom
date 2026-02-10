import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "../../context/authContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface HeaderProps {
  onAddReview: (washroomId?: string) => void;
  onAddListing: () => void;
}

export function Header({ onAddReview, onAddListing }: HeaderProps) {
  const { user, signOut } = useAuth();
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--coral)' }}>
              <span className="text-white text-xl">🚽</span>
            </div>
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Rate the Washroom
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm hover:text-muted-foreground transition-colors">
              Browse
            </a>
            <a href="#" className="text-sm hover:text-muted-foreground transition-colors">
              Top Rated
            </a>
            <a href="#" className="text-sm hover:text-muted-foreground transition-colors">
              About
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => onAddReview()}
              variant="outline"
              className="rounded-full"
            >
              Add Review
            </Button>
            <Button
              onClick={onAddListing}
              variant="outline"
              className="rounded-full whitespace-nowrap"
            >
              <Plus className="size-5 mr-2" />
              Add Washroom
            </Button>
            {user ? (
              <>
                <Button
                  onClick={signOut}
                  variant="outline"
                  className="rounded-full"
                >
                  Sign Out
                </Button>
                <Link
                  href="/profile"
                  className="rounded-full border border-border bg-card p-1 hover:bg-secondary transition-colors"
                  aria-label="Open profile"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={user.photoURL || undefined} alt="Profile photo" />
                    <AvatarFallback>
                      {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
