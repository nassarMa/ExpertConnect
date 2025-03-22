#!/bin/bash

# Script to run tests for ExpertConnect platform

# Run backend tests
echo "Running backend tests..."
cd backend
source venv/bin/activate
pytest ../tests/backend/

# Run frontend tests
echo "Running frontend tests..."
cd ../frontend
npm test

echo "All tests completed!"
