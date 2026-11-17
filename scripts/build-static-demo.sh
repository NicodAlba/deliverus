#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export API_BASE_URL=/deliverus
export EXPO_PUBLIC_STATIC_DEMO=true
export EXPO_PUBLIC_APP_ROOT=/deliverus

for role in Customer Owner; do
  folder="DeliverUS-Frontend-$role"
  prefix=$(printf '%s' "$role" | tr '[:upper:]' '[:lower:]')
  (
    cd "$folder"
    npm ci
    WEB_BASE_PATH="/deliverus/$prefix" npx expo export -p web --clear --max-workers 2
  )
  mkdir -p "docs/$prefix"
  # Remove old exported files to avoid retaining obsolete bundle hashes.
  find "docs/$prefix" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -R "$folder/dist/." "docs/$prefix/"
done
mkdir -p docs/demo-assets
cp DeliverUS-Backend/public/example_assets/* docs/demo-assets/
