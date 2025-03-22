import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditContext';
import { useMeetings } from '../context/MeetingContext';
import { useMessaging } from '../context/MessagingContext';
import { useRouter } from 'next/router';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  CreditCard as CreditCardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Layout component will be created later
import Layout from '../components/Layout';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { balance, loading: creditLoading } = useCredits();
  const { meetings, loading: meetingsLoading } = useMeetings();
  const { notifications, loading: notificationsLoading } = useMessaging();
  
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user && !authLoading) {
      router.push('/login');
    }
    
    // Filter upcoming meetings
    if (meetings && meetings.length > 0) {
      const upcoming = meetings
        .filter(meeting => meeting.status === 'confirmed' && new Date(meeting.scheduled_start) > new Date())
        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
        .slice(0, 3);
      setUpcomingMeetings(upcoming);
    }
    
    // Filter unread notifications
    if (notifications && notifications.length > 0) {
      const unread = notifications
        .filter(notification => !notification.is_read)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setUnreadNotifications(unread);
    }
  }, [user, authLoading, meetings, notifications, router]);
  
  if (authLoading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Welcome Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h4" gutterBottom>
                Welcome back, {user.first_name}!
              </Typography>
              <Typography variant="body1">
                Connect with experts or share your expertise on ExpertConnect.
              </Typography>
            </Paper>
          </Grid>
          
          {/* Credit Balance */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
              <Typography variant="h6" gutterBottom>
                Your Credits
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                {creditLoading ? (
                  <CircularProgress />
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                      {balance}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Credits
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      sx={{ mt: 2 }}
                      onClick={() => router.push('/credits/purchase')}
                    >
                      Buy Credits
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Upcoming Meetings */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Meetings
              </Typography>
              {meetingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <CircularProgress />
                </Box>
              ) : upcomingMeetings.length > 0 ? (
                <List>
                  {upcomingMeetings.map((meeting) => (
                    <ListItem 
                      key={meeting.id} 
                      button 
                      onClick={() => router.push(`/meetings/${meeting.id}`)}
                      divider
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={meeting.title} 
                        secondary={`${format(new Date(meeting.scheduled_start), 'MMM dd, yyyy h:mm a')} with ${meeting.requester_id === user.id ? meeting.expert_name : meeting.requester_name}`} 
                      />
                      <Chip 
                        label={meeting.status} 
                        color={meeting.status === 'confirmed' ? 'success' : 'default'} 
                        size="small" 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    No upcoming meetings
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/meetings')}
                >
                  View All
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Find Experts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 240 }}>
              <Typography variant="h6" gutterBottom>
                Find Experts
              </Typography>
              <Typography variant="body2" paragraph>
                Connect with specialists in various fields to get the advice you need.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1, flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => router.push('/experts')}
                >
                  Browse Experts
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Notifications */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 240 }}>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              {notificationsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <CircularProgress />
                </Box>
              ) : unreadNotifications.length > 0 ? (
                <List>
                  {unreadNotifications.map((notification) => (
                    <ListItem 
                      key={notification.id} 
                      button 
                      divider
                    >
                      <ListItemText 
                        primary={notification.notification_type.replace('_', ' ')} 
                        secondary={notification.content} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/notifications')}
                >
                  View All
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
