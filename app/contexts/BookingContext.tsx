import { createContext, useContext, useState, ReactNode } from "react";

export interface BookingData {
  // Property & Room
  propertyId: string;
  propertyName: string;
  roomType?: string;
  roomPrice?: number;
  
  // Dates & Guests
  checkIn: Date;
  checkOut: Date;
  guests: number;
  
  // Guest Details
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  arrivalTime?: string;
  
  // Pricing
  subtotal?: number;
  taxes?: number;
  fees?: number;
  total?: number;
}

interface BookingContextType {
  bookingData: BookingData | null;
  setBookingData: (data: BookingData | null) => void;
  updateBookingData: (data: Partial<BookingData>) => void;
  clearBookingData: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => (prev ? { ...prev, ...data } : null));
  };

  const clearBookingData = () => {
    setBookingData(null);
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        setBookingData,
        updateBookingData,
        clearBookingData,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
