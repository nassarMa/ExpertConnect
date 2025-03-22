# ExpertConnect Platform - Troubleshooting Guide

This comprehensive guide provides solutions for common issues you might encounter when deploying, running, and maintaining the ExpertConnect platform.

## Table of Contents

1. [Installation and Deployment Issues](#installation-and-deployment-issues)
2. [Database Issues](#database-issues)
3. [Backend API Issues](#backend-api-issues)
4. [Frontend Issues](#frontend-issues)
5. [Video Conferencing Issues](#video-conferencing-issues)
6. [Credit System Issues](#credit-system-issues)
7. [AWS Deployment Issues](#aws-deployment-issues)
8. [Performance Issues](#performance-issues)
9. [Security Issues](#security-issues)
10. [Logging and Debugging](#logging-and-debugging)

## Installation and Deployment Issues

### Docker Installation Problems

**Issue**: Docker or Docker Compose installation fails

**Solutions**:

1. Check system requirements:
   ```bash
   # Check Linux kernel version
   uname -r  # Should be 3.10 or higher
   ```

2. For Ubuntu/Debian, try the convenience script:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. Add your user to the docker group:
   ```bash
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

### Docker Compose Errors

**Issue**: `docker-compose up` fails with errors

**Solutions**:

1. Check Docker Compose version:
   ```bash
   docker-compose --version  # Should be 1.27.0 or higher
   ```

2. Validate the docker-compose.yml file:
   ```bash
   docker-compose config
   ```

3. Check for port conflicts:
   ```bash
   sudo lsof -i :5432  # Check if PostgreSQL port is in use
   sudo lsof -i :8000  # Check if backend port is in use
   sudo lsof -i :3000  # Check if frontend port is in use
   ```

### Environment Variables Issues

**Issue**: Application fails due to missing environment variables

**Solutions**:

1. Check if `.env` file exists:
   ```bash
   ls -la .env
   ```

2. Create from example if missing:
   ```bash
   cp .env.example .env
   ```

3. Verify all required variables are set:
   ```bash
   # Check for empty values
   grep -v "=" .env
   ```

4. For Docker, ensure environment variables are passed to containers:
   ```bash
   docker-compose config
   ```

## Database Issues

### Connection Failures

**Issue**: Application can't connect to the database

**Solutions**:

1. Check database credentials in `.env` file:
   ```
   DB_NAME=expertconnect
   DB_USER=expertconnect_user
   DB_PASSWORD=your_secure_password
   DB_HOST=db  # Use 'localhost' if not using Docker
   DB_PORT=5432
   ```

2. Verify the database is running:
   ```bash
   # For Docker
   docker-compose ps db
   
   # For local PostgreSQL
   sudo systemctl status postgresql
   
   # For AWS RDS
   aws rds describe-db-instances --db-instance-identifier expertconnect-db --query "DBInstances[0].DBInstanceStatus" --output text
   ```

3. Test connection directly:
   ```bash
   # For local PostgreSQL
   psql -U expertconnect_user -h localhost -d expertconnect
   
   # For Docker
   docker-compose exec db psql -U expertconnect_user -d expertconnect
   
   # For RDS
   psql -U expertconnect -h your-db-endpoint.rds.amazonaws.com -d expertconnect
   ```

### Migration Errors

**Issue**: Database migrations fail

**Solutions**:

1. Check migration errors in logs:
   ```bash
   # For Docker
   docker-compose logs backend
   
   # For manual deployment
   cd backend
   python manage.py migrate --traceback
   ```

2. For "relation already exists" errors:
   ```bash
   python manage.py migrate --fake-initial
   ```

3. For complex migration issues, reset migrations:
   ```bash
   # WARNING: This will delete all data
   python manage.py flush
   python manage.py migrate
   ```

### Database Performance Issues

**Issue**: Slow database queries

**Solutions**:

1. Check for slow queries:
   ```sql
   -- Connect to PostgreSQL
   SELECT
       pid,
       now() - pg_stat_activity.query_start AS duration,
       query
   FROM
       pg_stat_activity
   WHERE
       state = 'active' AND
       now() - pg_stat_activity.query_start > interval '1 second'
   ORDER BY
       duration DESC;
   ```

2. Optimize with indexes:
   ```sql
   -- Example: Add index to frequently queried fields
   CREATE INDEX idx_user_skills ON user_skills(skill_id);
   ```

3. Run VACUUM ANALYZE to optimize:
   ```sql
   VACUUM ANALYZE;
   ```

## Backend API Issues

### Server Startup Failures

**Issue**: Django server fails to start

**Solutions**:

1. Check for syntax errors in Python code:
   ```bash
   cd backend
   python -m compileall .
   ```

2. Verify dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

3. Check Django settings:
   ```bash
   python manage.py check
   ```

4. Look for specific errors in logs:
   ```bash
   # For Docker
   docker-compose logs backend
   
   # For manual deployment
   python manage.py runserver --traceback
   ```

### API Endpoint Errors

**Issue**: API endpoints return errors

**Solutions**:

1. Check request format and parameters:
   ```bash
   # Test with curl
   curl -H "Content-Type: application/json" http://localhost:8000/api/health/
   ```

2. Verify authentication:
   ```bash
   # Test with token
   curl -H "Authorization: Token your_token_here" http://localhost:8000/api/users/profile/
   ```

3. Check permissions in Django views
4. Look for errors in backend logs

### WebSocket Connection Issues

**Issue**: Real-time features not working

**Solutions**:

1. Verify Redis is running:
   ```bash
   # For Docker
   docker-compose ps redis
   
   # For local Redis
   redis-cli ping  # Should return PONG
   ```

2. Check WebSocket URL in frontend configuration:
   ```
   NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws
   ```

3. Test WebSocket connection:
   ```bash
   # Install wscat if needed
   npm install -g wscat
   
   # Test connection
   wscat -c ws://localhost:8000/ws/chat/test/
   ```

## Frontend Issues

### Build Failures

**Issue**: Frontend build fails

**Solutions**:

1. Check Node.js version:
   ```bash
   node --version  # Should be 16.x or higher
   ```

2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. Check for specific build errors:
   ```bash
   npm run build --verbose
   ```

### UI Rendering Issues

**Issue**: UI components not displaying correctly

**Solutions**:

1. Check browser console for JavaScript errors
2. Verify CSS is loading correctly
3. Test in different browsers
4. Clear browser cache and cookies

### API Connection Issues

**Issue**: Frontend can't connect to backend API

**Solutions**:

1. Check API URL in frontend configuration:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

2. Verify CORS settings in backend:
   ```python
   # In settings.py
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
   ]
   ```

3. Test API directly:
   ```bash
   curl http://localhost:8000/api/health/
   ```

## Video Conferencing Issues

### WebRTC Connection Failures

**Issue**: Video calls don't connect

**Solutions**:

1. Check browser compatibility:
   - Chrome 60+
   - Firefox 55+
   - Safari 11+
   - Edge 79+

2. Verify camera and microphone permissions:
   ```javascript
   // Test in browser console
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
       .then(stream => console.log('Media devices working'))
       .catch(err => console.error('Media devices error:', err));
   ```

3. Check for network restrictions (firewalls, proxies)
4. Verify TURN server configuration if using one

### Audio/Video Quality Issues

**Issue**: Poor audio or video quality

**Solutions**:

1. Check internet connection speed:
   ```bash
   # Install speedtest-cli
   pip install speedtest-cli
   
   # Run speed test
   speedtest-cli
   ```

2. Reduce video resolution in WebRTC configuration
3. Close other bandwidth-intensive applications
4. Use wired connection instead of Wi-Fi if possible

## Credit System Issues

### Credit Transaction Failures

**Issue**: Credits not being transferred during meetings

**Solutions**:

1. Check transaction logs:
   ```sql
   -- Connect to database
   SELECT * FROM credits_credittransaction ORDER BY created_at DESC LIMIT 10;
   ```

2. Verify meeting completion status:
   ```sql
   SELECT id, status, requester_id, expert_id FROM meetings_meeting ORDER BY created_at DESC LIMIT 10;
   ```

3. Check for errors in backend logs during transaction processing

### Initial Credit Not Received

**Issue**: New users don't receive initial free credit

**Solutions**:

1. Verify signal handler is registered:
   ```python
   # In credits/apps.py
   def ready(self):
       import credits.signals
   ```

2. Check user creation process:
   ```sql
   -- Check if users exist
   SELECT id, username, date_joined FROM auth_user ORDER BY date_joined DESC LIMIT 10;
   
   -- Check if credit balances exist
   SELECT user_id, balance FROM credits_creditbalance ORDER BY user_id DESC LIMIT 10;
   ```

3. Manually add credit if needed:
   ```python
   # In Django shell
   from django.contrib.auth.models import User
   from credits.models import CreditBalance, CreditTransaction
   
   user = User.objects.get(username='test_user')
   balance, created = CreditBalance.objects.get_or_create(user=user, defaults={'balance': 0})
   balance.balance += 1
   balance.save()
   
   CreditTransaction.objects.create(
       user=user,
       amount=1,
       transaction_type='INITIAL',
       description='Initial free credit'
   )
   ```

## AWS Deployment Issues

### CloudFormation Stack Creation Failures

**Issue**: CloudFormation stack fails to create

**Solutions**:

1. Check CloudFormation events for specific errors:
   ```bash
   aws cloudformation describe-stack-events --stack-name expertconnect-prod --max-items 10
   ```

2. Verify IAM permissions for the AWS user
3. Check resource limits in your AWS account
4. Look for syntax errors in the CloudFormation template:
   ```bash
   aws cloudformation validate-template --template-body file://aws/cloudformation.yml
   ```

### ECS Task Failures

**Issue**: ECS tasks keep stopping

**Solutions**:

1. Check task logs in CloudWatch:
   ```bash
   # Get the log group
   LOG_GROUP="/ecs/expertconnect-prod-backend"
   
   # Get the most recent log stream
   LOG_STREAM=$(aws logs describe-log-streams --log-group-name $LOG_GROUP --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text)
   
   # View recent logs
   aws logs get-log-events --log-group-name $LOG_GROUP --log-stream-name $LOG_STREAM --limit 100
   ```

2. Check task definition for resource limits:
   ```bash
   aws ecs describe-task-definition --task-definition expertconnect-prod-backend
   ```

3. Verify environment variables in task definition
4. Check container health checks

### RDS Connection Issues

**Issue**: Application can't connect to RDS

**Solutions**:

1. Check security group rules:
   ```bash
   # Get the RDS security group
   RDS_SG=$(aws rds describe-db-instances --db-instance-identifier expertconnect-db --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text)
   
   # Check inbound rules
   aws ec2 describe-security-groups --group-ids $RDS_SG
   ```

2. Verify subnet configuration:
   ```bash
   aws rds describe-db-subnet-groups --db-subnet-group-name expertconnect-db-subnet
   ```

3. Test connection from EC2 instance in the same VPC:
   ```bash
   # Launch a test EC2 instance in the same VPC
   # Install PostgreSQL client
   sudo apt update
   sudo apt install postgresql-client
   
   # Test connection
   psql -h your-db-endpoint.rds.amazonaws.com -U expertconnect -d expertconnect
   ```

## Performance Issues

### Slow API Response Times

**Issue**: API endpoints respond slowly

**Solutions**:

1. Enable Django debug toolbar in development:
   ```python
   # Install
   pip install django-debug-toolbar
   
   # Add to INSTALLED_APPS in settings.py
   INSTALLED_APPS = [
       # ...
       'debug_toolbar',
   ]
   
   # Add middleware
   MIDDLEWARE = [
       # ...
       'debug_toolbar.middleware.DebugToolbarMiddleware',
   ]
   
   # Configure
   INTERNAL_IPS = [
       '127.0.0.1',
   ]
   ```

2. Optimize database queries:
   - Use `select_related()` and `prefetch_related()`
   - Add appropriate indexes
   - Use Django's `QuerySet.explain()` to analyze queries

3. Implement caching:
   ```python
   # In settings.py
   CACHES = {
       'default': {
           'BACKEND': 'django.core.cache.backends.redis.RedisCache',
           'LOCATION': 'redis://redis:6379/1',
       }
   }
   
   # In views
   from django.views.decorators.cache import cache_page
   
   @cache_page(60 * 15)  # Cache for 15 minutes
   def my_view(request):
       # ...
   ```

### Frontend Performance Issues

**Issue**: Slow page loads or UI interactions

**Solutions**:

1. Analyze with Lighthouse in Chrome DevTools
2. Optimize bundle size:
   ```bash
   # Analyze bundle
   npm install -g webpack-bundle-analyzer
   
   # Add to next.config.js
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   })
   module.exports = withBundleAnalyzer({
     // your Next.js config
   })
   
   # Run analysis
   ANALYZE=true npm run build
   ```

3. Implement code splitting and lazy loading:
   ```javascript
   import dynamic from 'next/dynamic'
   
   const DynamicComponent = dynamic(() => import('../components/HeavyComponent'))
   ```

4. Optimize images:
   - Use Next.js Image component
   - Implement responsive images
   - Use WebP format where supported

## Security Issues

### Authentication Problems

**Issue**: Login or registration not working

**Solutions**:

1. Check authentication settings in Django:
   ```python
   # In settings.py
   AUTHENTICATION_BACKENDS = [
       'django.contrib.auth.backends.ModelBackend',
   ]
   ```

2. Verify JWT configuration if using token authentication:
   ```python
   # In settings.py
   REST_FRAMEWORK = {
       'DEFAULT_AUTHENTICATION_CLASSES': [
           'rest_framework_simplejwt.authentication.JWTAuthentication',
       ],
   }
   
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
   }
   ```

3. Check for CSRF issues in forms:
   - Ensure CSRF token is included in forms
   - Verify CSRF_TRUSTED_ORIGINS in settings.py

### SSL/TLS Issues

**Issue**: HTTPS not working or certificate errors

**Solutions**:

1. For local development with self-signed certificates:
   ```bash
   # Generate self-signed certificate
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout localhost.key -out localhost.crt
   ```

2. For AWS with CloudFront:
   ```bash
   # Request certificate in ACM
   aws acm request-certificate \
       --domain-name yourdomain.com \
       --validation-method DNS \
       --subject-alternative-names www.yourdomain.com
   ```

3. Check certificate expiration:
   ```bash
   # For local certificate
   openssl x509 -enddate -noout -in localhost.crt
   
   # For ACM certificate
   aws acm describe-certificate --certificate-arn your-certificate-arn --query "Certificate.NotAfter"
   ```

### Data Protection Issues

**Issue**: Sensitive data exposure

**Solutions**:

1. Verify environment variables are not exposed:
   ```javascript
   // Check frontend code for direct references to secrets
   // Use environment variables with NEXT_PUBLIC_ prefix only for public data
   ```

2. Check Django settings for debug mode:
   ```python
   # In settings.py for production
   DEBUG = False
   ```

3. Implement proper data encryption:
   ```python
   # For sensitive fields in Django models
   from django.db import models
   from django_cryptography.fields import encrypt
   
   class PaymentInfo(models.Model):
       user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
       card_number = encrypt(models.CharField(max_length=16))
       expiry_date = encrypt(models.CharField(max_length=5))
   ```

## Logging and Debugging

### Enabling Detailed Logs

**Issue**: Not enough information in logs to diagnose problems

**Solutions**:

1. Configure Django logging:
   ```python
   # In settings.py
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'verbose': {
               'format': '{levelname} {asctime} {module} {message}',
               'style': '{',
           },
       },
       'handlers': {
           'file': {
               'level': 'DEBUG',
               'class': 'logging.FileHandler',
               'filename': 'debug.log',
               'formatter': 'verbose',
           },
           'console': {
               'level': 'INFO',
               'class': 'logging.StreamHandler',
               'formatter': 'verbose',
           },
       },
       'loggers': {
           'django': {
               'handlers': ['file', 'console'],
               'level': 'INFO',
               'propagate': True,
           },
           'expertconnect': {
               'handlers': ['file', 'console'],
               'level': 'DEBUG',
               'propagate': True,
           },
       },
   }
   ```

2. Add custom logging in your code:
   ```python
   import logging
   
   logger = logging.getLogger('expertconnect')
   
   def some_function():
       try:
           # Some operation
           logger.info('Operation completed successfully')
       except Exception as e:
           logger.error(f'Operation failed: {str(e)}', exc_info=True)
   ```

3. For frontend, use browser developer tools:
   - Console for JavaScript errors
   - Network tab for API requests
   - Application tab for storage and cache

### Remote Debugging

**Issue**: Need to debug production environment

**Solutions**:

1. For AWS ECS, use ECS Exec:
   ```bash
   # Get task ARN
   TASK_ARN=$(aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend --query "taskArns[0]" --output text)
   
   # Connect to container
   aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "/bin/bash"
   ```

2. Use Django Debug Toolbar with IP restrictions:
   ```python
   # In settings.py
   INTERNAL_IPS = [
       '127.0.0.1',
       # Add your IP address
   ]
   ```

3. Implement Sentry for error tracking:
   ```bash
   # Install Sentry SDK
   pip install sentry-sdk
   
   # Configure in settings.py
   import sentry_sdk
   from sentry_sdk.integrations.django import DjangoIntegration
   
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       integrations=[DjangoIntegration()],
       traces_sample_rate=0.1,
   )
   ```

### Common Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| 500 | Internal Server Error | Check server logs for exceptions |
| 404 | Not Found | Verify URL paths and routing |
| 403 | Forbidden | Check user permissions and authentication |
| 401 | Unauthorized | Verify authentication tokens |
| 400 | Bad Request | Check request format and parameters |
| 504 | Gateway Timeout | Check for long-running operations |
| 502 | Bad Gateway | Verify proxy configuration |

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Docker Documentation](https://docs.docker.com/)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)

If you encounter issues not covered in this guide, please check the project's GitHub repository for updates or open an issue for assistance.
