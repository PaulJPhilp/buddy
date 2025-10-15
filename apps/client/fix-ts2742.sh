#!/bin/bash
# Script to add React.ReactElement return types to icon components

# Fix icons.tsx - add `: React.ReactElement` to all export const functions
sed -i '' 's/export const \([A-Za-z]*Icon\) = (/export const \1 = (/' /Users/paul/Projects/buddy/packages/ui/src/components/ui/icons.tsx
sed -i '' 's/export const \([A-Za-z]*Icon\) = (/export const \1: React.FC = (/' /Users/paul/Projects/buddy/packages/ui/src/components/ui/icons.tsx

echo "Fixed icons.tsx"
