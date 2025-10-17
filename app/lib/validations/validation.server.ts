import { z } from "zod";

// ============================================================================
// User Validation Schemas
// ============================================================================

export const userRoleSchema = z.enum([
  "CUSTOMER",
  "CAR_PROVIDER",
  "TOUR_GUIDE",
  "ADMIN",
]);

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: userRoleSchema.default("CUSTOMER"),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ============================================================================
// Accommodation Validation Schemas
// ============================================================================

export const accommodationTypeSchema = z.enum([
  "HOTEL",
  "APARTMENT",
  "VILLA",
  "LODGE",
  "HOSTEL",
  "RESORT",
]);

export const createAccommodationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: accommodationTypeSchema,
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  pricePerNight: z.number().positive("Price must be greater than 0"),
  maxGuests: z.number().int().positive("Must have at least 1 guest capacity"),
  bedrooms: z.number().int().nonnegative("Bedrooms cannot be negative"),
  bathrooms: z.number().int().nonnegative("Bathrooms cannot be negative"),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  amenities: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

export const updateAccommodationSchema = createAccommodationSchema.partial();

export const accommodationSearchSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  type: accommodationTypeSchema.optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  guests: z.number().int().positive().optional(),
  checkIn: z.date().optional(),
  checkOut: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
});

// ============================================================================
// Car Validation Schemas
// ============================================================================

export const createCarSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.string().min(2, "Car type is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  pricePerDay: z.number().positive("Price must be greater than 0"),
  seats: z.number().int().positive("Must have at least 1 seat"),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "SEMI_AUTOMATIC"]),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  features: z.array(z.string()).default([]),
  location: z.string().min(2, "Location is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  licensePlate: z.string().min(3, "License plate is required"),
  insuranceExpiry: z.date(),
  available: z.boolean().default(true),
});

export const updateCarSchema = createCarSchema.partial();

// ============================================================================
// Tour Guide Validation Schemas
// ============================================================================

export const createTourGuideSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  specialties: z.array(z.string()).default([]),
  experience: z.number().int().nonnegative("Experience cannot be negative"),
  pricePerHour: z.number().positive("Price must be greater than 0"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  certifications: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

export const updateTourGuideSchema = createTourGuideSchema.partial();

// ============================================================================
// Booking Validation Schemas
// ============================================================================

export const bookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const createBookingSchema = z.object({
  checkIn: z.date(),
  checkOut: z.date(),
  guests: z.number().int().positive("Must have at least 1 guest"),
  totalPrice: z.number().positive("Total price must be greater than 0"),
  accommodationId: z.string().optional(),
  carId: z.string().optional(),
  tourGuideId: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
}).refine(
  (data) => data.accommodationId || data.carId || data.tourGuideId,
  { message: "At least one booking type (accommodation, car, or tour guide) is required" }
).refine(
  (data) => data.checkOut > data.checkIn,
  { message: "Check-out date must be after check-in date" }
);

export const updateBookingSchema = z.object({
  status: bookingStatusSchema.optional(),
  specialRequests: z.string().max(500).optional(),
});

// ============================================================================
// Review Validation Schemas
// ============================================================================

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment cannot exceed 1000 characters"),
  accommodationId: z.string().optional(),
  carId: z.string().optional(),
  tourGuideId: z.string().optional(),
}).refine(
  (data) => data.accommodationId || data.carId || data.tourGuideId,
  { message: "Review must be for an accommodation, car, or tour guide" }
);

// ============================================================================
// Payment Validation Schemas
// ============================================================================

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("PKR"),
  method: z.enum(["CARD", "PAYPAL", "BANK_TRANSFER", "CASH"]),
  transactionId: z.string().min(5, "Transaction ID is required"),
});

// ============================================================================
// Helper Functions
// ============================================================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { 
      success: false, 
      errors: { general: "Validation failed" } 
    };
  }
}

// Export type helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccommodationInput = z.infer<typeof createAccommodationSchema>;
export type UpdateAccommodationInput = z.infer<typeof updateAccommodationSchema>;
export type AccommodationSearchInput = z.infer<typeof accommodationSearchSchema>;
export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type CreateTourGuideInput = z.infer<typeof createTourGuideSchema>;
export type UpdateTourGuideInput = z.infer<typeof updateTourGuideSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
