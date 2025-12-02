import { json, type LoaderFunctionArgs } from "@remix-run/node";

// Fetch location suggestions from Nominatim (OpenStreetMap) - free, no API key required
async function fetchLocationSuggestions(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Using Nominatim API (OpenStreetMap) - free geocoding service
    // Adding &accept-language=en to force English language output
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1&accept-language=en`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FindoTrip/1.0 (contact@findotrip.com)', // Required by Nominatim
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location suggestions');
    }

    const data = await response.json();
    
    // Format the suggestions
    return data.map((item: any) => {
      const address = item.address || {};
      const city = address.city || address.town || address.village || address.municipality || '';
      const state = address.state || address.region || '';
      const country = address.country || '';
      
      // Create a readable location string
      let locationName = '';
      if (city) {
        locationName = city;
        if (state) locationName += `, ${state}`;
        if (country) locationName += `, ${country}`;
      } else {
        locationName = item.display_name.split(',')[0]; // Use first part of display name
        if (country) locationName += `, ${country}`;
      }

      return {
        displayName: locationName || item.display_name,
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        importance: item.importance || 0,
      };
    }).sort((a: any, b: any) => b.importance - a.importance); // Sort by importance
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  
  const suggestions = await fetchLocationSuggestions(query);
  
  return json({ suggestions });
}

