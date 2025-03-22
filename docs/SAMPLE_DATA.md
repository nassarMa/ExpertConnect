# ExpertConnect Platform - Sample Data Scripts

This directory contains scripts to populate your ExpertConnect platform with sample data for testing, demonstration, or development purposes.

## Overview

These scripts will create:
- User accounts (both regular users and experts)
- Categories and skills
- User profiles with skills and availability
- Sample meetings
- Credit transactions
- Reviews and ratings
- Messages between users

## Prerequisites

- ExpertConnect platform installed and running
- Database configured and migrations applied
- Admin superuser created

## Usage Instructions

### 1. Using the All-in-One Script

For a complete setup with all sample data:

```bash
# For local deployment with Docker
docker-compose exec backend python manage.py shell < sample_data/generate_all_data.py

# For manual deployment
cd backend
python manage.py shell < sample_data/generate_all_data.py

# For AWS ECS
TASK_ARN=$(aws ecs list-tasks --cluster expertconnect-prod-cluster --service-name expertconnect-prod-backend --query "taskArns[0]" --output text)
aws ecs execute-command --cluster expertconnect-prod-cluster --task $TASK_ARN --container backend --interactive --command "python manage.py shell < sample_data/generate_all_data.py"
```

### 2. Using Individual Scripts

You can also run individual scripts to generate specific types of data:

```bash
# Generate users
python manage.py shell < sample_data/generate_users.py

# Generate categories and skills
python manage.py shell < sample_data/generate_categories.py

# Generate meetings
python manage.py shell < sample_data/generate_meetings.py

# Generate credit transactions
python manage.py shell < sample_data/generate_credits.py

# Generate messages
python manage.py shell < sample_data/generate_messages.py
```

### 3. Customizing the Data

You can modify the scripts to customize the sample data:

- Adjust the number of users, meetings, etc.
- Change the categories and skills
- Modify the date ranges for meetings
- Adjust credit amounts

## Sample Data Details

### Users

The script creates the following types of users:

- **Regular Users**: 20 users with basic profiles
- **Expert Users**: 30 users with expertise in various categories
- **Admin Users**: 2 users with staff privileges

All users have the password `password123` for testing purposes.

### Categories and Skills

The following categories and skills are created:

1. **Software Development**
   - Python Programming
   - JavaScript Development
   - Mobile App Development
   - Database Design
   - DevOps Engineering

2. **Legal Advice**
   - Contract Law
   - Intellectual Property
   - Business Formation
   - Employment Law
   - Immigration Law

3. **Financial Consulting**
   - Investment Planning
   - Tax Optimization
   - Retirement Planning
   - Debt Management
   - Business Financing

4. **Career Coaching**
   - Resume Writing
   - Interview Preparation
   - Career Transition
   - Salary Negotiation
   - LinkedIn Optimization

5. **Marketing Strategy**
   - Social Media Marketing
   - Content Marketing
   - SEO Optimization
   - Email Marketing
   - Brand Development

6. **Health and Wellness**
   - Nutrition Counseling
   - Fitness Training
   - Mental Health Support
   - Sleep Optimization
   - Stress Management

7. **Education and Tutoring**
   - Mathematics Tutoring
   - Science Education
   - Language Learning
   - Test Preparation
   - Academic Writing

### Meetings

The script generates 100 meetings with the following distribution:

- **Pending Meetings**: 30%
- **Confirmed Meetings**: 20%
- **Completed Meetings**: 40%
- **Cancelled Meetings**: 10%

Meetings are scheduled between 7 days in the past and 14 days in the future.

### Credit Transactions

The following credit transactions are generated:

- **Initial Credits**: For all users
- **Meeting Credits**: Transfers between users for completed meetings
- **Purchased Credits**: Random credit purchases by some users

### Messages

The script generates conversation threads between users, including:

- Pre-meeting inquiries
- Meeting confirmations
- Post-meeting follow-ups
- General questions about expertise

## Script Files

