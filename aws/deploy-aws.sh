#!/bin/bash

# AWS Deployment Script for ExpertConnect Platform
# This script automates the deployment of the ExpertConnect platform to AWS

set -e

# Configuration
AWS_REGION="us-east-1"
ENVIRONMENT_NAME="prod"
STACK_NAME="expertconnect-${ENVIRONMENT_NAME}"
ECR_BACKEND_REPO="expertconnect-backend"
ECR_FRONTEND_REPO="expertconnect-frontend"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Create ECR repositories if they don't exist
create_ecr_repo() {
    local repo_name=$1
    if ! aws ecr describe-repositories --repository-names ${repo_name} --region ${AWS_REGION} &> /dev/null; then
        echo "Creating ECR repository: ${repo_name}"
        aws ecr create-repository --repository-name ${repo_name} --region ${AWS_REGION}
    else
        echo "ECR repository ${repo_name} already exists"
    fi
}

create_ecr_repo ${ECR_BACKEND_REPO}
create_ecr_repo ${ECR_FRONTEND_REPO}

# Get ECR login token
echo "Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push Docker images
echo "Building and pushing backend Docker image..."
cd backend
docker buildx build --platform linux/amd64 -t ${ECR_BACKEND_REPO}:latest .
docker tag ${ECR_BACKEND_REPO}:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest
cd ..

echo "Building and pushing frontend Docker image..."
cd frontend
docker buildx build --platform linux/amd64 -t ${ECR_FRONTEND_REPO}:latest .
docker tag ${ECR_FRONTEND_REPO}:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest
cd ..

# Generate random password and secret key
DB_PASSWORD=$(openssl rand -hex 16)
DJANGO_SECRET_KEY=$(openssl rand -base64 32)

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file aws/cloudformation.yml \
    --stack-name ${STACK_NAME} \
    --parameter-overrides \
        EnvironmentName=${ENVIRONMENT_NAME} \
        DBUsername=expertconnect \
        DBPassword=${DB_PASSWORD} \
        DjangoSecretKey=${DJANGO_SECRET_KEY} \
    --capabilities CAPABILITY_IAM \
    --region ${AWS_REGION}

# Get stack outputs
echo "Getting deployment information..."
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text --region ${AWS_REGION})
LOAD_BALANCER_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerURL'].OutputValue" --output text --region ${AWS_REGION})
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text --region ${AWS_REGION})
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='StaticFilesBucketName'].OutputValue" --output text --region ${AWS_REGION})

# Save deployment information
echo "Saving deployment information to aws/deployment-info.txt..."
mkdir -p aws
cat > aws/deployment-info.txt << EOF
ExpertConnect AWS Deployment Information
=======================================
Environment: ${ENVIRONMENT_NAME}
Region: ${AWS_REGION}
Stack Name: ${STACK_NAME}

Access URLs:
-----------
CloudFront URL: ${CLOUDFRONT_URL}
Load Balancer URL: ${LOAD_BALANCER_URL}

Database:
--------
Endpoint: ${DB_ENDPOINT}
Username: expertconnect
Password: ${DB_PASSWORD}

Storage:
-------
S3 Bucket: ${S3_BUCKET}

Security:
--------
Django Secret Key: ${DJANGO_SECRET_KEY}

Deployment Date: $(date)
EOF

echo "Deployment completed successfully!"
echo "Your application is now available at: ${CLOUDFRONT_URL}"
echo "Deployment information saved to aws/deployment-info.txt"
