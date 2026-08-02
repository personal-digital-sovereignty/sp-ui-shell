#!/bin/bash
echo "Starting chat and shell DEV servers..."
npx concurrently "cd ../sp-ui-chat && npm run dev" "npm run dev" > dev-servers.log 2>&1 &
SERVER_PID=$!

echo "Waiting 10 seconds for servers to start..."
sleep 10

echo "Running Playwright test for Loads the Shell OS layout successfully..."
npx playwright test tests/e2e/core.spec.ts -g "Loads the Shell OS layout successfully"

TEST_EXIT_CODE=$?

echo "Stopping DEV servers (PID $SERVER_PID)..."
kill -9 $SERVER_PID
pkill -f "vite" || true

exit $TEST_EXIT_CODE