### generate_all_data.py
```python
#!/usr/bin/env python
"""
Generate all sample data for the ExpertConnect platform.
This script calls all other data generation scripts in the correct order.
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

print("Generating sample data for ExpertConnect platform...")

# Import and run individual scripts in order
print("1. Generating users...")
exec(open('sample_data/generate_users.py').read())

print("2. Generating categories and skills...")
exec(open('sample_data/generate_categories.py').read())

print("3. Generating user profiles and skills...")
exec(open('sample_data/generate_profiles.py').read())

print("4. Generating meetings...")
exec(open('sample_data/generate_meetings.py').read())

print("5. Generating credit transactions...")
exec(open('sample_data/generate_credits.py').read())

print("6. Generating messages...")
exec(open('sample_data/generate_messages.py').read())

print("Sample data generation complete!")
```

### generate_users.py
```python
#!/usr/bin/env python
"""
Generate sample users for the ExpertConnect platform.
"""
import os
import sys
import django
from django.contrib.auth.models import User
from django.db import transaction

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Sample user data
regular_users = [
    {"username": "user1", "email": "user1@example.com", "first_name": "John", "last_name": "Doe"},
    {"username": "user2", "email": "user2@example.com", "first_name": "Jane", "last_name": "Smith"},
    # Add more users as needed
]

expert_users = [
    {"username": "expert1", "email": "expert1@example.com", "first_name": "Michael", "last_name": "Johnson"},
    {"username": "expert2", "email": "expert2@example.com", "first_name": "Emily", "last_name": "Williams"},
    # Add more experts as needed
]

admin_users = [
    {"username": "admin1", "email": "admin1@example.com", "first_name": "Admin", "last_name": "User", "is_staff": True},
    {"username": "admin2", "email": "admin2@example.com", "first_name": "Super", "last_name": "Admin", "is_staff": True, "is_superuser": True},
]

# Create users
with transaction.atomic():
    # Create regular users
    for user_data in regular_users:
        if not User.objects.filter(username=user_data["username"]).exists():
            user = User.objects.create_user(
                username=user_data["username"],
                email=user_data["email"],
                password="password123",
                first_name=user_data["first_name"],
                last_name=user_data["last_name"]
            )
            print(f"Created regular user: {user.username}")
    
    # Create expert users
    for user_data in expert_users:
        if not User.objects.filter(username=user_data["username"]).exists():
            user = User.objects.create_user(
                username=user_data["username"],
                email=user_data["email"],
                password="password123",
                first_name=user_data["first_name"],
                last_name=user_data["last_name"]
            )
            print(f"Created expert user: {user.username}")
    
    # Create admin users
    for user_data in admin_users:
        if not User.objects.filter(username=user_data["username"]).exists():
            user = User.objects.create_user(
                username=user_data["username"],
                email=user_data["email"],
                password="password123",
                first_name=user_data["first_name"],
                last_name=user_data["last_name"]
            )
            user.is_staff = user_data.get("is_staff", False)
            user.is_superuser = user_data.get("is_superuser", False)
            user.save()
            print(f"Created admin user: {user.username}")

print(f"Created {len(regular_users)} regular users, {len(expert_users)} expert users, and {len(admin_users)} admin users")
```

### generate_categories.py
```python
#!/usr/bin/env python
"""
Generate sample categories and skills for the ExpertConnect platform.
"""
import os
import sys
import django
from django.db import transaction

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Import models
from users.models import Category, Skill

# Sample categories and skills
categories_data = [
    {
        "name": "Software Development",
        "description": "Software development and programming expertise",
        "skills": [
            "Python Programming",
            "JavaScript Development",
            "Mobile App Development",
            "Database Design",
            "DevOps Engineering"
        ]
    },
    {
        "name": "Legal Advice",
        "description": "Legal consultation and advice",
        "skills": [
            "Contract Law",
            "Intellectual Property",
            "Business Formation",
            "Employment Law",
            "Immigration Law"
        ]
    },
    # Add more categories as needed
]

# Create categories and skills
with transaction.atomic():
    for category_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=category_data["name"],
            defaults={"description": category_data["description"]}
        )
        
        if created:
            print(f"Created category: {category.name}")
        
        # Create skills for this category
        for skill_name in category_data["skills"]:
            skill, skill_created = Skill.objects.get_or_create(
                name=skill_name,
                category=category
            )
            
            if skill_created:
                print(f"Created skill: {skill.name} in category {category.name}")

print(f"Created {Category.objects.count()} categories and {Skill.objects.count()} skills")
```

