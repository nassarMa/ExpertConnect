# ExpertConnect Platform - Quick Start Guide

This quick start guide provides the essential steps to get the ExpertConnect platform up and running quickly. For more detailed information, refer to the comprehensive documentation in the `/docs` directory.

## Local Deployment (Docker)

### Prerequisites
- Docker and Docker Compose installed
- Git installed

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/expertconnect.git
   cd expertconnect
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Create an admin user**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Admin interface: http://localhost:8000/admin/

## AWS Deployment

### Prerequisites
- AWS CLI installed and configured
- Docker installed

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/expertconnect.git
   cd expertconnect
   ```

2. **Make the deployment script executable**
   ```bash
   chmod +x aws/deploy-aws.sh
   ```

3. **Run the deployment script**
   ```bash
   ./aws/deploy-aws.sh
   ```

4. **Wait for deployment to complete** (15-20 minutes)

5. **Get the application URL**
   ```bash
   cat aws/deployment-info.txt
   ```

6. **Access the application** using the CloudFront URL from the deployment info

## Initial Configuration

After deployment, complete these essential setup steps:

1. **Log in to the admin interface** using your superuser credentials

2. **Create initial categories**
   - Navigate to Categories > Add Category
   - Add categories like "Software Development", "Legal Advice", etc.

3. **Test user registration**
   - Register a new user account
   - Verify you receive the initial free credit

4. **Create expert profiles**
   - Update your profile with skills and availability
   - Test the search functionality

## Common Issues

- **Database connection errors**: Check database credentials in `.env` file
- **Container startup failures**: Check logs with `docker-compose logs`
- **AWS deployment failures**: Check CloudFormation events in AWS Console
- **Missing static files**: Run `python manage.py collectstatic`

For more detailed troubleshooting, refer to the [Troubleshooting Guide](TROUBLESHOOTING.md).

## Next Steps

- Configure email settings for notifications
- Set up payment integration for credit purchases
- Add custom branding
- Configure monitoring and backups

For complete documentation, see:
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Database Setup](DATABASE_SETUP.md)
- [Application Startup](APPLICATION_STARTUP.md)
- [Troubleshooting](TROUBLESHOOTING.md)
