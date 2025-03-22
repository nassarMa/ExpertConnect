import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMeetings } from '../context/MeetingContext';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import Layout from '../components/Layout';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meetings-tabpanel-${index}`}
      aria-labelledby={`meetings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Meetings() {
  const router = useRouter();
  const { user } = useAuth();
  const { meetings, fetchMeetings, updateMeetingStatus, loading } = useMeetings();
  const [value, setValue] = useState(0);
  const [filteredMeetings, setFilteredMeetings] = useState({
    upcoming: [],
    pending: [],
    past: []
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchMeetings();
  }, [user, router, fetchMeetings]);

  useEffect(() => {
    if (meetings && meetings.length > 0) {
      const now = new Date();
      
      const upcoming = meetings.filter(
        meeting => meeting.status === 'confirmed' && new Date(meeting.scheduled_start) > now
      ).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
      
      const pending = meetings.filter(
        meeting => meeting.status === 'pending'
      ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const past = meetings.filter(
        meeting => meeting.status === 'completed' || 
                  meeting.status === 'cancelled' || 
                  (meeting.status === 'confirmed' && new Date(meeting.scheduled_end) < now)
      ).sort((a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start));
      
      setFilteredMeetings({ upcoming, pending, past });
    }
  }, [meetings]);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleStatusUpdate = async (meetingId, newStatus) => {
    try {
      await updateMeetingStatus(meetingId, { status: newStatus });
      await fetchMeetings();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
    }
  };

  const renderMeetingList = (meetingList) => {
    if (meetingList.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
          No meetings found
        </Typography>
      );
    }

    return (
      <List>
        {meetingList.map((meeting) => (
          <ListItem 
            key={meeting.id} 
            alignItems="flex-start"
            sx={{ 
              mb: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <ListItemAvatar>
              <Avatar>
                <EventIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h6" component="div">
                  {meeting.title}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.primary">
                    {meeting.requester_id === user.id 
                      ? `With: ${meeting.expert_name}` 
                      : `From: ${meeting.requester_name}`}
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(meeting.scheduled_start), 'MMM dd, yyyy h:mm a')} - 
                    {format(new Date(meeting.scheduled_end), 'h:mm a')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {meeting.description || 'No description provided'}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={meeting.status} 
                      color={
                        meeting.status === 'confirmed' ? 'success' :
                        meeting.status === 'pending' ? 'warning' :
                        meeting.status === 'completed' ? 'primary' : 'default'
                      }
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {meeting.category_name && (
                      <Chip 
                        label={meeting.category_name} 
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              }
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => router.push(`/meetings/${meeting.id}`)}
              >
                View Details
              </Button>
              
              {meeting.status === 'pending' && meeting.expert_id === user.id && (
                <Button 
                  variant="contained" 
                  size="small"
                  color="success"
                  onClick={() => handleStatusUpdate(meeting.id, 'confirmed')}
                >
                  Accept
                </Button>
              )}
              
              {meeting.status === 'pending' && (
                <Button 
                  variant="outlined" 
                  size="small"
                  color="error"
                  onClick={() => handleStatusUpdate(meeting.id, 'cancelled')}
                >
                  Cancel
                </Button>
              )}
              
              {meeting.status === 'confirmed' && new Date(meeting.scheduled_end) < new Date() && (
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => handleStatusUpdate(meeting.id, 'completed')}
                >
                  Mark Complete
                </Button>
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Your Meetings
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/meetings/new')}
          >
            Request New Meeting
          </Button>
        </Box>
        
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleTabChange} aria-label="meetings tabs">
              <Tab label={`Upcoming (${filteredMeetings.upcoming.length})`} />
              <Tab label={`Pending (${filteredMeetings.pending.length})`} />
              <Tab label={`Past (${filteredMeetings.past.length})`} />
            </Tabs>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TabPanel value={value} index={0}>
                {renderMeetingList(filteredMeetings.upcoming)}
              </TabPanel>
              <TabPanel value={value} index={1}>
                {renderMeetingList(filteredMeetings.pending)}
              </TabPanel>
              <TabPanel value={value} index={2}>
                {renderMeetingList(filteredMeetings.past)}
              </TabPanel>
            </>
          )}
        </Paper>
      </Container>
    </Layout>
  );
}
