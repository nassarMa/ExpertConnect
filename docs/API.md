# ExpertConnect - API Documentation

This document provides detailed information about the ExpertConnect platform's API endpoints.

## Authentication

All API endpoints except for registration and login require authentication.

### Authentication Endpoints

#### Register a new user
- **URL**: `/api/users/register/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```

#### Login
- **URL**: `/api/users/login/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "password": "securepassword"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```

#### Logout
- **URL**: `/api/users/logout/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

## User Management

### User Endpoints

#### Get Current User
- **URL**: `/api/users/me/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Software engineer with 5 years of experience",
    "profile_picture": "https://example.com/profile.jpg",
    "date_joined": "2025-03-20T10:00:00Z"
  }
  ```

#### Update User Profile
- **URL**: `/api/users/me/`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Software engineer with 5 years of experience",
    "profile_picture": "https://example.com/profile.jpg"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Software engineer with 5 years of experience",
    "profile_picture": "https://example.com/profile.jpg",
    "date_joined": "2025-03-20T10:00:00Z"
  }
  ```

### User Skills Endpoints

#### Get User Skills
- **URL**: `/api/user-skills/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  [
    {
      "id": 1,
      "user": 1,
      "category": 1,
      "category_name": "Software Development",
      "skill_name": "Python",
      "proficiency_level": "expert"
    },
    {
      "id": 2,
      "user": 1,
      "category": 1,
      "category_name": "Software Development",
      "skill_name": "JavaScript",
      "proficiency_level": "intermediate"
    }
  ]
  ```

#### Add User Skill
- **URL**: `/api/user-skills/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "category": 1,
    "skill_name": "React",
    "proficiency_level": "expert"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 3,
    "user": 1,
    "category": 1,
    "category_name": "Software Development",
    "skill_name": "React",
    "proficiency_level": "expert"
  }
  ```

### User Availability Endpoints

#### Get User Availability
- **URL**: `/api/user-availability/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  [
    {
      "id": 1,
      "user": 1,
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "17:00:00"
    },
    {
      "id": 2,
      "user": 1,
      "day_of_week": 2,
      "start_time": "09:00:00",
      "end_time": "17:00:00"
    }
  ]
  ```

#### Set User Availability
- **URL**: `/api/user-availability/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "day_of_week": 3,
    "start_time": "09:00:00",
    "end_time": "17:00:00"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 3,
    "user": 1,
    "day_of_week": 3,
    "start_time": "09:00:00",
    "end_time": "17:00:00"
  }
  ```

## Credit System

### Credit Endpoints

#### Get Credit Balance
- **URL**: `/api/credits/balance/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "id": 1,
    "user": 1,
    "balance": 5,
    "updated_at": "2025-03-20T15:30:00Z"
  }
  ```

#### Transfer Credits
- **URL**: `/api/credits/transfer/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "meeting_id": 1,
    "amount": 1
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "1 credit(s) transferred successfully",
    "new_balance": 4
  }
  ```

### Credit Transaction Endpoints

#### Get Credit Transactions
- **URL**: `/api/credit-transactions/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  [
    {
      "id": 1,
      "user": 1,
      "username": "johndoe",
      "transaction_type": "initial",
      "amount": 1,
      "description": "Initial free credit",
      "related_meeting_id": null,
      "created_at": "2025-03-20T10:00:00Z"
    },
    {
      "id": 2,
      "user": 1,
      "username": "johndoe",
      "transaction_type": "purchased",
      "amount": 5,
      "description": "Purchased 5 credits for $5.00",
      "related_meeting_id": null,
      "created_at": "2025-03-20T11:00:00Z"
    },
    {
      "id": 3,
      "user": 1,
      "username": "johndoe",
      "transaction_type": "spent",
      "amount": 1,
      "description": "Credit spent for meeting with expert",
      "related_meeting_id": 1,
      "created_at": "2025-03-20T14:00:00Z"
    }
  ]
  ```

### Payment Endpoints

