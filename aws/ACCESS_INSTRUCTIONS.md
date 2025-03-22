# AWS Access Instructions for ExpertConnect

This guide provides detailed instructions for accessing and managing your ExpertConnect platform deployed on AWS.

## Accessing Your Application

### Public Access URL

Your ExpertConnect platform is accessible via the CloudFront URL provided after deployment:

```bash
# Get your CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)
echo $CLOUDFRONT_URL
```

This URL can be shared with your users to access the platform from anywhere in the world.

### Admin Access

To access the admin interface:

1. Navigate to `{CLOUDFRONT_URL}/admin/`
2. Log in with the admin credentials created during deployment
3. From here, you can manage users, categories, and other platform settings

## Managing Your AWS Resources

### AWS Management Console

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/)
2. Navigate to the CloudFormation service
3. Select the `expertconnect-prod` stack to view all deployed resources
4. From here, you can access individual services like ECS, RDS, and CloudFront

### Key AWS Services to Monitor

#### ECS (Elastic Container Service)

1. Navigate to the ECS console
2. Select the `expertconnect-prod-cluster`
3. Here you can:
   - View running services and tasks
   - Scale services up or down
   - Update service configurations
   - View container logs

#### RDS (Relational Database Service)

1. Navigate to the RDS console
2. Find your `expertconnect` database instance
3. Here you can:
   - Monitor database performance
   - Create snapshots for backups
   - Modify instance settings
   - Set up read replicas for scaling

#### CloudFront

1. Navigate to the CloudFront console
2. Find your ExpertConnect distribution
3. Here you can:
   - Monitor content delivery metrics
   - Configure caching behaviors
   - Set up custom domains
   - Manage SSL certificates

#### S3 (Simple Storage Service)

1. Navigate to the S3 console
2. Find your `expertconnect-prod-static` bucket
3. Here you can:
   - Upload or manage static files
   - Configure lifecycle policies
   - Monitor storage usage
   - Set up cross-region replication

## Updating Your Application

### Deploying Code Updates

To deploy updates to your application:

1. Build and push new Docker images:
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

2. Force new deployments of your ECS services:
   ```bash
   aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-backend --force-new-deployment
   aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-frontend --force-new-deployment
   ```

### Updating Infrastructure

To update your infrastructure configuration:

1. Modify the CloudFormation template (`aws/cloudformation.yml`)
2. Deploy the updated template:
   ```bash
   aws cloudformation update-stack \
       --stack-name expertconnect-prod \
       --template-body file://aws/cloudformation.yml \
       --parameters ParameterKey=EnvironmentName,ParameterValue=prod \
                   ParameterKey=DBUsername,UsePreviousValue=true \
                   ParameterKey=DBPassword,UsePreviousValue=true \
                   ParameterKey=DjangoSecretKey,UsePreviousValue=true \
       --capabilities CAPABILITY_IAM
   ```

## Setting Up Custom Domain

To use a custom domain for your application:

1. Register a domain in Route 53 or use an existing domain
2. Request an SSL certificate in AWS Certificate Manager:
   ```bash
   aws acm request-certificate \
       --domain-name yourdomain.com \
       --validation-method DNS \
       --subject-alternative-names www.yourdomain.com
   ```

3. Update your CloudFront distribution:
   ```bash
   # Get the distribution ID
   DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='expertconnect-prod'].Id" --output text)
   
   # Get the current configuration
   aws cloudfront get-distribution-config --id $DIST_ID --output json > dist-config.json
   
   # Edit the configuration to add your domain and certificate
   # Then update the distribution with the edited config
   ```

4. Create DNS records pointing to your CloudFront distribution

## Monitoring and Alerts

### Setting Up Basic Monitoring

1. Create a CloudWatch dashboard:
   ```bash
   aws cloudwatch put-dashboard \
       --dashboard-name ExpertConnect-Dashboard \
       --dashboard-body file://aws/dashboard.json
   ```

2. Set up basic alarms:
   ```bash
   # CPU utilization alarm for backend
   aws cloudwatch put-metric-alarm \
       --alarm-name expertconnect-backend-cpu \
       --alarm-description "High CPU utilization for backend" \
       --metric-name CPUUtilization \
       --namespace AWS/ECS \
       --statistic Average \
       --period 300 \
       --threshold 80 \
       --comparison-operator GreaterThanThreshold \
       --dimensions Name=ClusterName,Value=expertconnect-prod-cluster Name=ServiceName,Value=expertconnect-prod-backend \
       --evaluation-periods 2 \
       --alarm-actions arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):expertconnect-alarms
   
   # Database connections alarm
   aws cloudwatch put-metric-alarm \
       --alarm-name expertconnect-db-connections \
       --alarm-description "High DB connection count" \
       --metric-name DatabaseConnections \
       --namespace AWS/RDS \
       --statistic Average \
       --period 300 \
       --threshold 80 \
       --comparison-operator GreaterThanThreshold \
       --dimensions Name=DBInstanceIdentifier,Value=expertconnect-prod-db \
       --evaluation-periods 2 \
       --alarm-actions arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):expertconnect-alarms
   ```