### generate_profiles.py
```python
#!/usr/bin/env python
"""
Generate sample user profiles and assign skills for the ExpertConnect platform.
"""
import os
import sys
import django
import random
from django.db import transaction
from django.contrib.auth.models import User
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Import models
from users.models import UserProfile, UserSkill, Skill, Category, UserAvailability

# Get all users, skills, and categories
users = User.objects.all()
skills = Skill.objects.all()
categories = Category.objects.all()

# Sample profile data
profile_data = [
    {
        "bio": "Experienced software developer with expertise in web and mobile applications.",
        "hourly_rate": 50,
        "years_experience": 5,
        "education": "Bachelor's in Computer Science",
        "profile_picture": "profiles/default.jpg"
    },
    {
        "bio": "Legal professional specializing in business law and intellectual property.",
        "hourly_rate": 75,
        "years_experience": 8,
        "education": "Juris Doctor, Harvard Law School",
        "profile_picture": "profiles/default.jpg"
    },
    # Add more profile templates as needed
]

# Days of the week
days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Create profiles and assign skills
with transaction.atomic():
    for user in users:
        # Skip if profile already exists
        if hasattr(user, 'userprofile'):
            continue
        
        # Create profile with random data
        profile_template = random.choice(profile_data)
        profile = UserProfile.objects.create(
            user=user,
            bio=profile_template["bio"],
            hourly_rate=random.randint(30, 100),
            years_experience=random.randint(1, 15),
            education=profile_template["education"],
            profile_picture=profile_template["profile_picture"]
        )
        print(f"Created profile for user: {user.username}")
        
        # Assign random skills (2-5 skills per user)
        num_skills = random.randint(2, 5)
        user_skills = random.sample(list(skills), num_skills)
        
        for skill in user_skills:
            UserSkill.objects.create(
                user=user,
                skill=skill,
                proficiency_level=random.randint(1, 5)
            )
            print(f"Assigned skill {skill.name} to user {user.username}")
        
        # Create availability (3-5 time slots per user)
        num_slots = random.randint(3, 5)
        available_days = random.sample(days_of_week, num_slots)
        
        for day in available_days:
            # Random start time between 8 AM and 5 PM
            start_hour = random.randint(8, 17)
            # Duration between 1 and 4 hours
            duration = random.randint(1, 4)
            
            UserAvailability.objects.create(
                user=user,
                day_of_week=day,
                start_time=f"{start_hour}:00",
                end_time=f"{start_hour + duration}:00"
            )
            print(f"Created availability for {user.username} on {day} from {start_hour}:00 to {start_hour + duration}:00")

print(f"Created profiles, skills, and availability for {UserProfile.objects.count()} users")
```

### generate_meetings.py
```python
#!/usr/bin/env python
"""
Generate sample meetings for the ExpertConnect platform.
"""
import os
import sys
import django
import random
from django.db import transaction
from django.contrib.auth.models import User
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Import models
from meetings.models import Meeting, Review

# Get all users
users = list(User.objects.all())

# Meeting statuses and their probabilities
status_choices = [
    ("PENDING", 0.3),    # 30% pending
    ("CONFIRMED", 0.2),  # 20% confirmed
    ("COMPLETED", 0.4),  # 40% completed
    ("CANCELLED", 0.1)   # 10% cancelled
]

# Generate random meetings
num_meetings = 100
now = datetime.now()
start_date = now - timedelta(days=7)  # Meetings from 7 days ago
end_date = now + timedelta(days=14)   # To 14 days in the future

with transaction.atomic():
    for i in range(num_meetings):
        # Select random requester and expert (different users)
        requester = random.choice(users)
        expert = random.choice([u for u in users if u != requester])
        
        # Random meeting time between start_date and end_date
        meeting_time_delta = random.random() * (end_date - start_date).total_seconds()
        meeting_time = start_date + timedelta(seconds=meeting_time_delta)
        
        # Random duration (30 or 60 minutes)
        duration = random.choice([30, 60])
        
        # Random status based on probabilities
        status = random.choices(
            [s[0] for s in status_choices],
            weights=[s[1] for s in status_choices],
            k=1
        )[0]
        
        # Create meeting
        meeting = Meeting.objects.create(
            requester=requester,
            expert=expert,
            scheduled_time=meeting_time,
            duration=duration,
            status=status,
            topic=f"Meeting about {random.choice(['career advice', 'technical help', 'legal consultation', 'financial planning', 'marketing strategy'])}",
            description=f"This is a sample meeting between {requester.username} and {expert.username}."
        )
        print(f"Created meeting {i+1}/{num_meetings}: {requester.username} -> {expert.username} ({status})")
        
        # If meeting is completed, create a review
        if status == "COMPLETED":
            # Random rating between 3 and 5 (mostly positive for demo)
            rating = random.randint(3, 5)
            
            review = Review.objects.create(
                meeting=meeting,
                reviewer=requester,
                reviewee=expert,
                rating=rating,
                comment=f"{'Excellent' if rating == 5 else 'Good' if rating == 4 else 'Satisfactory'} meeting with {expert.username}. {'Highly recommended!' if rating == 5 else 'Would recommend.' if rating == 4 else 'Helpful advice.'}"
            )
            print(f"Created review for meeting {i+1}: {rating} stars")

print(f"Created {num_meetings} meetings and {Review.objects.count()} reviews")
```