#### Purchase Credits
- **URL**: `/api/payments/purchase_credits/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "payment_method": "credit_card",
    "amount": "10.00",
    "credits_to_purchase": 10
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "payment": {
      "id": 1,
      "user": 1,
      "payment_method": "credit_card",
      "amount": "10.00",
      "currency": "USD",
      "status": "completed",
      "credits_purchased": 10,
      "transaction_id": "sim_1_10_10",
      "created_at": "2025-03-20T16:00:00Z"
    },
    "transaction": {
      "id": 4,
      "user": 1,
      "username": "johndoe",
      "transaction_type": "purchased",
      "amount": 10,
      "description": "Purchased 10 credits for $10.00",
      "related_meeting_id": null,
      "created_at": "2025-03-20T16:00:00Z"
    },
    "new_balance": 14
  }
  ```

## Meeting System

### Meeting Endpoints

#### Get Meetings
- **URL**: `/api/meetings/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status`: Filter by status (pending, confirmed, completed, cancelled)
  - `role`: Filter by role (requester, expert)
- **Response**: 
  ```json
  [
    {
      "id": 1,
      "title": "JavaScript Consultation",
      "description": "Need help with React hooks",
      "requester_id": 1,
      "requester_name": "John Doe",
      "expert_id": 2,
      "expert_name": "Jane Smith",
      "status": "confirmed",
      "category_id": 1,
      "category_name": "Software Development",
      "scheduled_start": "2025-03-21T10:00:00Z",
      "scheduled_end": "2025-03-21T11:00:00Z",
      "created_at": "2025-03-20T14:00:00Z"
    },
    {
      "id": 2,
      "title": "Career Advice",
      "description": "Seeking advice on career transition",
      "requester_id": 1,
      "requester_name": "John Doe",
      "expert_id": 3,
      "expert_name": "Bob Johnson",
      "status": "pending",
      "category_id": 2,
      "category_name": "Career Development",
      "scheduled_start": "2025-03-22T15:00:00Z",
      "scheduled_end": "2025-03-22T16:00:00Z",
      "created_at": "2025-03-20T15:00:00Z"
    }
  ]
  ```

#### Create Meeting
- **URL**: `/api/meetings/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "Python Debugging Session",
    "description": "Need help with a complex debugging issue",
    "expert_id": 2,
    "category_id": 1,
    "scheduled_start": "2025-03-23T10:00:00Z",
    "scheduled_end": "2025-03-23T11:00:00Z"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 3,
    "title": "Python Debugging Session",
    "description": "Need help with a complex debugging issue",
    "requester_id": 1,
    "requester_name": "John Doe",
    "expert_id": 2,
    "expert_name": "Jane Smith",
    "status": "pending",
    "category_id": 1,
    "category_name": "Software Development",
    "scheduled_start": "2025-03-23T10:00:00Z",
    "scheduled_end": "2025-03-23T11:00:00Z",
    "created_at": "2025-03-20T16:30:00Z"
  }
  ```

#### Get Meeting Details
- **URL**: `/api/meetings/{id}/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "id": 1,
    "title": "JavaScript Consultation",
    "description": "Need help with React hooks",
    "requester_id": 1,
    "requester_name": "John Doe",
    "expert_id": 2,
    "expert_name": "Jane Smith",
    "status": "confirmed",
    "category_id": 1,
    "category_name": "Software Development",
    "scheduled_start": "2025-03-21T10:00:00Z",
    "scheduled_end": "2025-03-21T11:00:00Z",
    "created_at": "2025-03-20T14:00:00Z",
    "reviews": [
      {
        "id": 1,
        "reviewer_id": 1,
        "reviewer_name": "John Doe",
        "reviewee_id": 2,
        "reviewee_name": "Jane Smith",
        "rating": 5,
        "review_text": "Excellent session, very helpful!",
        "created_at": "2025-03-21T11:30:00Z"
      }
    ]
  }
  ```

