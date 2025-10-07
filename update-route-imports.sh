#!/bin/bash

# Script to update route file imports

echo "Updating route imports..."

# Update all route files to use new paths
find app/routes -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's|from "\~/data/auth\.server"|from "~/lib/auth/auth.server.js"|g' \
  -e 's|from "\~/data/database\.server"|from "~/lib/db/database.server"|g' \
  -e 's|from "\~/data/validation\.server"|from "~/lib/validations/validation.server.js"|g' \
  -e 's|from "\~/data/input\.server"|from "~/lib/validations/input.server"|g' \
  -e 's|from "\.\.\/data/auth\.server"|from "~/lib/auth/auth.server.js"|g' \
  -e 's|from "\.\.\/data/database\.server"|from "~/lib/db/database.server"|g' \
  -e 's|from "\.\.\/data/validation\.server"|from "~/lib/validations/validation.server.js"|g' \
  -e 's|from "\.\.\/data/input\.server"|from "~/lib/validations/input.server"|g' \
  {} \;

echo "Route imports updated!"

