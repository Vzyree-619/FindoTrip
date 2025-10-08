/**
 * Centralized path configuration for the application
 * This file contains all the path mappings for imports
 */

// Component paths
export const PATHS = {
  // Common components
  COMMON: {
    ERROR_BOUNDARY: '~/components/common/ErrorBoundary',
    LAZY_IMAGE: '~/components/common/LazyImage',
    LOADING_STATES: '~/components/common/LoadingStates',
    SEO_HEAD: '~/components/common/SEOHead',
    DOCUMENT_UPLOAD: '~/components/common/DocumentUpload',
    MODAL: '~/components/common/util/Modal',
    ERROR: '~/components/common/util/Error',
    LOGO: '~/components/common/util/Logo',
  },

  // Layout components
  LAYOUT: {
    FOOTER: '~/components/layout/Footer',
    NAVBAR: '~/components/layout/navigation/NavBar',
    NAVBAR_WITH_AUTH: '~/components/layout/navigation/NavBarWithAuth',
    MAIN_HEADER: '~/components/layout/navigation/MainHeader',
    MOBILE_NAV: '~/components/layout/MobileNavigation',
  },

  // Forms
  FORMS: {
    AUTH: '~/components/forms/auth/AuthForm',
  },

  // Feature components
  FEATURES: {
    HOME: {
      ADD_PAGE: '~/components/features/home/AddPage',
      CAR_RENTAL_SCROLL: '~/components/features/home/CarRentalScroll',
      FAQ: '~/components/features/home/Faq',
      INPUT_FORM: '~/components/features/home/InputForm',
      REGISTER: '~/components/features/home/Register',
      STAYS: '~/components/features/home/Stays',
      SUBSCRIPTION: '~/components/features/home/SubscriptionForm',
      TOUR_PACKAGES: '~/components/features/home/TourPackages',
    },
    ACCOMMODATIONS: {
      PRICING: '~/components/features/accommodations/Priceing',
      PROPERTY_CARD: '~/components/features/accommodations/PropertyCard',
    },
    ROOMS: {
      APARTMENTS: '~/components/features/rooms/Apartments',
      FAQ: '~/components/features/rooms/Faq',
      GUEST_ROOMS: '~/components/features/rooms/GuestRooms',
      HOME_PAGE: '~/components/features/rooms/HomePage',
      ATTRACTIONS: '~/components/features/rooms/PopularAttractions',
    },
    TOURS: {
      LANDING: '~/components/features/tours/Landing',
      OTHER_TOURS: '~/components/features/tours/OtherTours',
      TOUR_SECTION: '~/components/features/tours/TourSection',
    },
    BLOG: {
      ADD_PAGE: '~/components/features/blog/AddPage',
      BLOG_SECTION: '~/components/features/blog/BlogSection',
      LANDING: '~/components/features/blog/Landing',
    },
    VEHICLES: {
      CARS_PAGE: '~/components/features/vehicles/carsPage',
      LANDING: '~/components/features/vehicles/landing',
    },
    ADMIN: {
      COMMENTS: '~/components/features/admin/comments',
      GUEST_REVIEW: '~/components/features/admin/guestReview',
      TRAVELER: '~/components/features/admin/traveler',
    },
    MARKETING: {
      PRICING_PLAN: '~/components/features/marketing/PricingPlan',
    },
    EXPENSES: {
      CHART_BAR: '~/components/features/expenses/ChartBar',
      EXPENSE_FORM: '~/components/features/expenses/ExpenseForm',
      EXPENSE_LIST_ITEM: '~/components/features/expenses/ExpenseListItem',
      EXPENSES_LIST: '~/components/features/expenses/ExpensesList',
    },
  },

  // Library paths
  LIB: {
    AUTH: {
      STRATEGIES: '~/lib/auth/auth-strategies.server',
      SERVER: '~/lib/auth/auth.server',
      AUTH_JS: '~/lib/auth/auth.server.js',
    },
    DB: {
      SERVER: '~/lib/db/db.server',
      DATABASE: '~/lib/db/database.server',
    },
    VALIDATIONS: {
      SERVER: '~/lib/validations/validation.server',
      VALIDATION_JS: '~/lib/validations/validation.server.js',
      INPUT: '~/lib/validations/input.server',
    },
    EMAIL: {
      SERVER: '~/lib/email/email.server',
    },
  },

  // Contexts
  CONTEXTS: {
    BOOKING: '~/contexts/BookingContext',
  },

  // Hooks
  HOOKS: {
    ACCESSIBILITY: '~/hooks/useAccessibility',
    NETWORK: '~/hooks/useNetwork',
  },

  // Styles
  STYLES: {
    SHARED: '~/styles/shared.css',
    EXPENSES: '~/styles/expenses.css',
    MARKETING: '~/styles/marketing.css',
  },
} as const;

export default PATHS;

