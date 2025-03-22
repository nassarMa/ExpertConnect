# ExpertConnect - Installation Guide

This guide provides detailed instructions for installing and running the ExpertConnect platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- Docker and Docker Compose
- Git
- Node.js (for local development)
- Python 3.10+ (for local development)

## Installation Options

### Option 1: Docker Installation (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/expertconnect.git
   cd expertconnect
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```
   
3. Edit the `.env` file with your specific configuration values.

4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin interface: http://localhost:8000/admin/ (username: admin, password: admin_password)

### Option 2: Manual Installation

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the database:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Configuration

The `.env` file contains all necessary configuration for the application. Here's what each setting means:

### Database Configuration
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host (use "db" for Docker setup)
- `DB_PORT`: Database port (usually 5432)

### Django Settings
- `DEBUG`: Set to "False" in production
- `SECRET_KEY`: Django secret key (change this to a secure random string)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

### Email Configuration
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_HOST_USER`: Email username
- `EMAIL_HOST_PASSWORD`: Email password
- `EMAIL_USE_TLS`: Whether to use TLS (True/False)

### AWS S3 for File Storage (Optional)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_STORAGE_BUCKET_NAME`: S3 bucket name

### Frontend Settings
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_WEBSOCKET_URL`: WebSocket URL for real-time features

## Troubleshooting

### Common Issues

1. **Docker Compose Errors**
   - Ensure Docker and Docker Compose are installed and running
   - Check if ports 3000 and 8000 are available

2. **Database Connection Issues**
   - Verify database credentials in `.env` file
   - Check if PostgreSQL is running

3. **Frontend Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for JavaScript errors in the console

4. **Backend Migration Errors**
   - Try resetting migrations: `python manage.py migrate --fake-initial`

## Running Tests

Use the provided test script:

```bash
./run_tests.sh
```

Or run tests manually:

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest ../tests/backend/

# Frontend tests
cd frontend
npm test
```

## Deployment to Production

For production deployment, additional steps are recommended:

1. Use a proper web server like Nginx as a reverse proxy
2. Set up SSL certificates for HTTPS
3. Configure proper database backups
4. Set up monitoring and logging
5. Use a production-ready PostgreSQL setup with proper tuning

A sample Nginx configuration for production:

```nginx
server {
    listen 80;
    server_name expertconnect.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name expertconnect.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
