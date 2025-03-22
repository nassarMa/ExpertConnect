# ExpertConnect Platform - Database Setup Guide

This guide provides detailed instructions for setting up and configuring the database for the ExpertConnect platform. It covers both local and AWS deployment scenarios.

## Table of Contents

1. [Database Requirements](#database-requirements)
2. [Local Database Setup](#local-database-setup)
   - [Using Docker](#using-docker)
   - [Manual PostgreSQL Installation](#manual-postgresql-installation)
   - [Database Configuration](#database-configuration)
3. [AWS RDS Database Setup](#aws-rds-database-setup)
   - [Using CloudFormation (Recommended)](#using-cloudformation-recommended)
   - [Manual RDS Setup](#manual-rds-setup)
   - [Connecting to RDS](#connecting-to-rds)
4. [Database Migration and Initialization](#database-migration-and-initialization)
5. [Database Backup and Restore](#database-backup-and-restore)
6. [Database Maintenance](#database-maintenance)
7. [Troubleshooting Database Issues](#troubleshooting-database-issues)

## Database Requirements

The ExpertConnect platform requires:

- PostgreSQL 13 or higher
- UTF-8 encoding
- Minimum 20GB storage (production)
- Recommended: 2GB RAM or higher for database server

## Local Database Setup

### Using Docker

The easiest way to set up the database locally is using Docker:

1. Ensure Docker and Docker Compose are installed:
   ```bash
   docker --version
   docker-compose --version
   ```

2. The database configuration is already defined in the `docker-compose.yml` file:
   ```yaml
   db:
     image: postgres:13
     volumes:
       - postgres_data:/var/lib/postgresql/data/
     env_file:
       - ./.env
     environment:
       - POSTGRES_PASSWORD=${DB_PASSWORD}
       - POSTGRES_USER=${DB_USER}
       - POSTGRES_DB=${DB_NAME}
     ports:
       - "5432:5432"
   ```

3. Create a `.env` file with database credentials:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file to set database credentials:
   ```
   DB_NAME=expertconnect
   DB_USER=expertconnect_user
   DB_PASSWORD=your_secure_password
   DB_HOST=db
   DB_PORT=5432
   ```

5. Start the database container:
   ```bash
   docker-compose up -d db
   ```

6. Verify the database is running:
   ```bash
   docker-compose ps
   ```

### Manual PostgreSQL Installation

If you prefer to install PostgreSQL directly on your machine:

#### Ubuntu/Debian

1. Install PostgreSQL:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. Start and enable the PostgreSQL service:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

3. Switch to the postgres user and create a database:
   ```bash
   sudo -u postgres psql
   ```

4. In the PostgreSQL prompt, create the database and user:
   ```sql
   CREATE DATABASE expertconnect;
   CREATE USER expertconnect_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE expertconnect TO expertconnect_user;
   \q
   ```

#### macOS

1. Install PostgreSQL using Homebrew:
   ```bash
   brew install postgresql
   ```

2. Start the PostgreSQL service:
   ```bash
   brew services start postgresql
   ```

3. Create the database and user:
   ```bash
   psql postgres
   ```

4. In the PostgreSQL prompt:
   ```sql
   CREATE DATABASE expertconnect;
   CREATE USER expertconnect_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE expertconnect TO expertconnect_user;
   \q
   ```

#### Windows

1. Download and install PostgreSQL from the official website:
   https://www.postgresql.org/download/windows/

2. During installation:
   - Set a password for the postgres user
   - Keep the default port (5432)
   - Select your locale

3. After installation, open pgAdmin (installed with PostgreSQL)

4. Create a new database:
   - Right-click on "Databases" and select "Create" > "Database"
   - Name: expertconnect
   - Owner: postgres

5. Create a new user:
   - Expand "Login/Group Roles"
   - Right-click and select "Create" > "Login/Group Role"
   - Name: expertconnect_user
   - Password: your_secure_password
   - On the "Privileges" tab, enable "Can login?" and "Create database"

6. Grant privileges:
   - Right-click on the expertconnect database
   - Select "Properties" > "Security"
   - Add expertconnect_user and grant all privileges

### Database Configuration

After setting up the database, update your application's `.env` file with the correct database connection information:

```
DB_NAME=expertconnect
DB_USER=expertconnect_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost  # Use 'db' if using Docker
DB_PORT=5432
```

## AWS RDS Database Setup

### Using CloudFormation (Recommended)

The easiest way to set up an RDS database for ExpertConnect on AWS is using our CloudFormation template:

1. Run the AWS deployment script:
   ```bash
   ./aws/deploy-aws.sh
   ```

2. The script will:
   - Create an RDS PostgreSQL instance
   - Configure security groups
   - Set up database credentials
   - Connect the database to your application

3. Database credentials will be saved in `aws/deployment-info.txt`

### Manual RDS Setup

If you prefer to set up RDS manually:

1. Create a security group for the database:
   ```bash
   aws ec2 create-security-group \
       --group-name expertconnect-db-sg \
       --description "Security group for ExpertConnect database" \
       --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)
   ```

2. Note the security group ID:
   ```bash
   DB_SG_ID=$(aws ec2 create-security-group --group-name expertconnect-db-sg --description "Security group for ExpertConnect database" --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text) --output text --query "GroupId")
   echo $DB_SG_ID
   ```

3. Configure security group rules:
   ```bash
   # For development (restrict this in production)
   aws ec2 authorize-security-group-ingress \
       --group-id $DB_SG_ID \
       --protocol tcp \
       --port 5432 \
       --cidr 0.0.0.0/0
   ```

4. Create a DB subnet group:
   ```bash
   # Get subnet IDs
   SUBNET_IDS=$(aws ec2 describe-subnets --query "Subnets[0:2].SubnetId" --output text | tr '\t' ',')
   
   # Create DB subnet group
   aws rds create-db-subnet-group \
       --db-subnet-group-name expertconnect-db-subnet \
       --db-subnet-group-description "Subnet group for ExpertConnect database" \
       --subnet-ids $SUBNET_IDS
   ```

5. Create the RDS instance:
   ```bash
   aws rds create-db-instance \
       --db-instance-identifier expertconnect-db \
       --db-instance-class db.t3.small \
       --engine postgres \
       --engine-version 13.4 \
       --master-username expertconnect \
       --master-user-password your_secure_password \
       --allocated-storage 20 \
       --storage-type gp2 \
       --vpc-security-group-ids $DB_SG_ID \
       --db-subnet-group-name expertconnect-db-subnet \
       --db-name expertconnect \
       --backup-retention-period 7 \
       --no-publicly-accessible \
       --no-multi-az
   ```

6. Wait for the database to be created:
   ```bash
   aws rds wait db-instance-available --db-instance-identifier expertconnect-db
   ```

7. Get the database endpoint:
   ```bash
   aws rds describe-db-instances \
       --db-instance-identifier expertconnect-db \
       --query "DBInstances[0].Endpoint.Address" \
       --output text
   ```

### Connecting to RDS

To connect your application to the RDS database:

1. Update your application's environment variables:
   ```
   DB_NAME=expertconnect
   DB_USER=expertconnect
   DB_PASSWORD=your_secure_password
   DB_HOST=your-db-endpoint.rds.amazonaws.com
   DB_PORT=5432
   ```

2. For ECS deployments, update the task definition with these environment variables

3. To connect to the database directly for management:
   ```bash
   # Install PostgreSQL client if needed
   sudo apt install postgresql-client
   
   # Connect to the database
   psql -h your-db-endpoint.rds.amazonaws.com -U expertconnect -d expertconnect
   ```

## Database Migration and Initialization

After setting up the database, you need to run migrations to create the schema:

### Using Docker

```bash
# If using Docker Compose
docker-compose exec backend python manage.py migrate

# Create a superuser
docker-compose exec backend python manage.py createsuperuser
```

### Manual Migration

```bash
# Activate virtual environment if using one
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser
```

### AWS ECS Migration

For AWS deployments, you can run migrations using ECS exec:

```bash
# Get the task ARN
TASK_ARN=$(aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend --query "taskArns[0]" --output text)

# Run migrations
aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "python manage.py migrate"

# Create a superuser
aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "python manage.py createsuperuser"
```

## Database Backup and Restore

### Local Backup

1. Create a backup:
   ```bash
   # For Docker
   docker-compose exec db pg_dump -U expertconnect_user expertconnect > backup.sql
   
   # For local PostgreSQL
   pg_dump -U expertconnect_user -h localhost expertconnect > backup.sql
   ```

2. Restore from backup:
   ```bash
   # For Docker
   cat backup.sql | docker-compose exec -T db psql -U expertconnect_user expertconnect
   
   # For local PostgreSQL
   psql -U expertconnect_user -h localhost expertconnect < backup.sql
   ```

### AWS RDS Backup

1. Create a manual snapshot:
   ```bash
   aws rds create-db-snapshot \
       --db-instance-identifier expertconnect-db \
       --db-snapshot-identifier expertconnect-backup-$(date +%Y%m%d)
   ```

2. List available snapshots:
   ```bash
   aws rds describe-db-snapshots \
       --db-instance-identifier expertconnect-db \
       --query "DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]" \
       --output table
   ```

3. Restore from a snapshot:
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
       --db-instance-identifier expertconnect-restored \
       --db-snapshot-identifier expertconnect-backup-20250322 \
       --db-instance-class db.t3.small
   ```

## Database Maintenance

Regular maintenance tasks to keep your database healthy:

### Vacuum and Analyze

Run these operations regularly to optimize performance:

```sql
-- Connect to the database
\c expertconnect

-- Vacuum and analyze all tables
VACUUM ANALYZE;
```

### Index Maintenance

Check for unused or duplicate indexes:

```sql
-- Find unused indexes
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    idx_scan as index_scans
FROM
    pg_stat_user_indexes
WHERE
    idx_scan = 0
ORDER BY
    schemaname, relname;
```

### Monitoring Database Size

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('expertconnect'));

-- Check table sizes
SELECT
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM
    pg_catalog.pg_statio_user_tables
ORDER BY
    pg_total_relation_size(relid) DESC;
```

## Troubleshooting Database Issues

### Connection Issues

If you can't connect to the database:

1. Check database credentials in `.env` file
2. Verify the database service is running:
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

4. Verify security group rules (for RDS):
   ```bash
   # Get security group ID
   SG_ID=$(aws rds describe-db-instances --db-instance-identifier expertconnect-db --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text)
   
   # Check inbound rules
   aws ec2 describe-security-groups --group-ids $SG_ID --query "SecurityGroups[0].IpPermissions" --output json
   ```

### Migration Issues

If migrations fail:

1. Check the error message for specific issues

2. For "relation already exists" errors, try:
   ```bash
   python manage.py migrate --fake-initial
   ```

3. For complex migration issues, consider resetting the database:
   ```bash
   # WARNING: This will delete all data
   python manage.py flush
   python manage.py migrate
   ```

### Performance Issues

If the database is slow:

1. Check for long-running queries:
   ```sql
   SELECT
       pid,
       now() - pg_stat_activity.query_start AS duration,
       query
   FROM
       pg_stat_activity
   WHERE
       state = 'active' AND
       now() - pg_stat_activity.query_start > interval '5 minutes'
   ORDER BY
       duration DESC;
   ```

2. Check for table bloat:
   ```sql
   SELECT
       schemaname,
       relname,
       n_dead_tup,
       n_live_tup,
       (n_dead_tup::float / (n_live_tup + n_dead_tup) * 100)::int AS dead_percentage
   FROM
       pg_stat_user_tables
   WHERE
       n_live_tup > 0
   ORDER BY
       dead_percentage DESC;
   ```

3. Run VACUUM ANALYZE to optimize:
   ```sql
   VACUUM ANALYZE;
   ```

### AWS RDS Specific Issues

1. Check Enhanced Monitoring (if enabled):
   ```bash
   aws rds describe-db-instances --db-instance-identifier expertconnect-db --query "DBInstances[0].EnhancedMonitoringResourceArn" --output text
   ```

2. Check CloudWatch metrics:
   ```bash
   aws cloudwatch get-metric-statistics \
       --namespace AWS/RDS \
       --metric-name CPUUtilization \
       --dimensions Name=DBInstanceIdentifier,Value=expertconnect-db \
       --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
       --period 300 \
       --statistics Average
   ```

3. Check for storage issues:
   ```bash
   aws cloudwatch get-metric-statistics \
       --namespace AWS/RDS \
       --metric-name FreeStorageSpace \
       --dimensions Name=DBInstanceIdentifier,Value=expertconnect-db \
       --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
       --period 300 \
       --statistics Average
   ```

4. If storage is low, increase allocated storage:
   ```bash
   aws rds modify-db-instance \
       --db-instance-identifier expertconnect-db \
       --allocated-storage 50 \
       --apply-immediately
   ```
