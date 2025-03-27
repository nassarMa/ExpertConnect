# AWS Deployment Guide for ExpertConnect

This guide provides instructions for deploying the ExpertConnect platform on AWS using the provided CloudFormation template and deployment script.

## Prerequisites

Before deploying to AWS, ensure you have the following:

1. **AWS Account**: You need an active AWS account with appropriate permissions
2. **AWS CLI**: Install and configure the AWS CLI on your local machine
3. **Docker**: Install Docker to build and push container images
4. **Git**: To clone the repository (if needed)

## AWS CLI Setup

1. Install the AWS CLI:
   ```bash
   # For Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # For macOS
   brew install awscli
   
   # For Windows
   # Download and run the installer from: https://aws.amazon.com/cli/
   ```

2. Configure AWS CLI with your credentials:
   ```bash
   aws configure
   ```
   
   You'll need to provide:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., us-east-1)
   - Default output format (json recommended)

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. Navigate to the project directory:
   ```bash
   cd ExpertConnect
   ```

2. Run the deployment script:
   ```bash
   ./aws/deploy-aws.sh
   ```
   
   This script will:
   - Create ECR repositories for backend and frontend
   - Build and push Docker images
   - Generate secure passwords and keys
   - Deploy the CloudFormation stack
   - Save deployment information to `aws/deployment-info.txt`

3. Wait for the deployment to complete (this may take 15-20 minutes)

4. Access your application using the CloudFront URL provided in the deployment information

### Option 2: Manual Deployment

If you prefer to deploy manually or need more control over the process:

1. Create ECR repositories:
   ```bash
   aws ecr create-repository --repository-name expertconnect-backend
   aws ecr create-repository --repository-name expertconnect-frontend
   ```

2. Build and push Docker images:
   ```bash
   # Login to ECR
   aws ecr get-login-password | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push backend
   cd backend
   docker buildx build --platform linux/amd64 -t expertconnect-backend:latest .
   docker tag expertconnect-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   cd ..
   
   # Build and push frontend
   cd frontend
   docker buildx build --platform linux/amd64 -t expertconnect-frontend:latest .
   docker tag expertconnect-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-frontend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-frontend:latest
   cd ..
   ```

3. Deploy CloudFormation stack:
   ```bash
   # Generate secure passwords
   DB_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9!#$%^&*()_+=[]{}|:,.?~' < /dev/urandom | head -c 16)
   DJANGO_SECRET_KEY=$(openssl rand -base64 32)
   
   # Deploy stack
   aws cloudformation deploy \
       --template-file aws/cloudformation.yml \
       --stack-name expertconnect-prod \
       --parameter-overrides \
           EnvironmentName=prod \
           DBUsername=expertconnect \
           DBPassword=$DB_PASSWORD \
           DjangoSecretKey=$DJANGO_SECRET_KEY \
       --capabilities CAPABILITY_IAM
   ```

4. Get deployment information:
   ```bash
   aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs" --output table
   ```

## Post-Deployment Steps

After successful deployment, you should:

1. **Verify Application Access**: Open the CloudFront URL in your browser to ensure the application is running correctly

2. **Set Up Custom Domain (Optional)**:
   - Register a domain in Route 53 or use an existing domain
   - Create an SSL certificate in AWS Certificate Manager
   - Update the CloudFront distribution with your custom domain and certificate
   - Create DNS records pointing to your CloudFront distribution

3. **Set Up Monitoring**:
   - Configure CloudWatch alarms for key metrics
   - Set up logging and monitoring for your ECS services
   - Consider setting up AWS X-Ray for distributed tracing

## Updating the Application

To update the application after making changes:

1. Build and push new Docker images:
   ```bash
   # Backend
   cd backend
   docker build -t expertconnect-backend:latest .
   docker tag expertconnect-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   cd ..
   
   # Frontend
   cd frontend
   docker build -t expertconnect-frontend:latest .
   docker tag expertconnect-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-frontend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-frontend:latest
   cd ..
   ```

2. Update the ECS services to force new deployments:
   ```bash
   aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-backend --force-new-deployment
   aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-frontend --force-new-deployment
   ```

## Troubleshooting

### Common Issues

1. **CloudFormation Stack Creation Failure**:
   - Check the CloudFormation events in the AWS Console
   - Look for specific error messages in the failed resource
   - Ensure your AWS account has sufficient permissions

2. **Container Startup Issues**:
   - Check the ECS task logs in CloudWatch
   - Verify environment variables are correctly set
   - Ensure the database connection is working

3. **Database Connection Issues**:
   - Verify security group rules allow traffic from ECS to RDS
   - Check database credentials in the task definition
   - Ensure the database exists and is accessible

4. **CloudFront Access Issues**:
   - Check the CloudFront distribution status
   - Verify origin settings point to the correct ALB
   - Check cache behaviors and routing rules

### Accessing Logs

To view application logs:

```bash
# Get the CloudWatch log group names
aws logs describe-log-groups --log-group-name-prefix /ecs/expertconnect

# Get log streams for a specific log group
aws logs describe-log-streams --log-group-name /ecs/expertconnect-prod-backend

# Get log events
aws logs get-log-events --log-group-name /ecs/expertconnect-prod-backend --log-stream-name your-log-stream-name
```

## Cost Optimization

The default deployment uses:
- Fargate for container hosting
- RDS for database
- CloudFront for content delivery
- S3 for static file storage

To optimize costs:
- Scale down the number of ECS tasks during low-traffic periods
- Use Reserved Instances for RDS if planning long-term usage
- Monitor and adjust resources based on actual usage patterns
- Consider using Spot Instances for non-critical workloads

## Security Considerations

The deployment includes several security features:
- Private subnets for the database
- Security groups with least privilege access
- IAM roles with minimal permissions
- HTTPS for all external traffic

Additional security measures to consider:
- Enable AWS WAF for CloudFront
- Implement AWS Shield for DDoS protection
- Set up AWS Config and Security Hub for compliance monitoring
- Regularly rotate database credentials and secrets

## Backup and Disaster Recovery

The deployment includes:
- RDS automated backups (7-day retention)

Consider implementing:
- Database snapshots for long-term retention
- Cross-region replication for disaster recovery
- Regular testing of restore procedures
- Automated backup verification

## Support and Maintenance

For ongoing maintenance:
- Regularly update container images with security patches
- Monitor AWS service health and plan for maintenance windows
- Set up automated alerts for critical metrics
- Document operational procedures for common tasks
