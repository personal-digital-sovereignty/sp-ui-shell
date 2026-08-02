#!/bin/bash
echo "Building all modules for E2E Testing..."

for dir in ../sp-ui-*; do
    if [ "$dir" != "../sp-ui-shell" ] && [ "$dir" != "../sp-ui-core" ]; then
        echo "Building $dir..."
        (cd "$dir" && npm run build)
    fi
done


echo "Building sp-ui-shell..."
npm run build

echo "Consolidating assets for local preview..."
mkdir -p .svelte-kit/output/client/assets
for dir in ../sp-ui-*; do
    if [ "$dir" != "../sp-ui-shell" ]; then
        MFE_NAME=$(basename "$dir" | tr '-' '_')
        echo "Copying $MFE_NAME assets..."
        mkdir -p .svelte-kit/output/client/assets/$MFE_NAME
        cp -r "$dir/build/"* .svelte-kit/output/client/assets/$MFE_NAME/ || true
    fi
done

echo "Starting preview server..."
npm run preview -- --port 4173 > preview.log 2>&1 &
SERVER_PID=$!

echo "Waiting 5 seconds for preview server..."
sleep 5

echo "Running Playwright tests..."
npx playwright test tests/e2e/core.spec.ts

TEST_EXIT_CODE=$?

echo "Stopping preview server (PID $SERVER_PID)..."
kill -9 $SERVER_PID
pkill -f "vite preview" || true

exit $TEST_EXIT_CODE
