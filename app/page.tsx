"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { categories } from "@/data/categories";
import RestaurantCard from "@/components/RestaurantCard";

// Cycling accent set for the category rail — echoes striped market awnings
const ACCENTS = ["#B8481E", "#D8A312", "#5B6660"];

type CarouselImage = {
  id: number;
  image_url: string;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/restaurants`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        console.log("Restaurants API response:", result);

        // Your backend response:
        // {
        //   success: true,
        //   data: [...]
        // }

        if (!result.success) {
          throw new Error("API returned success: false");
        }

        const restaurantList = Array.isArray(result.data)
          ? result.data
          : [];

        // Never show a closed restaurant on the customer-facing home page,
        // even if the API forgets to filter it out server-side. `is_open`
        // defaults to "open" when the field is missing entirely, so only an
        // explicit false hides a restaurant here.
        const openRestaurants = restaurantList.filter(
          (r) => (r.is_open ?? r.isOpen) !== false
        );

        setRestaurants(openRestaurants);
      } catch (err) {
        console.error("Restaurant API error:", err);
        setError("Unable to load restaurants.");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  // Fetch the active carousel banners. Failures here are non-fatal — the
  // homepage is still fully usable without a banner, so we just hide the
  // section rather than showing an error state.
  useEffect(() => {
    async function fetchCarousel() {
      try {
        setCarouselLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/carousel`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("API returned success: false");
        }

        const images = Array.isArray(result.data) ? result.data : [];

        // Defensive filter/sort in case the API ever forgets to apply
        // is_active / sort_order server-side.
        const activeImages = images
          .filter((img: CarouselImage) => img.is_active !== false)
          .sort((a: CarouselImage, b: CarouselImage) => a.sort_order - b.sort_order);

        setCarouselImages(activeImages);
      } catch (err) {
        console.error("Carousel API error:", err);
        setCarouselImages([]);
      } finally {
        setCarouselLoading(false);
      }
    }

    fetchCarousel();
  }, []);

  // Autoplay — advance every 5s, pause/reset whenever the slide count changes.
  useEffect(() => {
    if (carouselImages.length <= 1) return;

    autoplayRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [carouselImages.length]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
    // Restart the autoplay timer so a manual click doesn't get immediately
    // overridden by an in-flight interval tick.
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (carouselImages.length > 1) {
      autoplayRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % carouselImages.length);
      }, 5000);
    }
  };

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      const name =
        restaurant.name?.toString().toLowerCase() || "";

      const cuisine =
        restaurant.cuisine?.toString().toLowerCase() || "";

      return (
        name.includes(q) ||
        cuisine.includes(q)
      );
    });
  }, [search, restaurants]);

  return (
    <div className="min-h-screen bg-[#F6F1E7]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap");
        .font-display {
          font-family: "Fraunces", serif;
          font-optical-sizing: auto;
        }
        .font-body {
          font-family: "Work Sans", sans-serif;
        }
        .font-data {
          font-family: "IBM Plex Mono", monospace;
        }
      `}</style>

      {/* Header band */}
      
<header className="bg-[#1C1B1A] font-body">
  <div className="max-w-5xl mx-auto px-4 pt-10 pb-8">
    <div className="flex items-baseline gap-2">
      <span className="w-2 h-2 rounded-full bg-[#B8481E]" />
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9C4B8]">
        On the high street
      </p>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F6F1E7] mt-2">
          SavourHighStreet
        </h1>

        <p className="text-sm text-[#9C978A] mt-1">
          Order from the kitchens on your doorstep.
        </p>
      </div>

      {/* Contact & Social Links */}
      <div className="flex items-center gap-2">
        {/* WhatsApp */}
        <a
          href="https://wa.me/919999999999"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex items-center gap-2 bg-[#26241F] border border-[#3A3730] text-[#F6F1E7] hover:border-[#B8481E] hover:bg-[#302D27] rounded-md px-3 py-2 text-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.2 1.6 6L.1 24l6.3-1.7c1.7.9 3.7 1.4 5.7 1.4h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.3-6.1-3.6-8.3ZM12.1 21.7c-1.8 0-3.5-.5-5-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.3C2.3 6.5 6.7 2.1 12.1 2.1c2.6 0 5.1 1 6.9 2.8 1.8 1.8 2.8 4.3 2.8 6.9 0 5.5-4.4 9.9-9.7 9.9Zm5.4-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.7.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.2 3.2c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.7.9 3.7.8.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z" />
          </svg>
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* Instagram */}
        <a
          href="https://instagram.com/savourhighstreet"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="flex items-center gap-2 bg-[#26241F] border border-[#3A3730] text-[#F6F1E7] hover:border-[#B8481E] hover:bg-[#302D27] rounded-md px-3 py-2 text-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span className="hidden sm:inline">Instagram</span>
        </a>

        {/* Call */}
        <a
          href="tel:+919999999999"
          aria-label="Call us"
          className="flex items-center gap-2 bg-[#B8481E] text-[#F6F1E7] hover:bg-[#A43F19] rounded-md px-3 py-2 text-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22 16.92v3a2 2 0 0 1-2.18 2
              19.79 19.79 0 0 1-8.63-3.07
              19.5 19.5 0 0 1-6-6
              A19.79 19.79 0 0 1 2.12 4.18
              2 2 0 0 1 4.11 2h3
              a2 2 0 0 1 2 1.72
              12.84 12.84 0 0 0 .7 2.81
              2 2 0 0 1-.45 2.11L8.09 9.91
              a16 16 0 0 0 6 6l1.27-1.27
              a2 2 0 0 1 2.11-.45
              12.84 12.84 0 0 0 2.81.7
              A2 2 0 0 1 22 16.92Z"
            />
          </svg>
          <span className="hidden sm:inline">Call</span>
        </a>
      </div>
    </div>

    {/* Search */}
    <div className="max-w-md mt-6 relative">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C978A]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0Z"
        />
      </svg>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search restaurants or cuisines"
        className="w-full bg-[#26241F] text-[#F6F1E7] placeholder:text-[#8A8578] rounded-md pl-10 pr-4 py-3 text-sm outline-none border border-[#3A3730] focus:border-[#B8481E] transition-colors"
      />
    </div>
  </div>
</header>


      <div className="max-w-5xl mx-auto px-4 py-8 font-body">
        {/* Carousel banner */}
        {carouselLoading && (
          <section className="mb-10">
            <div className="w-full h-40 sm:h-56 rounded-lg bg-[#EDE7D9] animate-pulse" />
          </section>
        )}

        {!carouselLoading && carouselImages.length > 0 && (
          <section className="mb-10">
            <div className="relative w-full h-40 sm:h-56 rounded-lg overflow-hidden border border-[#E7E1D3] shadow-sm">
              {carouselImages.map((image, index) => {
                const slide = (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.image_url}
                    alt={image.title || "Promotional banner"}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      index === activeSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  />
                );

                return (
                  <div key={image.id} className="absolute inset-0">
                    {image.link_url ? (
                      <a
                        href={image.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full"
                      >
                        {slide}
                      </a>
                    ) : (
                      slide
                    )}

                    {image.title && index === activeSlide && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                        <p className="font-display text-sm sm:text-base text-white font-semibold">
                          {image.title}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dots */}
              {carouselImages.length > 1 && (
                <div className="absolute bottom-2 right-3 flex gap-1.5">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => goToSlide(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === activeSlide
                          ? "bg-white w-4"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-[#1C1B1A] mb-3">
            Shop by category
          </h2>

          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/restaurants?category=${encodeURIComponent(
                  cat.name
                )}`}
                className="flex-shrink-0 bg-white rounded-md px-4 py-2 text-sm text-[#1C1B1A] border-t-[3px] border-x border-b border-[#E7E1D3] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                style={{ borderTopColor: ACCENTS[i % ACCENTS.length] }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Restaurants */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#1C1B1A]">
                Restaurants near you
              </h2>
              {!loading && !error && (
                <p className="font-data text-xs text-[#8A8578] mt-0.5">
                  {filteredRestaurants.length}{" "}
                  {filteredRestaurants.length === 1 ? "spot" : "spots"} open
                </p>
              )}
            </div>

            <Link
              href="/restaurants"
              className="text-sm font-medium text-[#B8481E] hover:text-[#8f3717] transition-colors"
            >
              View all →
            </Link>
          </div>

          {/* Loading — skeleton cards instead of a bare message */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#E7E1D3] bg-white overflow-hidden animate-pulse"
                >
                  <div className="h-32 bg-[#EDE7D9]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3.5 w-3/4 bg-[#EDE7D9] rounded" />
                    <div className="h-3 w-1/2 bg-[#EDE7D9] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-10 px-6 text-center bg-white rounded-lg border border-[#E7E1D3]">
              <p className="font-display text-base text-[#1C1B1A] mb-1">
                Something didn't load
              </p>
              <p className="text-sm text-[#8A8578] mb-4">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#B8481E] text-white rounded-md text-sm font-medium hover:bg-[#8f3717] transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            filteredRestaurants.length === 0 && (
              <div className="py-10 text-center bg-white rounded-lg border border-dashed border-[#E7E1D3]">
                <p className="font-display text-base text-[#1C1B1A] mb-1">
                  {search ? "No matches on the high street" : "Nothing here yet"}
                </p>
                <p className="text-sm text-[#8A8578]">
                  {search
                    ? "Try a different name or cuisine."
                    : "Check back soon for new openings."}
                </p>
              </div>
            )}

          {/* Restaurants */}
          {!loading &&
            !error &&
            filteredRestaurants.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            )}
        </section>
      </div>




      
    </div>
  );
}