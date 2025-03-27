# AWS Deployment Guide for ExpertConnect

This document provides comprehensive instructions for deploying the ExpertConnect platform on AWS infrastructure.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed (for containerized deployment)
- Domain name (optional but recommended for production)

## Architecture Overview

The ExpertConnect platform will be deployed using the following AWS services:

- **Amazon EC2** or **ECS/Fargate**: For hosting the application containers
- **Amazon RDS (PostgreSQL)**: For the database
- **Amazon S3**: For static file storage
- **Amazon CloudFront**: For CDN (optional but recommended)
- **Amazon Route 53**: For DNS management (if using a custom domain)
- **AWS Elastic Load Balancer**: For load balancing
- **Amazon ElastiCache**: For Redis caching (optional)
- **AWS Certificate Manager**: For SSL certificates

## Deployment Steps

### 1. Database Setup (RDS)

1. Log in to the AWS Management Console
2. Navigate to RDS service
3. Click "Create database"
4. Select PostgreSQL as the engine
5. Choose appropriate settings:
   - DB instance identifier: `expertconnect-db`
   - Master username: `expertconnect_user` (use a strong password)
   - DB instance class: Select based on expected load (start with `db.t3.small` for testing)
   - Storage: Start with 20GB with autoscaling enabled
   - Multi-AZ deployment: Enable for production
   - VPC: Create new or use existing
   - Security group: Create new or use existing (ensure it allows connections from your application servers)
6. Create database
7. Note the endpoint, port, username, and password for configuration

### 2. S3 Bucket for Static Files

1. Navigate to S3 service
2. Create a new bucket:
   - Name: `expertconnect-static`
   - Region: Same as your RDS instance
   - Block all public access: Disable (we'll use CloudFront for secure access)
3. Enable versioning (optional)
4. Create bucket
5. Set up bucket policy to allow CloudFront access

### 3. CloudFront Distribution (Optional)

1. Navigate to CloudFront service
2. Create a new distribution:
   - Origin domain: Your S3 bucket
   - Origin access: Use Origin Access Identity
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Cache policy: Managed-CachingOptimized
3. Create distribution
4. Note the distribution domain name

### 4. Environment Configuration

Create a `.env.production` file with the following variables:

```
# Database
DB_NAME=expertconnect
DB_USER=expertconnect_user
DB_PASSWORD=your_strong_password
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=expertconnect-static
AWS_S3_REGION_NAME=your_region

# Security
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-load-balancer-domain.amazonaws.com

# Payment
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=live

# Email
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_HOST_USER=your_email_user
EMAIL_HOST_PASSWORD=your_email_password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

### 5. Containerization with Docker

Create a production Dockerfile:

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install production dependencies
RUN pip install gunicorn psycopg2-binary

# Copy project
COPY backend/ .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "expertconnect.wsgi:application"]
```

Create a docker-compose.yml file for local testing:

```yaml
version: '3'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env.production
    depends_on:
      - db
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env.production

  db:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - .env.production

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### 6. Frontend Build

Create a production build of the frontend:

```bash
cd frontend
npm install
npm run build
```

### 7. EC2 Instance Setup

1. Navigate to EC2 service
2. Launch a new instance:
   - AMI: Amazon Linux 2
   - Instance type: t2.micro (for testing) or larger for production
   - Configure security group to allow HTTP (80), HTTPS (443), and SSH (22)
   - Add storage: At least 20GB
3. Launch instance and connect via SSH
4. Install Docker and Docker Compose:
   ```bash
   sudo yum update -y
   sudo amazon-linux-extras install docker
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
5. Clone your repository and set up environment:
   ```bash
   git clone https://github.com/nassarMa/ExpertConnect.git
   cd ExpertConnect
   # Copy your .env.production file here
   ```
6. Build and run the containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### 8. Load Balancer Setup (Optional)

1. Navigate to EC2 > Load Balancers
2. Create an Application Load Balancer:
   - Name: expertconnect-alb
   - Scheme: internet-facing
   - IP address type: ipv4
   - Listeners: HTTP (80), HTTPS (443)
   - Availability Zones: Select at least two
3. Configure security settings with your SSL certificate
4. Configure security groups to allow HTTP and HTTPS traffic
5. Configure routing to your EC2 instances
6. Create load balancer

### 9. Auto Scaling Group (Optional)

1. Create a launch template based on your EC2 configuration
2. Navigate to EC2 > Auto Scaling Groups
3. Create an Auto Scaling group:
   - Name: expertconnect-asg
   - Launch template: Your template
   - VPC and subnets: Same as your load balancer
   - Load balancer: Attach to your ALB
   - Group size: Min 2, Desired 2, Max 4 (adjust based on needs)
   - Scaling policies: Target tracking with CPU utilization at 70%

### 10. DNS Configuration (Optional)

1. Navigate to Route 53
2. Create a hosted zone for your domain
3. Create an A record pointing to your load balancer or CloudFront distribution
4. Update your domain registrar's nameservers to point to Route 53

### 11. Database Migration

Run migrations on your production database:

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 12. Create Superuser

Create an admin user for the production environment:

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 13. Monitoring and Logging

1. Set up CloudWatch for monitoring:
   - Create alarms for CPU, memory, and disk usage
   - Set up log groups for application logs
2. Configure your application to send logs to CloudWatch

### 14. Backup Strategy

1. Enable automated RDS backups
2. Set up S3 lifecycle policies for static files
3. Consider using AWS Backup for comprehensive backup solutions

## Security Considerations

1. **Network Security**:
   - Use security groups to restrict access
   - Implement a Web Application Firewall (WAF)
   - Use VPC for network isolation

2. **Data Security**:
   - Encrypt data at rest (RDS and S3)
   - Encrypt data in transit (HTTPS)
   - Implement proper IAM roles and policies

3. **Application Security**:
   - Keep dependencies updated
   - Implement rate limiting
   - Use secure headers
   - Regularly scan for vulnerabilities

## Scaling Considerations

1. **Vertical Scaling**:
   - Upgrade EC2 instance types
   - Increase RDS instance class

2. **Horizontal Scaling**:
   - Add more EC2 instances through Auto Scaling
   - Consider using RDS read replicas
   - Implement caching with ElastiCache

## Troubleshooting

1. **Database Connection Issues**:
   - Check security group rules
   - Verify credentials in environment variables
   - Check network connectivity

2. **Application Errors**:
   - Check application logs in CloudWatch
   - Verify environment variables
   - Check for recent code changes

3. **Performance Issues**:
   - Monitor CloudWatch metrics
   - Check for database query performance
   - Consider adding caching

## Maintenance

1. **Regular Updates**:
   - Schedule regular maintenance windows
   - Keep OS and dependencies updated
   - Apply security patches promptly

2. **Database Maintenance**:
   - Monitor database performance
   - Schedule regular backups
   - Perform vacuum operations

3. **Scaling Adjustments**:
   - Regularly review performance metrics
   - Adjust scaling policies as needed
   - Optimize for cost and performance

## Cost Optimization

1. **Right-sizing**:
   - Use appropriate instance sizes
   - Scale down during low-traffic periods

2. **Reserved Instances**:
   - Purchase reserved instances for predictable workloads

3. **Storage Optimization**:
   - Use S3 lifecycle policies
   - Monitor and clean up unused resources

## Conclusion

This deployment guide provides a comprehensive approach to deploying the ExpertConnect platform on AWS. By following these steps, you'll have a scalable, secure, and reliable infrastructure for your application.

For any questions or issues, please contact the development team.
