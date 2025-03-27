import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Card, CardContent, CardHeader, Divider,
  List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Button, Tabs, Tab
} from '@mui/material';
import { 
  PeopleOutline, CreditCard, Settings, 
  Assessment, Payment, History 
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

// Dashboard stats component
const DashboardStats = ({ stats }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Users
            </Typography>
            <Typography variant="h4">
              {stats.total_users}
            </Typography>
            <Typography color="textSecondary">
              {stats.active_users} active in last 30 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Revenue
            </Typography>
            <Typography variant="h4">
              ${stats.total_revenue}
            </Typography>
            <Typography color="textSecondary">
              {stats.total_credits_purchased} credits purchased
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Meetings
            </Typography>
            <Typography variant="h4">
              {stats.total_meetings}
            </Typography>
            <Typography color="textSecondary">
              {stats.completed_meetings} completed
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Admin Dashboard main component
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    total_credits_purchased: 0,
    total_revenue: 0,
    total_meetings: 0,
    completed_meetings: 0,
    average_rating: 0
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/admin');
          return;
        }

        const response = await axios.get('/api/users/me/', {
          headers: { Authorization: `Token ${token}` }
        });

        if (!response.data.is_admin) {
          router.push('/dashboard');
          return;
        }

        // Fetch dashboard stats
        fetchDashboardStats();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        router.push('/login?redirect=/admin');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/stats/', {
        headers: { Authorization: `Token ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNavigate = (path) => {
    router.push(`/admin/${path}`);
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <Typography variant="h4">Loading Admin Dashboard...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <Typography variant="h4" color="error">{error}</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<Assessment />} label="Overview" />
              <Tab icon={<PeopleOutline />} label="Users" />
              <Tab icon={<CreditCard />} label="Credits" />
              <Tab icon={<Payment />} label="Payments" />
              <Tab icon={<Settings />} label="Settings" />
            </Tabs>
          </Paper>

          {tabValue === 0 && (
            <Box>
              <DashboardStats stats={stats} />
              
              <Box mt={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title="Quick Actions" />
                      <Divider />
                      <CardContent>
                        <List>
                          <ListItem button onClick={() => handleNavigate('users')}>
                            <ListItemAvatar>
                              <Avatar>
                                <PeopleOutline />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary="Manage Users" 
                              secondary="View, edit, and delete user accounts" 
                            />
                          </ListItem>
                          <ListItem button onClick={() => handleNavigate('transactions')}>
                            <ListItemAvatar>
                              <Avatar>
                                <CreditCard />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary="Credit Transactions" 
                              secondary="Manage credit purchases and refunds" 
                            />
                          </ListItem>
                          <ListItem button onClick={() => handleNavigate('payment-gateways')}>
                            <ListItemAvatar>
                              <Avatar>
                                <Payment />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary="Payment Gateways" 
                              secondary="Configure payment methods and settings" 
                            />
                          </ListItem>
                          <ListItem button onClick={() => handleNavigate('logs')}>
                            <ListItemAvatar>
                              <Avatar>
                                <History />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary="Admin Logs" 
                              secondary="View admin activity and audit trail" 
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title="System Status" />
                      <Divider />
                      <CardContent>
                        <Typography variant="body1" paragraph>
                          Average Rating: {stats.average_rating}/5
                        </Typography>
                        <Typography variant="body1" paragraph>
                          Active Payment Gateways: PayPal, Credit Card
                        </Typography>
                        <Typography variant="body1" paragraph>
                          System Status: Operational
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          fullWidth
                          onClick={() => handleNavigate('settings')}
                        >
                          System Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box textAlign="center" py={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleNavigate('users')}
              >
                Go to User Management
              </Button>
            </Box>
          )}

          {tabValue === 2 && (
            <Box textAlign="center" py={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleNavigate('transactions')}
              >
                Go to Credit Transactions
              </Button>
            </Box>
          )}

          {tabValue === 3 && (
            <Box textAlign="center" py={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleNavigate('payment-gateways')}
              >
                Go to Payment Gateway Settings
              </Button>
            </Box>
          )}

          {tabValue === 4 && (
            <Box textAlign="center" py={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleNavigate('settings')}
              >
                Go to System Settings
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default AdminDashboard;
