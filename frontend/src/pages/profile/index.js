import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { userAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

export default function Profile() {
  const router = useRouter();
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [value, setValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    headline: '',
    profile_picture: ''
  });
  const [skills, setSkills] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
      return;
    }

    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        headline: user.headline || '',
        profile_picture: user.profile_picture || ''
      });

      const fetchUserDetails = async () => {
        try {
          setLoading(true);
          // Fetch user skills
          const skillsResponse = await userAPI.getSkills(user.id);
          setSkills(skillsResponse.data);

          // Fetch user availability
          const availabilityResponse = await userAPI.getAvailability(user.id);
          setAvailability(availabilityResponse.data);
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserDetails();
    }
  }, [user, authLoading, router]);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

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
        <Paper sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleTabChange} aria-label="profile tabs">
              <Tab label="Profile" />
              <Tab label="Skills" />
              <Tab label="Availability" />
              <Tab label="Reviews" />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          <TabPanel value={value} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={user.profile_picture || ''}
                  sx={{ width: 150, height: 150, mb: 2 }}
                />
                {!editMode && (
                  <Button variant="outlined" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} md={8}>
                {editMode ? (
                  <Box component="form">
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="first_name"
                          value={profileData.first_name}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="last_name"
                          value={profileData.last_name}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Headline"
                          name="headline"
                          value={profileData.headline}
                          onChange={handleInputChange}
                          placeholder="e.g., Software Engineer at Google"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Bio"
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          multiline
                          rows={4}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                          <Button variant="outlined" onClick={() => setEditMode(false)}>
                            Cancel
                          </Button>
                          <Button variant="contained" onClick={handleSaveProfile}>
                            Save
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {user.first_name} {user.last_name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {user.headline || 'No headline provided'}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      About
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {user.bio || 'No bio provided'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Member since: {new Date(user.date_joined).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Skills Tab */}
          <TabPanel value={value} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Your Skills</Typography>
                  <Button variant="contained" onClick={() => router.push('/profile/add-skill')}>
                    Add Skill
                  </Button>
                </Box>
                {skills.length > 0 ? (
                  <Grid container spacing={2}>
                    {skills.map((skill) => (
                      <Grid item key={skill.id} xs={12} sm={6} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="h6">{skill.skill_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Level: {skill.skill_level}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Experience: {skill.years_experience} years
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button size="small" color="error">
                              Remove
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    You haven't added any skills yet. Add skills to help others find you for meetings.
                  </Typography>
                )}
              </Box>
            )}
          </TabPanel>

          {/* Availability Tab */}
          <TabPanel value={value} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Your Availability</Typography>
                  <Button variant="contained" onClick={() => router.push('/profile/add-availability')}>
                    Add Availability
                  </Button>
                </Box>
                {availability.length > 0 ? (
                  <List>
                    {availability.map((slot) => (
                      <ListItem key={slot.id} divider>
                        <ListItemText
                          primary={slot.day_name}
                          secondary={`${slot.start_time} - ${slot.end_time}`}
                        />
                        <Button size="small" color="error">
                          Remove
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    You haven't set any availability yet. Add your available time slots to receive meeting requests.
                  </Typography>
                )}
              </Box>
            )}
          </TabPanel>

          {/* Reviews Tab */}
          <TabPanel value={value} index={3}>
            <Typography variant="h6" gutterBottom>
              Reviews Received
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No reviews yet. Reviews will appear here after you complete meetings.
              </Typography>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </Layout>
  );
}
