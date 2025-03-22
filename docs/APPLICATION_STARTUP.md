# ExpertConnect Platform - Application Startup Guide

This guide provides detailed instructions for starting and running the ExpertConnect platform after deployment. It covers both local and AWS deployment scenarios.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Application Startup](#local-application-startup)
   - [Using Docker Compose](#using-docker-compose)
   - [Manual Startup](#manual-startup)
3. [AWS Deployment Startup](#aws-deployment-startup)
4. [First-Time Setup](#first-time-setup)
5. [Monitoring the Application](#monitoring-the-application)
6. [Stopping and Restarting](#stopping-and-restarting)
7. [Common Startup Issues](#common-startup-issues)

## Prerequisites

Before starting the ExpertConnect platform, ensure you have:

- Completed the deployment process (refer to the [Deployment Guide](DEPLOYMENT_GUIDE.md))
- Set up the database (refer to the [Database Setup Guide](DATABASE_SETUP.md))
- Configured environment variables in the `.env` file

## Local Application Startup

### Using Docker Compose

The recommended way to start the application locally is using Docker Compose:

1. Navigate to the project directory:
   ```bash
   cd ExpertConnect
   ```

2. Ensure your `.env` file is properly configured:
   ```bash
   # Check if .env exists
   ls -la .env
   
   # If it doesn't exist, create it from the example
   cp .env.example .env
   
   # Edit the .env file with your configuration
   nano .env
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Check if all containers are running:
   ```bash
   docker-compose ps
   ```
   
   You should see containers for:
   - `db` (PostgreSQL database)
   - `backend` (Django API)
   - `frontend` (Next.js frontend)
   - `redis` (for WebSockets and caching)

5. View logs to ensure everything started correctly:
   ```bash
   # View all logs
   docker-compose logs
   
   # View specific service logs
   docker-compose logs backend
   docker-compose logs frontend
   
   # Follow logs in real-time
   docker-compose logs -f
   ```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin interface: http://localhost:8000/admin/

### Manual Startup

If you prefer to run services directly on your machine:

1. Start the database (if not using Docker):
   ```bash
   # For Ubuntu/Debian
   sudo systemctl start postgresql
   
   # For macOS
   brew services start postgresql
   
   # For Windows
   # PostgreSQL should be running as a service
   ```

2. Start Redis (required for WebSockets):
   ```bash
   # For Ubuntu/Debian
   sudo systemctl start redis-server
   
   # For macOS
   brew services start redis
   
   # For Windows
   # Start Redis using the Redis server executable
   ```

3. Start the backend:
   ```bash
   cd backend
   
   # Activate virtual environment
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Run the development server
   python manage.py runserver
   
   # For production, use Gunicorn
   gunicorn expertconnect.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```

4. In a new terminal, start the frontend:
   ```bash
   cd frontend
   
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm run start
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin interface: http://localhost:8000/admin/

## AWS Deployment Startup

If you've deployed the application to AWS using our CloudFormation template, the application starts automatically. Here's how to verify and manage it:

1. Check the ECS service status:
   ```bash
   # Check backend service
   aws ecs describe-services \
       --cluster expertconnect-prod-cluster \
       --services expertconnect-prod-backend \
       --query "services[0].status" \
       --output text
   
   # Check frontend service
   aws ecs describe-services \
       --cluster expertconnect-prod-cluster \
       --services expertconnect-prod-frontend \
       --query "services[0].status" \
       --output text
   ```
   
   Both services should show `ACTIVE` status.

2. Check if tasks are running:
   ```bash
   # List backend tasks
   aws ecs list-tasks \
       --cluster expertconnect-prod-cluster \
       --service-name expertconnect-prod-backend
   
   # List frontend tasks
   aws ecs list-tasks \
       --cluster expertconnect-prod-cluster \
       --service-name expertconnect-prod-frontend
   ```
   
   You should see task ARNs listed for both services.

3. Access the application:
   ```bash
   # Get the CloudFront URL
   aws cloudformation describe-stacks \
       --stack-name expertconnect-prod \
       --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
       --output text
   ```
   
   Open this URL in your browser to access the application.

## First-Time Setup

After starting the application for the first time, complete these setup steps:

### 1. Create Admin User

If you haven't created a superuser during deployment:

```bash
# For Docker Compose
docker-compose exec backend python manage.py createsuperuser

# For manual deployment
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python manage.py createsuperuser

# For AWS ECS
TASK_ARN=$(aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend --query "taskArns[0]" --output text)
aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "python manage.py createsuperuser"
```

Follow the prompts to create an admin username, email, and password.

### 2. Configure Initial Categories

1. Log in to the admin interface:
   - Local: http://localhost:8000/admin/
   - AWS: https://[your-cloudfront-domain]/admin/

2. Navigate to "Categories" and add initial categories:
   - Software Development
   - Legal Advice
   - Financial Consulting
   - Career Coaching
   - Marketing Strategy
   - Health and Wellness
   - Education and Tutoring

### 3. Set Up Email Configuration

For email notifications to work properly:

1. Update the `.env` file with SMTP settings:
   ```
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your_email@example.com
   EMAIL_HOST_PASSWORD=your_email_password
   EMAIL_USE_TLS=True
   DEFAULT_FROM_EMAIL=ExpertConnect <noreply@expertconnect.com>
   ```

2. Restart the application to apply changes:
   ```bash
   # For Docker Compose
   docker-compose restart backend
   
   # For manual deployment
   # Restart the backend server
   
   # For AWS ECS
   aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-backend --force-new-deployment
   ```

### 4. Test the Platform

1. Register a new user account
2. Verify you receive the welcome email
3. Check that you received the initial free credit
4. Create a profile with skills and availability
5. Test the search functionality

## Monitoring the Application

### Local Monitoring

1. View Docker container logs:
   ```bash
   docker-compose logs -f
   ```

2. Check container resource usage:
   ```bash
   docker stats
   ```

3. Monitor database connections:
   ```bash
   # Connect to PostgreSQL
   psql -U expertconnect_user -h localhost expertconnect
   
   # In PostgreSQL prompt
   SELECT count(*) FROM pg_stat_activity;
   ```

### AWS Monitoring

1. View CloudWatch logs:
   ```bash
   # Get the backend log group
   LOG_GROUP="/ecs/expertconnect-prod-backend"
   
   # Get the most recent log stream
   LOG_STREAM=$(aws logs describe-log-streams --log-group-name $LOG_GROUP --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text)
   
   # View recent logs
   aws logs get-log-events --log-group-name $LOG_GROUP --log-stream-name $LOG_STREAM --limit 20
   ```

2. Set up CloudWatch alarms:
   ```bash
   # Create a CPU utilization alarm
   aws cloudwatch put-metric-alarm \
       --alarm-name expertconnect-backend-cpu-high \
       --alarm-description "Alarm when CPU exceeds 80%" \
       --metric-name CPUUtilization \
       --namespace AWS/ECS \
       --statistic Average \
       --period 300 \
       --threshold 80 \
       --comparison-operator GreaterThanThreshold \
       --dimensions Name=ClusterName,Value=expertconnect-prod-cluster Name=ServiceName,Value=expertconnect-prod-backend \
       --evaluation-periods 2 \
       --alarm-actions arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):expertconnect-alarms
   ```

3. Monitor ECS service metrics in the AWS Console:
   - Navigate to ECS > Clusters > expertconnect-prod-cluster
   - Select the service you want to monitor
   - View the "Metrics" tab

## Stopping and Restarting

### Local Environment

1. Stop all containers:
   ```bash
   docker-compose down
   ```

2. Stop specific services:
   ```bash
   docker-compose stop backend
   docker-compose stop frontend
   ```

3. Restart all containers:
   ```bash
   docker-compose restart
   ```

4. Start after stopping:
   ```bash
   docker-compose up -d
   ```

### AWS Environment

1. Stop a service (set desired count to 0):
   ```bash
   aws ecs update-service \
       --cluster expertconnect-prod-cluster \
       --service expertconnect-prod-backend \
       --desired-count 0
   ```

2. Restart a service:
   ```bash
   # First, set desired count back to normal
   aws ecs update-service \
       --cluster expertconnect-prod-cluster \
       --service expertconnect-prod-backend \
       --desired-count 1
   
   # Then force a new deployment
   aws ecs update-service \
       --cluster expertconnect-prod-cluster \
       --service expertconnect-prod-backend \
       --force-new-deployment
   ```

## Common Startup Issues

### Database Connection Issues

**Symptoms**: Backend fails to start with database connection errors

**Solutions**:

1. Check database credentials in `.env` file
2. Verify the database is running:
   ```bash
   # For Docker
   docker-compose ps db
   
   # For local PostgreSQL
   sudo systemctl status postgresql
   
   # For AWS RDS
   aws rds describe-db-instances --db-instance-identifier expertconnect-db --query "DBInstances[0].DBInstanceStatus" --output text
   ```

3. Check network connectivity:
   ```bash
   # For local database
   telnet localhost 5432
   
   # For RDS
   telnet your-db-endpoint.rds.amazonaws.com 5432
   ```

### Redis Connection Issues

**Symptoms**: WebSockets don't work, real-time features fail

**Solutions**:

1. Check Redis connection settings in `.env` file
2. Verify Redis is running:
   ```bash
   # For Docker
   docker-compose ps redis
   
   # For local Redis
   redis-cli ping  # Should return PONG
   ```

### Static Files Not Found

**Symptoms**: CSS/JS not loading, images missing

**Solutions**:

1. Check if static files were collected:
   ```bash
   # For Docker
   docker-compose exec backend python manage.py collectstatic --dry-run
   
   # For manual deployment
   cd backend
   source venv/bin/activate
   python manage.py collectstatic
   ```

2. Verify static file settings in Django settings.py
3. For AWS, check S3 bucket contents:
   ```bash
   aws s3 ls s3://$(aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs[?OutputKey=='StaticFilesBucketName'].OutputValue" --output text)/
   ```

### Port Already in Use

**Symptoms**: Service fails to start with "port already in use" error

**Solutions**:

1. Find the process using the port:
   ```bash
   # For port 8000 (backend)
   sudo lsof -i :8000
   
   # For port 3000 (frontend)
   sudo lsof -i :3000
   ```

2. Kill the process:
   ```bash
   sudo kill -9 <PID>
   ```

3. Try starting the service again

### AWS ECS Task Failures

**Symptoms**: ECS tasks keep stopping and restarting

**Solutions**:

1. Check task logs in CloudWatch
2. Verify environment variables in task definition
3. Check container resource limits (CPU/memory)
4. Ensure the container's health check is passing

### CloudFront Access Issues

**Symptoms**: Cannot access application through CloudFront URL

**Solutions**:

1. Check CloudFront distribution status:
   ```bash
   aws cloudfront get-distribution --id $(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='expertconnect-prod'].Id" --output text)
   ```

2. Verify origin settings point to the correct ALB
3. Check if the ALB is healthy:
   ```bash
   aws elbv2 describe-target-health --target-group-arn $(aws elbv2 describe-target-groups --query "TargetGroups[?contains(TargetGroupName, 'expertconnect')].TargetGroupArn" --output text)
   ```

4. If recently deployed, wait 15-20 minutes for CloudFront propagation
