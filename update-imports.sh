#!/bin/bash

# Script to update all import paths after restructuring

echo "Updating import paths..."

# Update component imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\.\.\/components\/ErrorBoundary"|from "~/components/common/ErrorBoundary"|g' \
  -e 's|from "\.\.\/\.\.\/components\/ErrorBoundary"|from "~/components/common/ErrorBoundary"|g' \
  -e 's|from "\~\/components\/ErrorBoundary"|from "~/components/common/ErrorBoundary"|g' \
  -e 's|from "\.\.\/components\/LazyImage"|from "~/components/common/LazyImage"|g' \
  -e 's|from "\.\.\/components\/LoadingStates"|from "~/components/common/LoadingStates"|g' \
  -e 's|from "\.\.\/components\/SEOHead"|from "~/components/common/SEOHead"|g' \
  -e 's|from "\.\.\/components\/DocumentUpload"|from "~/components/common/DocumentUpload"|g' \
  -e 's|from "\.\.\/components\/Footer"|from "~/components/layout/Footer"|g' \
  -e 's|from "\.\.\/\.\.\/components\/Footer"|from "~/components/layout/Footer"|g' \
  -e 's|from "\~\/components\/Footer"|from "~/components/layout/Footer"|g' \
  -e 's|from "\.\.\/components\/navigation\/NavBar"|from "~/components/layout/navigation/NavBar"|g' \
  -e 's|from "\.\.\/\.\.\/components\/navigation\/NavBar"|from "~/components/layout/navigation/NavBar"|g' \
  -e 's|from "\~\/components\/navigation\/NavBar"|from "~/components/layout/navigation/NavBar"|g' \
  -e 's|from "\.\.\/components\/navigation\/NavBarWithAuth"|from "~/components/layout/navigation/NavBarWithAuth"|g' \
  -e 's|from "\.\.\/\.\.\/components\/navigation\/NavBarWithAuth"|from "~/components/layout/navigation/NavBarWithAuth"|g' \
  -e 's|from "\~\/components\/navigation\/NavBarWithAuth"|from "~/components/layout/navigation/NavBarWithAuth"|g' \
  -e 's|from "\.\.\/components\/navigation\/MainHeader"|from "~/components/layout/navigation/MainHeader"|g' \
  -e 's|from "\.\.\/components\/MobileNavigation"|from "~/components/layout/MobileNavigation"|g' \
  -e 's|from "\~\/components\/MobileNavigation"|from "~/components/layout/MobileNavigation"|g' \
  -e 's|from "\.\.\/components\/util\/Modal"|from "~/components/common/util/Modal"|g' \
  -e 's|from "\.\.\/\.\.\/components\/util\/Modal"|from "~/components/common/util/Modal"|g' \
  -e 's|from "\~\/components\/util\/Modal"|from "~/components/common/util/Modal"|g' \
  -e 's|from "\.\.\/components\/util\/Error"|from "~/components/common/util/Error"|g' \
  -e 's|from "\.\.\/components\/util\/Logo"|from "~/components/common/util/Logo"|g' \
  {} \;

# Update auth imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\~\/lib\/auth\.server"|from "~/lib/auth/auth.server"|g' \
  -e 's|from "\~\/lib\/auth-strategies\.server"|from "~/lib/auth/auth-strategies.server"|g' \
  -e 's|from "\.\.\/lib\/auth\.server"|from "~/lib/auth/auth.server"|g' \
  -e 's|from "\.\.\/\.\.\/lib\/auth\.server"|from "~/lib/auth/auth.server"|g' \
  {} \;

# Update db imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\~\/lib\/db\.server"|from "~/lib/db/db.server"|g' \
  -e 's|from "\.\.\/lib\/db\.server"|from "~/lib/db/db.server"|g' \
  {} \;

# Update validation imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\~\/lib\/validation\.server"|from "~/lib/validations/validation.server"|g' \
  -e 's|from "\.\.\/lib\/validation\.server"|from "~/lib/validations/validation.server"|g' \
  {} \;

# Update email imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\~\/lib\/email\.server"|from "~/lib/email/email.server"|g' \
  -e 's|from "\.\.\/lib\/email\.server"|from "~/lib/email/email.server"|g' \
  {} \;

# Update home page component imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\.\.\/components\/HomePage\/|from "~/components/features/home/|g' \
  -e 's|from "\.\.\/\.\.\/components\/HomePage\/|from "~/components/features/home/|g' \
  -e 's|from "\~\/components\/HomePage\/|from "~/components/features/home/|g' \
  {} \;

# Update other feature imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\.\.\/components\/hotelPages\/|from "~/components/features/accommodations/|g' \
  -e 's|from "\.\.\/\.\.\/components\/hotelPages\/|from "~/components/features/accommodations/|g' \
  -e 's|from "\~\/components\/hotelPages\/|from "~/components/features/accommodations/|g' \
  -e 's|from "\.\.\/components\/RoomPages\/|from "~/components/features/rooms/|g' \
  -e 's|from "\.\.\/\.\.\/components\/RoomPages\/|from "~/components/features/rooms/|g' \
  -e 's|from "\~\/components\/RoomPages\/|from "~/components/features/rooms/|g' \
  -e 's|from "\.\.\/components\/tours\/|from "~/components/features/tours/|g' \
  -e 's|from "\.\.\/\.\.\/components\/tours\/|from "~/components/features/tours/|g' \
  -e 's|from "\~\/components\/tours\/|from "~/components/features/tours/|g' \
  -e 's|from "\.\.\/components\/Blogs\/|from "~/components/features/blog/|g' \
  -e 's|from "\.\.\/\.\.\/components\/Blogs\/|from "~/components/features/blog/|g' \
  -e 's|from "\~\/components\/Blogs\/|from "~/components/features/blog/|g' \
  -e 's|from "\.\.\/components\/carRent\/|from "~/components/features/vehicles/|g' \
  -e 's|from "\.\.\/\.\.\/components\/carRent\/|from "~/components/features/vehicles/|g' \
  -e 's|from "\~\/components\/carRent\/|from "~/components/features/vehicles/|g' \
  -e 's|from "\.\.\/components\/adminPages\/|from "~/components/features/admin/|g' \
  -e 's|from "\.\.\/\.\.\/components\/adminPages\/|from "~/components/features/admin/|g' \
  -e 's|from "\~\/components\/adminPages\/|from "~/components/features/admin/|g' \
  -e 's|from "\.\.\/components\/marketing\/|from "~/components/features/marketing/|g' \
  -e 's|from "\~\/components\/marketing\/|from "~/components/features/marketing/|g' \
  -e 's|from "\.\.\/components\/expenses\/|from "~/components/features/expenses/|g' \
  -e 's|from "\~\/components\/expenses\/|from "~/components/features/expenses/|g' \
  {} \;

# Update auth form imports
find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\.\.\/components\/auth\/|from "~/components/forms/auth/|g' \
  -e 's|from "\.\.\/\.\.\/components\/auth\/|from "~/components/forms/auth/|g' \
  -e 's|from "\~\/components\/auth\/|from "~/components/forms/auth/|g' \
  {} \;

echo "Import paths updated successfully!"

