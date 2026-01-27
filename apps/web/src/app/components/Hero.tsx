export function Hero() {
  return (
    <div className="text-center py-16 px-6">
      <h1 
        className="text-5xl md:text-7xl mb-6 max-w-4xl mx-auto leading-tight"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Find the Best Restrooms Near You
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Read real reviews from real people. Make informed decisions about where to go when nature calls.
      </p>
      
      <div className="flex flex-wrap justify-center gap-8 mt-12 text-center">
        <div>
          <div 
            className="text-4xl mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--coral)' }}
          >
            10,000+
          </div>
          <p className="text-sm text-muted-foreground">Reviews</p>
        </div>
        <div>
          <div 
            className="text-4xl mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--coral)' }}
          >
            5,000+
          </div>
          <p className="text-sm text-muted-foreground">Locations</p>
        </div>
        <div>
          <div 
            className="text-4xl mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--coral)' }}
          >
            50+
          </div>
          <p className="text-sm text-muted-foreground">Cities</p>
        </div>
      </div>
    </div>
  );
}
