import { useState, useEffect } from "react";

interface NetworkState {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useNetwork(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  });

  useEffect(() => {
    const updateNetworkState = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      setNetworkState({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      });
    };

    // Initial state
    updateNetworkState();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkState);
    }

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
      if (connection) {
        connection.removeEventListener('change', updateNetworkState);
      }
    };
  }, []);

  return networkState;
}

// Hook for managing offline data and sync
export function useOfflineSync() {
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const { isOnline } = useNetwork();

  const addPendingAction = (action: any) => {
    setPendingActions(prev => [...prev, { ...action, timestamp: Date.now() }]);
  };

  const clearPendingActions = () => {
    setPendingActions([]);
  };

  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      // Process pending actions when back online
      pendingActions.forEach(async (action) => {
        try {
          // Process the action (implement based on your needs)
          console.log('Processing pending action:', action);
        } catch (error) {
          console.error('Failed to process pending action:', error);
        }
      });
      clearPendingActions();
    }
  }, [isOnline, pendingActions]);

  return {
    addPendingAction,
    clearPendingActions,
    pendingActionsCount: pendingActions.length,
    isOnline
  };
}

// Hook for image optimization based on network
export function useImageOptimization() {
  const { effectiveType, saveData } = useNetwork();

  const getOptimizedImageUrl = (baseUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}) => {
    // Adjust quality based on network conditions
    let quality = options.quality || 80;
    
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      quality = Math.min(quality, 50);
    } else if (effectiveType === '3g') {
      quality = Math.min(quality, 70);
    }

    // In a real implementation, you'd integrate with an image optimization service
    // like Cloudinary, ImageKit, or your own service
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    params.set('q', quality.toString());

    return `${baseUrl}?${params.toString()}`;
  };

  const shouldLoadImages = !saveData && effectiveType !== 'slow-2g';

  return {
    getOptimizedImageUrl,
    shouldLoadImages,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g',
    saveData: saveData || false
  };
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
  }>({});

  useEffect(() => {
    // Measure page load time
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - 
                      window.performance.timing.navigationStart;
      
      setMetrics(prev => ({ ...prev, loadTime }));

      // Measure memory usage (if available)
      if ((performance as any).memory) {
        const memoryUsage = (performance as any).memory.usedJSHeapSize;
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    }

    // Measure render time using Performance Observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            setMetrics(prev => ({ 
              ...prev, 
              renderTime: entry.duration 
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => observer.disconnect();
    }
  }, []);

  const measureRender = (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
      
      return () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      };
    }
    return () => {};
  };

  return { metrics, measureRender };
}
