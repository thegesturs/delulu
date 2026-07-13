#!/bin/bash

# Copy environment files from main repo to worktree
# Usage: ./scripts/copy-env.sh [source_repo_path]
# Default source: ../delulu

SOURCE="${1:-../delulu}"

if [ ! -d "$SOURCE" ]; then
  echo "Error: Source repo not found at $SOURCE"
  echo "Usage: ./scripts/copy-env.sh [source_repo_path]"
  exit 1
fi

echo "Copying env files from $SOURCE..."

# Copy .env* and .dev.vars files from each location
for dir in apps/app apps/api apps/web packages/worker packages/infrastructure; do
  if [ -d "$SOURCE/$dir" ]; then
    cp "$SOURCE/$dir"/.env* "./$dir/" 2>/dev/null && echo "  ✓ $dir/.env*"
    cp "$SOURCE/$dir"/.dev.vars "./$dir/" 2>/dev/null && echo "  ✓ $dir/.dev.vars"
  fi
done

# Copy root-level .vars and .dev.vars if they exist
cp "$SOURCE"/.dev.vars . 2>/dev/null && echo "  ✓ .dev.vars"
cp "$SOURCE"/*.vars . 2>/dev/null && echo "  ✓ *.vars"

echo "Done!"