### Setting Up Email Notifications

1. Create an SNS topic (if not already created):
   ```bash
   aws sns create-topic --name expertconnect-alarms
   ```

2. Subscribe your email to the topic:
   ```bash
   aws sns subscribe \
       --topic-arn arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):expertconnect-alarms \
       --protocol email \
       --notification-endpoint your-email@example.com
   ```

3. Confirm the subscription by clicking the link in the email you receive

## Backup and Recovery

### Database Backups

RDS automatically creates daily backups with a 7-day retention period. To create a manual snapshot:

```bash
aws rds create-db-snapshot \
    --db-instance-identifier expertconnect-prod-db \
    --db-snapshot-identifier expertconnect-manual-backup-$(date +%Y%m%d)
```

### Restoring from Backup

To restore from a snapshot:

```bash
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier expertconnect-restored \
    --db-snapshot-identifier expertconnect-manual-backup-20250321 \
    --db-instance-class db.t3.small
```

## Scaling Your Application

### Horizontal Scaling (Adding More Instances)

To scale your ECS services:

```bash
# Scale backend service
aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-backend --desired-count 4

# Scale frontend service
aws ecs update-service --cluster expertconnect-prod-cluster --service expertconnect-prod-frontend --desired-count 4
```

### Vertical Scaling (Increasing Resources)

To increase resources for your services, update the task definitions with higher CPU and memory allocations:

1. Create a new revision of the task definition with higher resources
2. Update the service to use the new task definition

### Database Scaling

To scale your database:

```bash
# Modify the instance class
aws rds modify-db-instance \
    --db-instance-identifier expertconnect-prod-db \
    --db-instance-class db.t3.medium \
    --apply-immediately
```

## Cost Management

### Monitoring Costs

1. Enable AWS Cost Explorer:
   ```bash
   aws ce enable-cost-explorer
   ```

2. Create a budget to monitor ExpertConnect costs:
   ```bash
   aws budgets create-budget \
       --account-id $(aws sts get-caller-identity --query Account --output text) \
       --budget file://aws/budget.json \
       --notifications-with-subscribers file://aws/budget-notifications.json
   ```

### Cost Optimization Tips

1. **Right-size your resources**: Monitor usage and adjust instance sizes accordingly
2. **Use Spot Instances**: For non-critical workloads, consider using Spot Instances
3. **Enable auto-scaling**: Scale down during low-traffic periods
4. **Clean up unused resources**: Regularly audit and remove unused resources
5. **Use Reserved Instances**: For predictable workloads, purchase Reserved Instances

## Security Management

### Rotating Credentials

1. Rotate database password:
   ```bash
   # Generate a new password
   NEW_PASSWORD=$(openssl rand -base64 12)
   
   # Update the RDS instance
   aws rds modify-db-instance \
       --db-instance-identifier expertconnect-prod-db \
       --master-user-password $NEW_PASSWORD \
       --apply-immediately
   
   # Update the ECS task definitions with the new password
   # This requires creating new revisions of the task definitions
   ```

2. Rotate Django secret key:
   ```bash
   # Generate a new secret key
   NEW_SECRET_KEY=$(openssl rand -base64 32)
   
   # Update the ECS task definition with the new secret key
   # This requires creating a new revision of the backend task definition
   ```

### Security Monitoring

1. Enable AWS GuardDuty:
   ```bash
   aws guardduty create-detector --enable
   ```

2. Enable AWS Config:
   ```bash
   aws configservice put-configuration-recorder \
       --configuration-recorder name=default,roleARN=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig \
       --recording-group allSupported=true,includeGlobalResources=true
   
   aws configservice put-delivery-channel \
       --delivery-channel name=default,s3BucketName=config-bucket-$(aws sts get-caller-identity --query Account --output text)
   
   aws configservice start-configuration-recorder --configuration-recorder-name default
   ```

## Troubleshooting Access Issues

### Common Access Problems

1. **Can't access the application**:
   - Check CloudFront distribution status
   - Verify ECS services are running
   - Check security group rules

2. **Admin login issues**:
   - Reset admin password using Django management commands:
     ```bash
     # Get a shell to the backend container
     TASK_ARN=$(aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend --query "taskArns[0]" --output text)
     
     aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "/bin/bash"
     
     # Inside the container
     python manage.py changepassword admin
     ```

3. **API access issues**:
   - Check API logs in CloudWatch
   - Verify CORS settings if accessing from different domains

## Getting Support

If you encounter issues with your AWS deployment:

1. Check CloudWatch logs for error messages
2. Review the AWS service health dashboard
3. Consult AWS documentation for specific services
4. Consider AWS Support plans for direct assistance

For application-specific issues, refer to the ExpertConnect documentation or contact the development team.

## Additional Resources

- [AWS CLI Command Reference](https://awscli.amazonaws.com/v2/documentation/api/latest/index.html)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