#### Update Meeting Status
- **URL**: `/api/meetings/{id}/update_status/`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "confirmed"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 2,
    "status": "confirmed",
    "updated_at": "2025-03-20T16:45:00Z"
  }
  ```

### Review Endpoints

#### Create Review
- **URL**: `/api/reviews/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "meeting_id": 1,
    "reviewee_id": 2,
    "rating": 5,
    "review_text": "Excellent session, very helpful!"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 1,
    "meeting_id": 1,
    "reviewer_id": 1,
    "reviewer_name": "John Doe",
    "reviewee_id": 2,
    "reviewee_name": "Jane Smith",
    "rating": 5,
    "review_text": "Excellent session, very helpful!",
    "created_at": "2025-03-21T11:30:00Z"
  }
  ```

## Messaging System

### Message Endpoints

#### Get Messages
- **URL**: `/api/messages/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `with_user`: Filter messages with a specific user
- **Response**: 
  ```json
  [
    {
      "id": 1,
      "sender_id": 1,
      "sender_name": "John Doe",
      "receiver_id": 2,
      "receiver_name": "Jane Smith",
      "content": "Hello, I'm looking forward to our meeting tomorrow.",
      "is_read": true,
      "created_at": "2025-03-20T18:00:00Z"
    },
    {
      "id": 2,
      "sender_id": 2,
      "sender_name": "Jane Smith",
      "receiver_id": 1,
      "receiver_name": "John Doe",
      "content": "Hi John, me too! I've prepared some materials for our discussion.",
      "is_read": true,
      "created_at": "2025-03-20T18:05:00Z"
    }
  ]
  ```

#### Send Message
- **URL**: `/api/messages/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "receiver_id": 2,
    "content": "Do you have any specific topics you'd like to focus on?"
  }
  ```
- **Response**: 
  ```json
  {
    "id": 3,
    "sender_id": 1,
    "sender_name": "John Doe",
    "receiver_id": 2,
    "receiver_name": "Jane Smith",
    "content": "Do you have any specific topics you'd like to focus on?",
    "is_read": false,
    "created_at": "2025-03-20T18:10:00Z"
  }
  ```

### Notification Endpoints

#### Get Notifications
- **URL**: `/api/notifications/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `is_read`: Filter by read status (true, false)
- **Response**: 
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "title": "Meeting Confirmed",
      "content": "Your meeting 'JavaScript Consultation' has been confirmed.",
      "notification_type": "meeting_confirmed",
      "related_id": 1,
      "is_read": false,
      "created_at": "2025-03-20T15:00:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "title": "New Message",
      "content": "You have a new message from Jane Smith.",
      "notification_type": "new_message",
      "related_id": 2,
      "is_read": false,
      "created_at": "2025-03-20T18:05:00Z"
    }
  ]
  ```

#### Mark Notification as Read
- **URL**: `/api/notifications/{id}/`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "is_read": true
  }
  ```
- **Response**: 
  ```json
  {
    "id": 1,
    "is_read": true,
    "updated_at": "2025-03-20T18:15:00Z"
  }
  ```

## WebSocket API

The ExpertConnect platform uses WebSockets for real-time features like messaging and notifications.

### Connection

Connect to the WebSocket server at:
```
ws://localhost:8000/ws/
```

Authentication is required via token in the URL:
```
ws://localhost:8000/ws/?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Channels

#### Chat Channel
- **URL**: `ws://localhost:8000/ws/chat/{receiver_id}/`
- **Events**:
  - `message.send`: Send a message
    ```json
    {
      "type": "message.send",
      "content": "Hello, how are you?"
    }
    ```
  - `message.receive`: Receive a message
    ```json
    {
      "type": "message.receive",
      "message": {
        "id": 4,
        "sender_id": 2,
        "sender_name": "Jane Smith",
        "receiver_id": 1,
        "receiver_name": "John Doe",
        "content": "I'm doing well, thanks!",
        "is_read": false,
        "created_at": "2025-03-20T18:20:00Z"
      }
    }
    ```

#### Notification Channel
- **URL**: `ws://localhost:8000/ws/notifications/`
- **Events**:
  - `notification.receive`: Receive a notification
    ```json
    {
      "type": "notification.receive",
      "notification": {
        "id": 3,
        "user_id": 1,
        "title": "Meeting Request",
        "content": "You have a new meeting request from Bob Johnson.",
        "notification_type": "meeting_request",
        "related_id": 3,
        "is_read": false,
        "created_at": "2025-03-20T19:00:00Z"
      }
    }
    ```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a message explaining the error:

```json
{
  "error": "Meeting not found"
}
```

Or for validation errors:

```json
{
  "errors": {
    "scheduled_start": ["This field is required."],
    "expert_id": ["Expert with this ID does not exist."]
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse. The current limits are:

- Authentication endpoints: 10 requests per minute
- Other endpoints: 60 requests per minute

When rate limited, the API returns a `429 Too Many Requests` status code with headers indicating the limit and when it resets:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1616252400
```
