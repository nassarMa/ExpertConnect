# ExpertConnect Platform - Monitoring and Maintenance Guide

This guide provides detailed instructions for monitoring and maintaining your ExpertConnect platform after deployment, ensuring optimal performance, security, and reliability.

## Table of Contents

1. [Regular Maintenance Tasks](#regular-maintenance-tasks)
2. [Monitoring System Health](#monitoring-system-health)
3. [Backup and Recovery](#backup-and-recovery)
4. [Security Maintenance](#security-maintenance)
5. [Performance Optimization](#performance-optimization)
6. [Scaling the Application](#scaling-the-application)
7. [Update Procedures](#update-procedures)
8. [Disaster Recovery](#disaster-recovery)

## Regular Maintenance Tasks

### Daily Tasks

- **Check system logs** for errors and warnings
- **Monitor active users** and ongoing meetings
- **Verify credit transactions** are processing correctly
- **Check disk space** on database and application servers

### Weekly Tasks

- **Review performance metrics** for slow API endpoints
- **Check database growth** and plan for scaling if needed
- **Review user feedback** and support requests
- **Test video conferencing** functionality

### Monthly Tasks

- **Apply security updates** to all system components
- **Perform database maintenance** (vacuum, analyze)
- **Review and optimize database indexes**
- **Test backup restoration** procedures
- **Review AWS costs** and optimize resource usage

## Monitoring System Health

### Local Deployment Monitoring

1. **Docker container monitoring**:
   ```bash
   # Check container status
   docker-compose ps
   
   # View resource usage
   docker stats
   
   # Check logs
   docker-compose logs -f
   ```

2. **Database monitoring**:
   ```bash
   # Connect to PostgreSQL
   docker-compose exec db psql -U expertconnect_user -d expertconnect
   
   # Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   # Check database size
   SELECT pg_size_pretty(pg_database_size('expertconnect'));
   
   # Check table sizes
   SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) 
   FROM pg_catalog.pg_statio_user_tables 
   ORDER BY pg_total_relation_size(relid) DESC;
   ```

3. **Application monitoring**:
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Check frontend logs
   docker-compose logs frontend
   ```

### AWS Deployment Monitoring

1. **Set up CloudWatch Dashboard**:
   ```bash
   aws cloudwatch put-dashboard \
       --dashboard-name ExpertConnect-Dashboard \
       --dashboard-body file://aws/dashboard.json
   ```

2. **Configure CloudWatch Alarms**:
   ```bash
   # CPU utilization alarm for backend
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
   
   # Database connections alarm
   aws cloudwatch put-metric-alarm \
       --alarm-name expertconnect-db-connections-high \
       --alarm-description "Alarm when DB connections exceed 80% of max" \
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

3. **Monitor ECS services**:
   ```bash
   # Check service status
   aws ecs describe-services \
       --cluster expertconnect-prod-cluster \
       --services expertconnect-prod-backend expertconnect-prod-frontend
   
   # Check running tasks
   aws ecs list-tasks \
       --cluster expertconnect-prod-cluster \
       --service-name expertconnect-prod-backend
   ```

4. **View CloudWatch Logs**:
   ```bash
   # Get the backend log group
   LOG_GROUP="/ecs/expertconnect-prod-backend"
   
   # Get the most recent log stream
   LOG_STREAM=$(aws logs describe-log-streams --log-group-name $LOG_GROUP --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text)
   
   # View recent logs
   aws logs get-log-events --log-group-name $LOG_GROUP --log-stream-name $LOG_STREAM --limit 100
   ```

5. **Set up X-Ray for distributed tracing** (optional):
   ```bash
   # Install X-Ray daemon on ECS tasks
   # Add to task definition
   {
     "name": "xray-daemon",
     "image": "amazon/aws-xray-daemon",
     "cpu": 32,
     "memoryReservation": 256,
     "portMappings": [
       {
         "containerPort": 2000,
         "hostPort": 2000,
         "protocol": "udp"
       }
     ]
   }
   ```

## Backup and Recovery

### Database Backup

#### Local Deployment

1. **Manual backup**:
   ```bash
   # For Docker
   docker-compose exec db pg_dump -U expertconnect_user expertconnect > backup_$(date +%Y%m%d).sql
   
   # For local PostgreSQL
   pg_dump -U expertconnect_user -h localhost expertconnect > backup_$(date +%Y%m%d).sql
   ```

2. **Automated backup script**:
   ```bash
   #!/bin/bash
   # Save as backup.sh
   
   BACKUP_DIR="/path/to/backups"
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="$BACKUP_DIR/expertconnect_$TIMESTAMP.sql"
   
   # Create backup
   docker-compose exec -T db pg_dump -U expertconnect_user expertconnect > $BACKUP_FILE
   
   # Compress backup
   gzip $BACKUP_FILE
   
   # Delete backups older than 30 days
   find $BACKUP_DIR -name "expertconnect_*.sql.gz" -mtime +30 -delete
   
   echo "Backup completed: ${BACKUP_FILE}.gz"
   ```

3. **Schedule with cron**:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add line to run backup daily at 2 AM
   0 2 * * * /path/to/backup.sh >> /path/to/backup.log 2>&1
   ```

#### AWS RDS

1. **Automated snapshots** are enabled by default (7-day retention)

2. **Manual snapshot**:
   ```bash
   aws rds create-db-snapshot \
       --db-instance-identifier expertconnect-prod-db \
       --db-snapshot-identifier expertconnect-manual-backup-$(date +%Y%m%d)
   ```

3. **Copy snapshot to another region** (for disaster recovery):
   ```bash
   # Get snapshot ARN
   SNAPSHOT_ARN=$(aws rds describe-db-snapshots \
       --db-instance-identifier expertconnect-prod-db \
       --db-snapshot-identifier expertconnect-manual-backup-$(date +%Y%m%d) \
       --query "DBSnapshots[0].DBSnapshotArn" \
       --output text)
   
   # Copy to another region
   aws rds copy-db-snapshot \
       --source-db-snapshot-identifier $SNAPSHOT_ARN \
       --target-db-snapshot-identifier expertconnect-dr-backup-$(date +%Y%m%d) \
       --region us-west-2
   ```

### Application Backup

1. **Code repository**:
   - Ensure all code is committed to version control
   - Consider using GitHub Actions or AWS CodeCommit for automated backups

2. **Static files**:
   ```bash
   # For local deployment
   tar -czf static_files_$(date +%Y%m%d).tar.gz /path/to/static/files
   
   # For AWS S3
   aws s3 sync s3://expertconnect-prod-static s3://expertconnect-backup/static-$(date +%Y%m%d)
   ```

3. **Environment configuration**:
   ```bash
   # Backup .env file
   cp .env .env.backup.$(date +%Y%m%d)
   
   # For AWS
   aws ssm get-parameters-by-path \
       --path /expertconnect/prod \
       --recursive \
       --with-decryption \
       --output json > ssm_params_$(date +%Y%m%d).json
   ```

### Recovery Procedures

1. **Database restoration**:
   ```bash
   # For local deployment
   cat backup_20250322.sql | docker-compose exec -T db psql -U expertconnect_user expertconnect
   
   # For AWS RDS
   aws rds restore-db-instance-from-db-snapshot \
       --db-instance-identifier expertconnect-restored \
       --db-snapshot-identifier expertconnect-manual-backup-20250322
   ```

2. **Application restoration**:
   - Redeploy code from repository
   - Restore environment configuration
   - Restore static files if needed

## Security Maintenance

### Regular Security Tasks

1. **Update dependencies**:
   ```bash
   # Backend
   pip list --outdated
   pip install --upgrade package-name
   
   # Frontend
   npm outdated
   npm update
   
   # Check for security vulnerabilities
   npm audit
   npm audit fix
   ```

2. **Rotate credentials**:
   - Database passwords
   - API keys
   - JWT secret keys
   - AWS access keys

3. **Review access logs**:
   ```bash
   # For local deployment
   docker-compose logs | grep -i error
   
   # For AWS
   aws logs filter-log-events \
       --log-group-name /ecs/expertconnect-prod-backend \
       --filter-pattern "ERROR"
   ```

4. **Scan for vulnerabilities**:
   ```bash
   # Install safety for Python
   pip install safety
   
   # Scan dependencies
   safety check -r requirements.txt
   ```

### AWS Security Best Practices

1. **Enable AWS GuardDuty**:
   ```bash
   aws guardduty create-detector --enable
   ```

2. **Enable AWS Config**:
   ```bash
   aws configservice put-configuration-recorder \
       --configuration-recorder name=default,roleARN=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig \
       --recording-group allSupported=true,includeGlobalResources=true
   
   aws configservice put-delivery-channel \
       --delivery-channel name=default,s3BucketName=config-bucket-$(aws sts get-caller-identity --query Account --output text)
   
   aws configservice start-configuration-recorder --configuration-recorder-name default
   ```

3. **Review IAM permissions**:
   ```bash
   # List users
   aws iam list-users
   
   # List roles
   aws iam list-roles
   
   # Review policies
   aws iam list-policies --scope Local
   ```

4. **Enable CloudTrail**:
   ```bash
   aws cloudtrail create-trail \
       --name expertconnect-trail \
       --s3-bucket-name expertconnect-cloudtrail-$(aws sts get-caller-identity --query Account --output text) \
       --is-multi-region-trail
   
   aws cloudtrail start-logging --name expertconnect-trail
   ```

## Performance Optimization

### Database Optimization

1. **Regular maintenance**:
   ```sql
   -- Connect to database
   
   -- Vacuum and analyze
   VACUUM ANALYZE;
   
   -- Reindex
   REINDEX DATABASE expertconnect;
   ```

2. **Identify slow queries**:
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries taking more than 1 second
   SELECT pg_reload_conf();
   
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

3. **Add indexes for frequent queries**:
   ```sql
   -- Example: Add index for user skills
   CREATE INDEX idx_user_skills ON user_skills(skill_id);
   
   -- Example: Add index for meeting searches
   CREATE INDEX idx_meetings_date ON meetings_meeting(scheduled_time);
   ```

### Application Optimization

1. **Django optimization**:
   - Use `select_related()` and `prefetch_related()` for related objects
   - Implement caching with Redis
   - Use pagination for large result sets

2. **Frontend optimization**:
   - Implement code splitting
   - Use React.memo for expensive components
   - Optimize images and assets
   - Implement lazy loading

3. **API optimization**:
   - Add appropriate caching headers
   - Implement request throttling
   - Use compression middleware

## Scaling the Application

### Horizontal Scaling

#### Local Deployment

1. **Scale with Docker Compose**:
   ```bash
   # Scale backend service
   docker-compose up -d --scale backend=3
   
   # Add load balancer (e.g., Nginx)
   ```

#### AWS Deployment

1. **Scale ECS services**:
   ```bash
   # Scale backend service
   aws ecs update-service \
       --cluster expertconnect-prod-cluster \
       --service expertconnect-prod-backend \
       --desired-count 3
   ```

2. **Configure auto-scaling**:
   ```bash
   # Register scalable target
   aws application-autoscaling register-scalable-target \
       --service-namespace ecs \
       --resource-id service/expertconnect-prod-cluster/expertconnect-prod-backend \
       --scalable-dimension ecs:service:DesiredCount \
       --min-capacity 1 \
       --max-capacity 5
   
   # Create scaling policy
   aws application-autoscaling put-scaling-policy \
       --service-namespace ecs \
       --resource-id service/expertconnect-prod-cluster/expertconnect-prod-backend \
       --scalable-dimension ecs:service:DesiredCount \
       --policy-name cpu-tracking-scaling-policy \
       --policy-type TargetTrackingScaling \
       --target-tracking-scaling-policy-configuration file://scaling-policy.json
   ```

### Vertical Scaling

#### Local Deployment

1. **Increase container resources**:
   ```yaml
   # In docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

#### AWS Deployment

1. **Update task definition**:
   ```bash
   # Get current task definition
   aws ecs describe-task-definition \
       --task-definition expertconnect-prod-backend \
       --query "taskDefinition" > task-def.json
   
   # Edit CPU and memory in task-def.json
   
   # Register new task definition
   aws ecs register-task-definition --cli-input-json file://task-def.json
   
   # Update service to use new task definition
   aws ecs update-service \
       --cluster expertconnect-prod-cluster \
       --service expertconnect-prod-backend \
       --task-definition expertconnect-prod-backend:LATEST
   ```

2. **Scale RDS instance**:
   ```bash
   aws rds modify-db-instance \
       --db-instance-identifier expertconnect-prod-db \
       --db-instance-class db.t3.medium \
       --apply-immediately
   ```

## Update Procedures

### Code Updates

1. **Local testing**:
   - Test changes in development environment
   - Run automated tests
   - Perform manual testing

2. **Deployment to staging** (if available):
   - Deploy to staging environment
   - Verify functionality
   - Check for performance regressions

3. **Production deployment**:

   #### Local Deployment
   ```bash
   # Pull latest code
   git pull origin main
   
   # Rebuild containers
   docker-compose build
   
   # Update with minimal downtime
   docker-compose up -d
   ```

   #### AWS Deployment
   ```bash
   # Build and push new Docker images
   ./aws/deploy-aws.sh --update-only
   
   # Or manually:
   # Build and push images
   aws ecr get-login-password | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
   
   docker build -t expertconnect-backend:latest ./backend
   docker tag expertconnect-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/expertconnect-backend:latest
   
   # Force new deployment
   aws ecs update-service \
       --cluster expertconnect-prod-cluster \
       --service expertconnect-prod-backend \
       --force-new-deployment
   ```

### Database Schema Updates

1. **Create migrations**:
   ```bash
   # For local development
   python manage.py makemigrations
   
   # Test migrations
   python manage.py sqlmigrate app_name migration_number
   ```

2. **Apply migrations with minimal downtime**:
   - For non-destructive changes, apply directly
   - For destructive changes, use a multi-step process:
     1. Add new fields/tables
     2. Deploy code that can work with both old and new schema
     3. Migrate data
     4. Deploy code that uses new schema only
     5. Remove old fields/tables

3. **Apply migrations in production**:
   ```bash
   # For local deployment
   docker-compose exec backend python manage.py migrate
   
   # For AWS ECS
   TASK_ARN=$(aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend --query "taskArns[0]" --output text)
   aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "python manage.py migrate"
   ```

## Disaster Recovery

### Disaster Recovery Plan

1. **Define recovery objectives**:
   - Recovery Time Objective (RTO): How quickly you need to recover
   - Recovery Point Objective (RPO): How much data loss is acceptable

2. **Document recovery procedures**:
   - Database restoration
   - Application redeployment
   - DNS updates

3. **Test recovery procedures regularly**:
   - Perform recovery drills
   - Document lessons learned

### AWS Multi-Region Recovery

1. **Set up cross-region replication for S3**:
   ```bash
   # Create replication configuration
   aws s3api put-bucket-replication \
       --bucket expertconnect-prod-static \
       --replication-configuration file://replication.json
   ```

2. **Create read replica in another region**:
   ```bash
   aws rds create-db-instance-read-replica \
       --db-instance-identifier expertconnect-dr-db \
       --source-db-instance-identifier expertconnect-prod-db \
       --source-region us-east-1 \
       --region us-west-2
   ```

3. **Set up CloudFormation stack in DR region**:
   ```bash
   aws cloudformation create-stack \
       --stack-name expertconnect-dr \
       --template-body file://aws/dr-cloudformation.yml \
       --parameters ParameterKey=EnvironmentName,ParameterValue=dr \
       --capabilities CAPABILITY_IAM \
       --region us-west-2
   ```

4. **Test failover procedure**:
   - Promote read replica to primary
   - Update application configuration
   - Test functionality

### Backup Verification

1. **Regularly test backups**:
   ```bash
   # Create test database
   createdb expertconnect_test
   
   # Restore backup to test database
   psql -d expertconnect_test < backup_20250322.sql
   
   # Verify data integrity
   psql -d expertconnect_test -c "SELECT COUNT(*) FROM auth_user;"
   ```

2. **Document verification results**:
   - Record successful/failed restorations
   - Track restoration time
   - Verify data integrity

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Django Performance Optimization](https://docs.djangoproject.com/en/stable/topics/performance/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/measuring-performance)