### generate_credits.py
```python
#!/usr/bin/env python
"""
Generate sample credit transactions for the ExpertConnect platform.
"""
import os
import sys
import django
import random
from django.db import transaction
from django.contrib.auth.models import User
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Import models
from credits.models import CreditBalance, CreditTransaction
from meetings.models import Meeting

# Get all users and completed meetings
users = User.objects.all()
completed_meetings = Meeting.objects.filter(status="COMPLETED")

# Create initial credit balances for all users
with transaction.atomic():
    for user in users:
        # Skip if balance already exists
        balance, created = CreditBalance.objects.get_or_create(
            user=user,
            defaults={"balance": 1}  # Start with 1 free credit
        )
        
        if created:
            # Create initial credit transaction
            CreditTransaction.objects.create(
                user=user,
                amount=1,
                transaction_type="INITIAL",
                description="Initial free credit"
            )
            print(f"Created initial credit balance for {user.username}")

# Create credit transactions for completed meetings
with transaction.atomic():
    for meeting in completed_meetings:
        # Check if transaction already exists for this meeting
        if CreditTransaction.objects.filter(meeting=meeting).exists():
            continue
        
        # Create transaction for requester (spending credit)
        requester_transaction = CreditTransaction.objects.create(
            user=meeting.requester,
            amount=-1,  # Negative amount for spending
            transaction_type="MEETING",
            description=f"Payment for meeting with {meeting.expert.username}",
            meeting=meeting
        )
        
        # Create transaction for expert (earning credit)
        expert_transaction = CreditTransaction.objects.create(
            user=meeting.expert,
            amount=1,  # Positive amount for earning
            transaction_type="MEETING",
            description=f"Earned from meeting with {meeting.requester.username}",
            meeting=meeting
        )
        
        # Update balances
        requester_balance = CreditBalance.objects.get(user=meeting.requester)
        requester_balance.balance -= 1
        requester_balance.save()
        
        expert_balance = CreditBalance.objects.get(user=meeting.expert)
        expert_balance.balance += 1
        expert_balance.save()
        
        print(f"Created credit transactions for meeting between {meeting.requester.username} and {meeting.expert.username}")

# Create some random credit purchases
num_purchases = 20
with transaction.atomic():
    for i in range(num_purchases):
        # Random user
        user = random.choice(list(users))
        
        # Random amount between 5 and 20
        amount = random.randint(5, 20)
        
        # Random date in the past 30 days
        purchase_date = datetime.now() - timedelta(days=random.randint(0, 30))
        
        # Create transaction
        transaction = CreditTransaction.objects.create(
            user=user,
            amount=amount,
            transaction_type="PURCHASE",
            description=f"Purchased {amount} credits",
            created_at=purchase_date
        )
        
        # Update balance
        balance = CreditBalance.objects.get(user=user)
        balance.balance += amount
        balance.save()
        
        print(f"Created credit purchase for {user.username}: {amount} credits")

print(f"Created credit transactions for {CreditTransaction.objects.count()} transactions")
```

