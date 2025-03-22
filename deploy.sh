#!/bin/bash

# Deploy script for ExpertConnect platform

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one based on .env.example"
    exit 1
fi

# Build and start containers
echo "Building and starting containers..."
docker-compose build
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser if it doesn't exist..."
docker-compose exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin_password')
    print('Superuser created successfully');
else:
    print('Superuser already exists');
"

# Collect static files
echo "Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

echo "Deployment completed successfully!"
echo "Backend API is available at: http://localhost:8000/api/"
echo "Frontend is available at: http://localhost:3000/"
echo "Admin interface is available at: http://localhost:8000/admin/"
