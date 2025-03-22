# ExpertConnect Platform - Comprehensive Deployment Guide

This guide provides detailed, step-by-step instructions for deploying the ExpertConnect platform. It covers both local deployment and AWS cloud deployment options.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Deployment](#local-deployment)
   - [Database Setup](#database-setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Running the Application](#running-the-application)
3. [AWS Cloud Deployment](#aws-cloud-deployment)
   - [AWS Account Setup](#aws-account-setup)
   - [Deploying with CloudFormation](#deploying-with-cloudformation)
   - [Manual AWS Deployment](#manual-aws-deployment)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Verification Steps](#verification-steps)

## Prerequisites

Before deploying the ExpertConnect platform, ensure you have the following:

### For Local Deployment

- **Git**: To clone the repository
- **Docker and Docker Compose**: For containerized deployment
- **Python 3.10+**: For backend development
- **Node.js 16+**: For frontend development
- **PostgreSQL 13+**: For the database (if not using Docker)

### For AWS Deployment

- **AWS Account**: With administrative privileges
- **AWS CLI**: Installed and configured with your credentials
- **Git**: To clone the repository
- **Docker**: For building container images

## Local Deployment

### Database Setup

#### Option 1: Using Docker (Recommended)

The easiest way to set up the database is using Docker:

1. Ensure Docker is installed and running
2. The database will be automatically created when you run the application with Docker Compose

#### Option 2: Manual PostgreSQL Setup

If you prefer to run PostgreSQL directly on your machine:

1. Install PostgreSQL:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (using Homebrew)
   brew install postgresql

   # Windows
   # Download and run the installer from https://www.postgresql.org/download/windows/
   ```

2. Start PostgreSQL service:
   ```bash
   # Ubuntu/Debian
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # macOS
   brew services start postgresql

   # Windows
   # PostgreSQL is installed as a service and should start automatically
   ```

3. Create a database and user:
   ```bash
   # Log in as postgres user
   sudo -u postgres psql

   # In PostgreSQL prompt
   CREATE DATABASE expertconnect;
   CREATE USER expertconnect_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE expertconnect TO expertconnect_user;
   \q
   ```

4. Update the `.env` file with your database credentials:
   ```
   DB_NAME=expertconnect
   DB_USER=expertconnect_user
   DB_PASSWORD=your_secure_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/expertconnect.git
   cd expertconnect
   ```

2. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your specific configuration values

#### Option 1: Using Docker (Recommended)

If using Docker, the backend will be set up automatically when you run the application.

#### Option 2: Manual Setup

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

5. Collect static files:
   ```bash
   python manage.py collectstatic
   ```

### Frontend Setup

#### Option 1: Using Docker (Recommended)

If using Docker, the frontend will be set up automatically when you run the application.

#### Option 2: Manual Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env.local` file:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
   echo "NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws" >> .env.local
   ```

### Running the Application

#### Option 1: Using Docker Compose (Recommended)

1. Start all services:
   ```bash
   docker-compose up -d
   ```

2. Check if containers are running:
   ```bash
   docker-compose ps
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin interface: http://localhost:8000/admin/

#### Option 2: Running Services Manually

1. Start the backend:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python manage.py runserver
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin interface: http://localhost:8000/admin/

## AWS Cloud Deployment

### AWS Account Setup

1. Create an AWS account if you don't have one: https://aws.amazon.com/
2. Install the AWS CLI: https://aws.amazon.com/cli/
3. Configure AWS CLI with your credentials:
   ```bash
   aws configure
   ```
   You'll need to provide:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., us-east-1)
   - Default output format (json recommended)

### Deploying with CloudFormation

The easiest way to deploy to AWS is using our automated CloudFormation template:

1. Make the deployment script executable:
   ```bash
   chmod +x aws/deploy-aws.sh
   ```

2. Run the deployment script:
   ```bash
   ./aws/deploy-aws.sh
   ```

3. The script will:
   - Create ECR repositories for backend and frontend
   - Build and push Docker images
   - Generate secure passwords and keys
   - Deploy the CloudFormation stack with all necessary resources
   - Save deployment information to `aws/deployment-info.txt`

4. Wait for the deployment to complete (this may take 15-20 minutes)

5. Access your application using the CloudFront URL provided in the deployment information

### Manual AWS Deployment

If you prefer more control over the deployment process:

1. Create ECR repositories:
   ```bash
   aws ecr create-repository --repository-name expertconnect-backend
   aws ecr create-repository --repository-name expertconnect-frontend
   ```

2. Build and push Docker images:
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push backend
   cd backend
   docker build -t expertconnect-backend:latest .
   docker tag expertconnect-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   cd ..
   
   # Build and push frontend
   cd frontend
   docker build -t expertconnect-frontend:latest .
   docker tag expertconnect-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-frontend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-frontend:latest
   cd ..
   ```

3. Create an RDS PostgreSQL database:
   ```bash
   # Create a security group for the database
   DB_SG_ID=$(aws ec2 create-security-group --group-name expertconnect-db-sg --description "Security group for ExpertConnect database" --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text) --output text --query "GroupId")
   
   # Allow PostgreSQL traffic from anywhere (for development only - restrict this in production)
   aws ec2 authorize-security-group-ingress --group-id $DB_SG_ID --protocol tcp --port 5432 --cidr 0.0.0.0/0
   
   # Create the database
   aws rds create-db-instance \
       --db-instance-identifier expertconnect-db \
       --db-instance-class db.t3.micro \
       --engine postgres \
       --master-username expertconnect \
       --master-user-password your_secure_password \
       --allocated-storage 20 \
       --vpc-security-group-ids $DB_SG_ID \
       --db-name expertconnect
   ```

4. Create an ECS cluster:
   ```bash
   aws ecs create-cluster --cluster-name expertconnect-cluster
   ```

5. Create task definitions and services for backend and frontend

6. Set up a load balancer and target groups

7. Create a CloudFront distribution

For detailed manual deployment steps, refer to the AWS documentation for each service.

## Post-Deployment Configuration

After deploying the application, perform these additional configuration steps:

### 1. Initial Data Setup

1. Access the admin interface:
   - Local: http://localhost:8000/admin/
   - AWS: https://[your-cloudfront-domain]/admin/

2. Log in with the superuser credentials

3. Create initial categories:
   - Navigate to Categories > Add Category
   - Add categories like "Software Development", "Legal Advice", "Career Coaching", etc.

### 2. Email Configuration

Configure email settings in the `.env` file:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
EMAIL_USE_TLS=True
```

For AWS deployment, update these settings in the ECS task definition.

### 3. Payment Integration (Optional)

To enable credit purchases:

1. Sign up for a payment processor (e.g., Stripe)
2. Add your API keys to the `.env` file:
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

## Verification Steps

After deployment, verify that your application is working correctly:

### 1. User Registration and Login

1. Visit the application URL
2. Click "Sign Up" and create a new account
3. Verify you receive a confirmation email (if configured)
4. Log in with your new account
5. Verify you receive the initial free credit

### 2. Admin Access

1. Visit the admin URL
2. Log in with superuser credentials
3. Verify you can access all admin sections

### 3. Expert Profile Creation

1. Log in to your account
2. Navigate to Profile
3. Add skills and set availability
4. Verify your profile appears in expert searches

### 4. Meeting Scheduling

1. Create a second test account
2. From one account, request a meeting with the other account
3. Confirm the meeting from the other account
4. Verify the meeting appears in both accounts' dashboards

### 5. Video Conferencing

1. When it's time for the meeting, join from both accounts
2. Verify video and audio connections work
3. Test screen sharing functionality

### 6. Credit System

1. Verify the initial credit was received
2. Test credit transfer during a meeting
3. Test credit purchase functionality (if configured)

If any of these verification steps fail, refer to the troubleshooting guide.