### generate_messages.py
```python
#!/usr/bin/env python
"""
Generate sample messages between users for the ExpertConnect platform.
"""
import os
import sys
import django
import random
from django.db import transaction
from django.contrib.auth.models import User
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Import models
from messaging.models import Message, Conversation
from meetings.models import Meeting

# Get all users and meetings
users = list(User.objects.all())
meetings = list(Meeting.objects.all())

# Sample message templates
pre_meeting_messages = [
    "Hi, I'm interested in scheduling a meeting with you about {topic}. Are you available?",
    "Hello! I saw your profile and would like to discuss {topic}. Do you have time this week?",
    "Greetings! I need some advice on {topic}. Would you be able to help me?",
    "Hi there, I'm looking for expertise in {topic}. Would you be available for a consultation?"
]

confirmation_messages = [
    "That works for me! I've confirmed the meeting.",
    "Perfect, I've accepted the meeting request. Looking forward to it!",
    "Great, I've confirmed our meeting. See you then!",
    "I've approved the meeting. Looking forward to our discussion!"
]

follow_up_messages = [
    "Thank you for the meeting! It was very helpful.",
    "I appreciate your time and advice. The meeting was exactly what I needed.",
    "Thanks for your insights during our meeting. I learned a lot!",
    "Just wanted to say thank you for the excellent advice during our meeting."
]

general_messages = [
    "How many years of experience do you have with {topic}?",
    "Could you tell me more about your background in {topic}?",
    "What's your approach to handling {topic} issues?",
    "Do you have any case studies or examples of your work in {topic}?"
]

# Topics for messages
topics = [
    "Python programming",
    "career development",
    "legal issues",
    "financial planning",
    "marketing strategy",
    "web development",
    "mobile app design",
    "database optimization",
    "cloud architecture",
    "machine learning"
]

# Generate conversations and messages
num_conversations = 50

with transaction.atomic():
    # Create conversations based on meetings
    for meeting in random.sample(meetings, min(num_conversations, len(meetings))):
        # Create or get conversation
        conversation, created = Conversation.objects.get_or_create(
            user1=meeting.requester,
            user2=meeting.expert
        )
        
        if created:
            print(f"Created conversation between {meeting.requester.username} and {meeting.expert.username}")
        
        # Generate message thread based on meeting status
        topic = random.choice(topics)
        
        # Initial inquiry (from requester)
        initial_message = Message.objects.create(
            conversation=conversation,
            sender=meeting.requester,
            recipient=meeting.expert,
            content=random.choice(pre_meeting_messages).format(topic=topic),
            is_read=True
        )
        
        # Response from expert (with delay)
        response_time = initial_message.created_at + timedelta(hours=random.randint(1, 24))
        response = Message.objects.create(
            conversation=conversation,
            sender=meeting.expert,
            recipient=meeting.requester,
            content=f"Hi {meeting.requester.first_name}, I'd be happy to discuss {topic} with you. What specific questions do you have?",
            created_at=response_time,
            is_read=True
        )
        
        # Follow-up from requester (with delay)
        followup_time = response.created_at + timedelta(hours=random.randint(1, 12))
        followup = Message.objects.create(
            conversation=conversation,
            sender=meeting.requester,
            recipient=meeting.expert,
            content=f"Thanks for getting back to me! I'm specifically interested in learning about {random.choice(['best practices', 'common challenges', 'getting started', 'advanced techniques'])} in {topic}.",
            created_at=followup_time,
            is_read=True
        )
        
        # If meeting is confirmed or completed, add confirmation message
        if meeting.status in ["CONFIRMED", "COMPLETED"]:
            confirm_time = followup.created_at + timedelta(hours=random.randint(1, 12))
            confirm = Message.objects.create(
                conversation=conversation,
                sender=meeting.expert,
                recipient=meeting.requester,
                content=random.choice(confirmation_messages),
                created_at=confirm_time,
                is_read=True
            )
        
        # If meeting is completed, add follow-up message
        if meeting.status == "COMPLETED":
            thanks_time = meeting.scheduled_time + timedelta(hours=random.randint(1, 24))
            thanks = Message.objects.create(
                conversation=conversation,
                sender=meeting.requester,
                recipient=meeting.expert,
                content=random.choice(follow_up_messages),
                created_at=thanks_time,
                is_read=random.choice([True, False])  # Some might be unread
            )
            
            # Possible response from expert
            if random.random() > 0.3:  # 70% chance of response
                final_time = thanks.created_at + timedelta(hours=random.randint(1, 24))
                final = Message.objects.create(
                    conversation=conversation,
                    sender=meeting.expert,
                    recipient=meeting.requester,
                    content=f"You're welcome, {meeting.requester.first_name}! Feel free to reach out if you have any more questions about {topic}.",
                    created_at=final_time,
                    is_read=random.choice([True, False])  # Some might be unread
                )
        
        print(f"Generated message thread for meeting between {meeting.requester.username} and {meeting.expert.username}")
    
    # Create some random conversations not tied to meetings
    for i in range(num_conversations - min(num_conversations, len(meetings))):
        # Random users (different from each other)
        user1 = random.choice(users)
        user2 = random.choice([u for u in users if u != user1])
        
        # Create conversation
        conversation, created = Conversation.objects.get_or_create(
            user1=user1,
            user2=user2
        )
        
        if created:
            print(f"Created random conversation between {user1.username} and {user2.username}")
        
        # Generate 1-5 messages
        num_messages = random.randint(1, 5)
        last_time = datetime.now() - timedelta(days=random.randint(1, 30))
        
        for j in range(num_messages):
            # Alternate sender and recipient
            if j % 2 == 0:
                sender, recipient = user1, user2
            else:
                sender, recipient = user2, user1
            
            # Random topic
            topic = random.choice(topics)
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                recipient=recipient,
                content=random.choice(general_messages).format(topic=topic),
                created_at=last_time,
                is_read=random.choice([True, False])
            )
            
            # Update time for next message
            last_time = last_time + timedelta(hours=random.randint(1, 48))
        
        print(f"Generated {num_messages} random messages between {user1.username} and {user2.username}")

print(f"Created {Conversation.objects.count()} conversations with {Message.objects.count()} messages")
```

