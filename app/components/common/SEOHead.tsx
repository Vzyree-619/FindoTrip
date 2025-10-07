import { MetaFunction } from "@remix-run/node";

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  price?: {
    amount: string;
    currency: string;
  };
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  rating?: {
    value: number;
    count: number;
  };
}

export function generateMeta({
  title = "FindoTrip - Your Ultimate Travel Companion",
  description = "Discover amazing accommodations, rent cars, and book experienced tour guides for your perfect trip. Plan your adventure with FindoTrip.",
  keywords = "travel, accommodation, hotels, car rental, tour guides, vacation, booking, trip planning",
  image = "/FindoTripLogo.png",
  url = "https://findotrip.com",
  type = "website",
  siteName = "FindoTrip",
  locale = "en_US",
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  price,
  availability,
  rating
}: SEOData = {}): ReturnType<MetaFunction> {
  const meta: ReturnType<MetaFunction> = [
    // Basic Meta Tags
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "author", content: author || "FindoTrip Team" },
    { name: "robots", content: "index, follow" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    
    // Open Graph Tags
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: siteName },
    { property: "og:locale", content: locale },
    
    // Twitter Card Tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:site", content: "@FindoTrip" },
    { name: "twitter:creator", content: "@FindoTrip" },
    
    // Additional Meta Tags
    { name: "theme-color", content: "#01502E" },
    { name: "msapplication-TileColor", content: "#01502E" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    { name: "apple-mobile-web-app-title", content: siteName },
  ];

  // Add article-specific meta tags
  if (type === "article") {
    if (author) meta.push({ property: "article:author", content: author });
    if (publishedTime) meta.push({ property: "article:published_time", content: publishedTime });
    if (modifiedTime) meta.push({ property: "article:modified_time", content: modifiedTime });
    if (section) meta.push({ property: "article:section", content: section });
    if (tags) {
      tags.forEach(tag => meta.push({ property: "article:tag", content: tag }));
    }
  }

  // Add product-specific meta tags
  if (type === "product") {
    if (price) {
      meta.push({ property: "product:price:amount", content: price.amount });
      meta.push({ property: "product:price:currency", content: price.currency });
    }
    if (availability) {
      meta.push({ property: "product:availability", content: availability });
    }
  }

  // Add rating meta tags
  if (rating) {
    meta.push({ property: "og:rating", content: rating.value.toString() });
    meta.push({ property: "og:rating_count", content: rating.count.toString() });
  }

  return meta;
}

// Structured Data Generator
export function generateStructuredData(data: {
  type: 'Organization' | 'LocalBusiness' | 'Product' | 'Article' | 'BreadcrumbList' | 'FAQPage';
  [key: string]: any;
}) {
  const baseStructure = {
    "@context": "https://schema.org",
    "@type": data.type,
    ...data
  };

  return JSON.stringify(baseStructure);
}

// Common structured data templates
export const structuredDataTemplates = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FindoTrip",
    "url": "https://findotrip.com",
    "logo": "https://findotrip.com/FindoTripLogo.png",
    "description": "Your ultimate travel companion for accommodations, car rentals, and tour guides",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+92-XXX-XXXXXXX",
      "contactType": "customer service",
      "email": "support@findotrip.com"
    },
    "sameAs": [
      "https://facebook.com/findotrip",
      "https://twitter.com/findotrip",
      "https://instagram.com/findotrip"
    ]
  },

  accommodation: (accommodation: any) => ({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": accommodation.name,
    "description": accommodation.description,
    "image": accommodation.images,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": accommodation.address,
      "addressLocality": accommodation.city,
      "addressCountry": accommodation.country
    },
    "geo": accommodation.latitude && accommodation.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": accommodation.latitude,
      "longitude": accommodation.longitude
    } : undefined,
    "priceRange": `$${accommodation.pricePerNight}`,
    "aggregateRating": accommodation.reviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": accommodation.rating,
      "reviewCount": accommodation.reviewCount
    } : undefined,
    "amenityFeature": accommodation.amenities?.map((amenity: string) => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    }))
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
};

// Component for injecting structured data
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  );
}
