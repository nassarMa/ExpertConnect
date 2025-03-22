# AWS Deployment Verification Guide

This guide will help you verify that your ExpertConnect platform has been successfully deployed to AWS and is functioning correctly.

## Deployment Verification Checklist

Follow these steps to verify your AWS deployment:

### 1. Verify CloudFormation Stack

First, check that your CloudFormation stack has been created successfully:

```bash
aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].StackStatus" --output text
```

You should see `CREATE_COMPLETE` as the output. If you see `CREATE_IN_PROGRESS`, wait a few minutes and check again.

### 2. Verify Infrastructure Resources

Check that all the key infrastructure components have been created:

```bash
# Get all outputs from the CloudFormation stack
aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs" --output table
```

Verify that you can see outputs for:
- CloudFrontURL
- LoadBalancerURL
- DatabaseEndpoint
- StaticFilesBucketName
- ECSClusterName

### 3. Verify ECS Services

Check that the ECS services are running:

```bash
# List services in the cluster
aws ecs list-services --cluster expertconnect-prod-cluster

# Check service status for backend
aws ecs describe-services --cluster expertconnect-prod-cluster --services expertconnect-prod-backend --query "services[0].status" --output text

# Check service status for frontend
aws ecs describe-services --cluster expertconnect-prod-cluster --services expertconnect-prod-frontend --query "services[0].status" --output text
```

Both services should show `ACTIVE` status.

### 4. Verify Running Tasks

Check that the ECS tasks are running:

```bash
# List tasks for backend service
aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend

# List tasks for frontend service
aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-frontend
```

You should see task ARNs listed for both services.

### 5. Check Application Health

#### Access the Application

Open the CloudFront URL in your web browser:

```bash
# Get the CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)
echo $CLOUDFRONT_URL
```

Visit this URL in your browser. You should see the ExpertConnect login page.

#### Check API Health

Test the API health endpoint:

```bash
# Get the CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)

# Test the API health endpoint
curl -I "${CLOUDFRONT_URL}/api/health/"
```

You should receive a `200 OK` response.

### 6. Check Database Connectivity

Verify that the application can connect to the database by attempting to register a new user through the web interface.

### 7. Check CloudWatch Logs

Examine the application logs in CloudWatch:

```bash
# Get the backend log group
aws logs describe-log-streams --log-group-name /ecs/expertconnect-prod-backend --max-items 1

# Get the most recent log stream name
LOG_STREAM=$(aws logs describe-log-streams --log-group-name /ecs/expertconnect-prod-backend --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text)

# View recent logs
aws logs get-log-events --log-group-name /ecs/expertconnect-prod-backend --log-stream-name $LOG_STREAM --limit 20
```

Check for any error messages or issues in the logs.

### 8. Test Core Functionality

Perform these manual tests to verify core functionality:

1. **User Registration and Login**:
   - Register a new user account
   - Log in with the new account
   - Verify you receive the initial free credit

2. **Expert Profile**:
   - Create or update your profile
   - Add skills and availability

3. **Meeting Scheduling**:
   - Create a test meeting (you may need two accounts to test this fully)
   - Confirm the meeting
   - Test joining the meeting room

4. **Credit System**:
   - Check your credit balance
   - Verify credit transactions are recorded

5. **Messaging**:
   - Send a test message
   - Verify real-time delivery

## Troubleshooting Common Issues

### CloudFront Distribution Not Available

If the CloudFront URL returns an error:

1. Check the distribution status:
   ```bash
   aws cloudfront get-distribution --id $(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='expertconnect-prod'].Id" --output text)
   ```

2. Ensure the distribution is deployed (Status: Deployed)

3. If it's still in progress, wait 15-20 minutes for propagation

### ECS Tasks Failing to Start

If ECS tasks are not running:

1. Check the task status:
   ```bash
   aws ecs describe-tasks --cluster expertconnect-prod-cluster --tasks $(aws ecs list-tasks --cluster expertconnect-prod-cluster --query "taskArns[0]" --output text)
   ```

2. Look for stopped reason and exit codes

3. Check CloudWatch logs for detailed error messages

### Database Connection Issues

If the application can't connect to the database:

1. Verify security group rules:
   ```bash
   # Get the RDS security group
   RDS_SG=$(aws cloudformation describe-stack-resources --stack-name expertconnect-prod --logical-resource-id RDSSecurityGroup --query "StackResources[0].PhysicalResourceId" --output text)
   
   # Check inbound rules
   aws ec2 describe-security-groups --group-ids $RDS_SG
   ```

2. Ensure the ECS security group is allowed to access the RDS security group on port 5432

### Static Files Not Loading

If static files (CSS, JS, images) are not loading:

1. Check the S3 bucket contents:
   ```bash
   aws s3 ls s3://$(aws cloudformation describe-stacks --stack-name expertconnect-prod --query "Stacks[0].Outputs[?OutputKey=='StaticFilesBucketName'].OutputValue" --output text)/
   ```

2. Verify CloudFront cache behavior for static files

## Monitoring Your Deployment

Set up basic monitoring:

```bash
# Create a CPU utilization alarm for the backend service
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
    --alarm-actions $(aws sns create-topic --name expertconnect-alarms --query "TopicArn" --output text)
```

## Next Steps After Verification

Once you've verified your deployment is working correctly:

1. **Set up a custom domain** (if desired)
2. **Configure automated backups** for your database
3. **Implement monitoring and alerting** for critical metrics
4. **Set up CI/CD pipeline** for automated deployments
5. **Document operational procedures** for your team
