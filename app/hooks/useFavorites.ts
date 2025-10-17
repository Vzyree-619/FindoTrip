import { useState, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';

interface FavoritesData {
  properties: string[];
  vehicles: string[];
  tours: string[];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritesData>({
    properties: [],
    vehicles: [],
    tours: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch('/dashboard/favorites');
        if (response.ok) {
          const data = await response.json();
          setFavorites({
            properties: data.favorites?.properties?.map((p: any) => p.id) || [],
            vehicles: data.favorites?.vehicles?.map((v: any) => v.id) || [],
            tours: data.favorites?.tours?.map((t: any) => t.id) || []
          });
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const toggleFavorite = async (serviceType: 'property' | 'vehicle' | 'tour', serviceId: string) => {
    const currentFavorites = favorites[`${serviceType}s` as keyof FavoritesData];
    const isCurrentlyFavorite = currentFavorites.includes(serviceId);
    const newFavoriteState = !isCurrentlyFavorite;

    // Optimistically update UI
    setFavorites(prev => ({
      ...prev,
      [`${serviceType}s`]: newFavoriteState 
        ? [...currentFavorites, serviceId]
        : currentFavorites.filter(id => id !== serviceId)
    }));

    // Call the API
    try {
      const response = await fetch('/api/wishlist-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType,
          serviceId,
          action: newFavoriteState ? 'add' : 'remove'
        })
      });

      if (!response.ok) {
        // Revert state if API call failed
        setFavorites(prev => ({
          ...prev,
          [`${serviceType}s`]: isCurrentlyFavorite 
            ? [...currentFavorites, serviceId]
            : currentFavorites.filter(id => id !== serviceId)
        }));
        throw new Error('Failed to update favorites');
      }
    } catch (error) {
      // Revert state if API call failed
      setFavorites(prev => ({
        ...prev,
        [`${serviceType}s`]: isCurrentlyFavorite 
          ? [...currentFavorites, serviceId]
          : currentFavorites.filter(id => id !== serviceId)
      }));
      console.error('Error updating favorites:', error);
    }
  };

  const isFavorite = (serviceType: 'property' | 'vehicle' | 'tour', serviceId: string) => {
    return favorites[`${serviceType}s` as keyof FavoritesData].includes(serviceId);
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite
  };
}
