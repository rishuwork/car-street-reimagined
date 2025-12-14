import { useState, useEffect, useRef, TouchEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Gauge } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { motion, AnimatePresence } from "framer-motion";

type VehicleWithImage = Tables<"vehicles"> & {
  primaryImage?: string;
};

interface FeaturedVehiclesCarouselProps {
  vehicles: VehicleWithImage[];
}

export default function FeaturedVehiclesCarousel({ vehicles }: FeaturedVehiclesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [isMobile, setIsMobile] = useState(false);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Update items per page based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(1);
        setIsMobile(true);
      } else {
        setItemsPerPage(3);
        setIsMobile(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset index when items per page changes to avoid out of bounds
  useEffect(() => {
    const maxIndex = Math.max(0, vehicles.length - itemsPerPage);
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [itemsPerPage, vehicles.length, currentIndex]);

  const maxIndex = Math.max(0, vehicles.length - itemsPerPage);
  const showNavigation = vehicles.length > itemsPerPage;

  // Touch handlers for smooth swipe
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      isDragging.current = false;
      return;
    }

    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentIndex < maxIndex) {
        // Swipe left - next
        setDirection(1);
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous
        setDirection(-1);
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    isDragging.current = false;
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const visibleVehicles = vehicles.slice(currentIndex, currentIndex + itemsPerPage);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No featured vehicles available at this time.</p>
        <p className="text-sm mt-2">Check back soon for our latest offerings!</p>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Arrows - Hidden on mobile */}
      {showNavigation && !isMobile && (
        <>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-10 bg-background border border-border rounded-full p-2 shadow-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous vehicles"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-10 bg-background border border-border rounded-full p-2 shadow-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next vehicles"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Vehicles Grid with Animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {visibleVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              <div className="relative overflow-hidden aspect-[4/3]">
                <OptimizedImage
                  src={vehicle.primaryImage || "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop"}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-heading font-bold mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <div className="mb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-price">${vehicle.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">+ HST & licensing</p>
                </div>
                <Button variant="default" className="w-full" asChild>
                  <Link to={`/vehicle/${vehicle.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      {showNavigation && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
