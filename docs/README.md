# ExpertConnect Platform Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Installation Guide](#installation-guide)
4. [User Guide](#user-guide)
5. [Developer Guide](#developer-guide)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)
8. [Future Enhancements](#future-enhancements)

## Introduction

ExpertConnect is a platform where users exchange expertise through scheduled video/audio calls using a credit-based system instead of direct payments. Users earn credits by offering consultations and spend them to receive consultations.

### Key Features

- **Credit-Based Exchange System**: Users receive one free credit upon registration and can earn more by providing consultations or purchasing additional credits.
- **Expert Profiles**: Users can create profiles showcasing their skills and expertise areas.
- **Meeting Scheduling**: Users can request meetings with experts based on availability.
- **Video Conferencing**: Built-in WebRTC-based video conferencing for seamless meetings.
- **Review System**: Post-meeting feedback and ratings to maintain quality.
- **Real-time Messaging**: In-app chat for communication before and after meetings.

## System Architecture

ExpertConnect follows a modern microservices architecture with separate frontend and backend components:

### Backend

- **Framework**: Django with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication
- **Real-time Communication**: Django Channels with WebSockets
- **Video Conferencing**: WebRTC integration

### Frontend

- **Framework**: React.js with Next.js
- **State Management**: React Context API
- **UI Components**: Material-UI
- **API Integration**: Axios for REST API calls
- **WebSocket Client**: For real-time messaging and notifications

### Infrastructure

- **Containerization**: Docker and Docker Compose
- **Deployment**: Configurable for various environments (development, staging, production)
- **File Storage**: Configurable for local or cloud storage (AWS S3)

## Installation Guide

### Prerequisites

- Docker and Docker Compose
- Git

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/expertconnect.git
   cd expertconnect
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```
   
3. Edit the `.env` file with your specific configuration values.

4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin interface: http://localhost:8000/admin/ (username: admin, password: admin_password)

### Manual Installation (Without Docker)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the database:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## User Guide

### Registration and Login

1. Visit the homepage and click "Sign Up"
2. Fill in your details and create an account
3. You'll receive one free credit upon registration
4. Log in with your credentials

### Creating Your Profile

1. Navigate to "Profile" from the dashboard
2. Add your skills, expertise areas, and professional background
3. Set your availability for consultations
4. Upload a profile picture

### Finding Experts

1. Go to "Experts" from the main navigation
2. Browse experts by category or use the search function
3. View expert profiles, skills, and ratings
4. Check their availability calendar

### Requesting a Meeting

1. From an expert's profile, click "Request Meeting"
2. Select a date and time from their available slots
3. Provide a brief description of what you'd like to discuss
4. Confirm the meeting request (requires 1 credit)

### Attending a Meeting

1. When it's time for your meeting, go to "Meetings" from the dashboard
2. Find your confirmed meeting and click "Join Meeting"
3. Allow camera and microphone access when prompted
4. Use the video controls to manage your audio/video and screen sharing

### Earning Credits

1. Complete your profile to appear in expert searches
2. When someone requests a meeting with you, confirm it
3. Attend the meeting at the scheduled time
4. After completion, you'll receive 1 credit

### Purchasing Credits

1. Go to "Credits" from the dashboard
2. Click "Purchase Credits"
3. Select the amount of credits you wish to buy
4. Complete the payment process
5. Credits will be immediately added to your balance

## Developer Guide

### Project Structure

```
expertconnect/
├── backend/               # Django backend
│   ├── expertconnect/     # Main Django project
│   │   ├── api/           # API configuration
│   │   ├── credits/       # Credit system app
│   │   ├── meetings/      # Meetings app
│   │   ├── messaging/     # Messaging app
│   │   └── users/         # User management app
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── api/           # API integration
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── styles/        # CSS styles
│   │   └── utils/         # Utility functions
│   └── package.json       # Node.js dependencies
├── tests/                 # Test suites
│   ├── backend/           # Backend tests
│   └── frontend/          # Frontend tests
├── docker-compose.yml     # Docker Compose configuration
├── .env.example           # Environment variables template
└── deploy.sh              # Deployment script
```

### Backend Development

#### Adding a New API Endpoint

1. Create a new view in the appropriate app's `views.py` file
2. Add serializers in the app's `serializers.py` file
3. Register the view in the app's `urls.py` file
4. Update the main API URLs in `expertconnect/api/urls.py`

#### Database Migrations

After modifying models:

```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend Development

#### Adding a New Page

1. Create a new file in `src/pages/`
2. Import and use components from `src/components/`
3. Add the page to the navigation in `src/components/Layout.js`
4. Update routing in `src/pages/_app.js` if necessary

#### API Integration

1. Add new API methods in `src/api/index.js`
2. Use the API methods in your components or context providers

### Running Tests

Use the provided test script:

```bash
./run_tests.sh
```

Or run tests manually:

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest ../tests/backend/

# Frontend tests
cd frontend
npm test
```

## API Documentation

### Authentication

All API endpoints except for registration and login require authentication.

- **Login**: `POST /api/users/login/`
- **Register**: `POST /api/users/register/`
- **Logout**: `POST /api/users/logout/`

Authentication is handled via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### Users API

- **Get Current User**: `GET /api/users/me/`
- **Update User**: `PUT /api/users/me/`
- **Get User Skills**: `GET /api/user-skills/`
- **Add User Skill**: `POST /api/user-skills/`
- **Get User Availability**: `GET /api/user-availability/`
- **Set User Availability**: `POST /api/user-availability/`

### Credits API

- **Get Credit Balance**: `GET /api/credits/balance/`
- **Get Transactions**: `GET /api/credit-transactions/`
- **Purchase Credits**: `POST /api/payments/purchase_credits/`
- **Transfer Credits**: `POST /api/credits/transfer/`

### Meetings API

- **Get Meetings**: `GET /api/meetings/`
- **Create Meeting**: `POST /api/meetings/`
- **Get Meeting Details**: `GET /api/meetings/{id}/`
- **Update Meeting Status**: `PATCH /api/meetings/{id}/update_status/`
- **Create Review**: `POST /api/reviews/`

### Messaging API

- **Get Messages**: `GET /api/messages/`
- **Send Message**: `POST /api/messages/`
- **Get Notifications**: `GET /api/notifications/`
- **Mark Notification as Read**: `PATCH /api/notifications/{id}/`

## Troubleshooting

### Common Issues

#### Database Connection Errors

- Check that PostgreSQL is running
- Verify database credentials in `.env` file
- Ensure the database exists and is accessible

#### WebSocket Connection Issues

- Check that the WebSocket server is running
- Verify WebSocket URL in frontend configuration
- Check browser console for connection errors

#### Video Conferencing Problems

- Ensure camera and microphone permissions are granted
- Check browser compatibility (WebRTC works best in Chrome, Firefox, and Edge)
- Verify network connectivity and firewall settings

### Logs

- Backend logs: Check Docker logs or Django development server output
- Frontend logs: Check browser console
- Database logs: Check PostgreSQL logs

## Future Enhancements

Potential future improvements for the ExpertConnect platform:

1. **Mobile Applications**: Native mobile apps for iOS and Android
2. **AI-Based Matching**: Intelligent matching of users with relevant experts
3. **Group Sessions**: Support for one-to-many consultations
4. **Advanced Scheduling**: Calendar integration with Google Calendar and Outlook
5. **Premium Subscription**: Subscription model for frequent users
6. **Content Library**: Recorded sessions and knowledge base
7. **Blockchain Integration**: Decentralized credit system using blockchain
8. **Multi-language Support**: Internationalization and localization
9. **Advanced Analytics**: Insights for users and platform administrators
10. **Integration with Learning Management Systems**: For educational institutions