## Cleanup Script

If you need to remove all sample data and start fresh:

```python
#!/usr/bin/env python
"""
Remove all sample data from the ExpertConnect platform.
"""
import os
import sys
import django
from django.db import transaction

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')
django.setup()

# Import models
from django.contrib.auth.models import User
from users.models import Category, Skill, UserProfile, UserSkill, UserAvailability
from meetings.models import Meeting, Review
from credits.models import CreditBalance, CreditTransaction
from messaging.models import Message, Conversation

with transaction.atomic():
    # Preserve superuser
    superusers = User.objects.filter(is_superuser=True).values_list('id', flat=True)
    
    # Delete all data
    print("Deleting messages...")
    Message.objects.all().delete()
    
    print("Deleting conversations...")
    Conversation.objects.all().delete()
    
    print("Deleting credit transactions...")
    CreditTransaction.objects.all().delete()
    
    print("Deleting credit balances...")
    CreditBalance.objects.all().delete()
    
    print("Deleting reviews...")
    Review.objects.all().delete()
    
    print("Deleting meetings...")
    Meeting.objects.all().delete()
    
    print("Deleting user availability...")
    UserAvailability.objects.all().delete()
    
    print("Deleting user skills...")
    UserSkill.objects.all().delete()
    
    print("Deleting user profiles...")
    UserProfile.objects.all().delete()
    
    print("Deleting skills...")
    Skill.objects.all().delete()
    
    print("Deleting categories...")
    Category.objects.all().delete()
    
    print("Deleting users (except superusers)...")
    User.objects.exclude(id__in=superusers).delete()

print("All sample data has been removed.")
```

## Customization

To customize the sample data generation:

1. Edit the Python scripts to change the number of users, meetings, etc.
2. Modify the categories and skills to match your specific use case
3. Adjust the date ranges for meetings to fit your testing needs
4. Change the credit amounts and transaction types

## Troubleshooting

If you encounter issues running the sample data scripts:

1. Ensure your database migrations are up to date:
   ```bash
   python manage.py migrate
   ```

2. Check for model changes that might affect the scripts:
   ```bash
   python manage.py check
   ```

3. Run scripts individually to isolate issues:
   ```bash
   python manage.py shell < sample_data/generate_users.py
   ```

4. If you get integrity errors, try running the cleanup script first:
   ```bash
   python manage.py shell < sample_data/cleanup_data.py
   ```
