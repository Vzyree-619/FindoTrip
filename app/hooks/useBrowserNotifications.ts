import { useEffect, useRef, useState } from "react";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    // Load notification sound
    try {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = 0.5;
    } catch {}
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const showNotification = (title: string, options?: NotificationOptions & { playSound?: boolean }) => {
    if (!("Notification" in window) || permission !== "granted") return;
    if (document.visibilityState === "visible" && document.hasFocus()) return; // Don't show if app is focused

    const notification = new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });

    // Play sound if enabled
    if (soundEnabled && options?.playSound !== false && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } catch {}
    }

    return notification;
  };

  return {
    permission,
    soundEnabled,
    setSoundEnabled,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
}
