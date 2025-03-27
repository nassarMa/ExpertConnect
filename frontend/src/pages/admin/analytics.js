import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Card, CardContent, CardHeader, Divider,
  List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Button, Tabs, Tab, CircularProgress
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  PeopleOutline, CreditCard, Settings, 
  Assessment, Payment, History 
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

// Analytics Dashboard component
const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    total_credits_purchased: 0,
    total_revenue: 0,
    total_meetings: 0,
    completed_meetings: 0,
    average_rating: 0
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days
  const router = useRouter();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/admin/analytics');
          return;
        }

        const response = await axios.get('/api/users/me/', {
          headers: { Authorization: `Token ${token}` }
        });

        if (!response.data.is_admin) {
          router.push('/dashboard');
          return;
        }

        // Fetch analytics data
        fetchAnalyticsData();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        router.push('/login?redirect=/admin/analytics');
      }
    };

    checkAdmin();
  }, [router, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`/api/admin/stats/?days=${timeRange}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setStats(statsResponse.data);
      
      // Fetch user growth data (mock data for now)
      // In a real implementation, this would be an API endpoint
      const mockUserGrowth = [
        { name: 'Jan', users: 40 },
        { name: 'Feb', users: 55 },
        { name: 'Mar', users: 70 },
        { name: 'Apr', users: 85 },
        { name: 'May', users: 110 },
        { name: 'Jun', users: 135 }
      ];
      setUserGrowth(mockUserGrowth);
      
      // Fetch revenue data (mock data for now)
      const mockRevenueData = [
        { name: 'Jan', revenue: 400 },
        { name: 'Feb', revenue: 550 },
        { name: 'Mar', revenue: 700 },
        { name: 'Apr', revenue: 850 },
        { name: 'May', revenue: 1100 },
        { name: 'Jun', revenue: 1350 }
      ];
      setRevenueData(mockRevenueData);
      
      // Fetch category data (mock data for now)
      const mockCategoryData = [
        { name: 'Technology', value: 35 },
        { name: 'Business', value: 25 },
        { name: 'Design', value: 15 },
        { name: 'Marketing', value: 10 },
        { name: 'Education', value: 10 },
        { name: 'Other', value: 5 }
      ];
      setCategoryData(mockCategoryData);
      
      setLoading(false);
    } catch (err) {
      setError('Error fetching analytics data');
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (days) => {
    setTimeRange(days);
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>Loading Analytics...</Typography>
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
            Analytics Dashboard
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/admin')}
            >
              Back to Dashboard
            </Button>
            
            <Box>
              <Button 
                variant={timeRange === 7 ? "contained" : "outlined"}
                onClick={() => handleTimeRangeChange(7)}
                sx={{ mr: 1 }}
              >
                7 Days
              </Button>
              <Button 
                variant={timeRange === 30 ? "contained" : "outlined"}
                onClick={() => handleTimeRangeChange(30)}
                sx={{ mr: 1 }}
              >
                30 Days
              </Button>
              <Button 
                variant={timeRange === 90 ? "contained" : "outlined"}
                onClick={() => handleTimeRangeChange(90)}
              >
                90 Days
              </Button>
            </Box>
          </Box>
          
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_users}
                  </Typography>
                  <Typography color="textSecondary">
                    {stats.active_users} active users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${stats.total_revenue}
                  </Typography>
                  <Typography color="textSecondary">
                    {stats.total_credits_purchased} credits sold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h4">
                    {stats.average_rating}/5
                  </Typography>
                  <Typography color="textSecondary">
                    Based on all reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  User Growth
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={userGrowth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Revenue Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Popular Categories
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Key Metrics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="User Retention Rate" 
                      secondary="78%" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Average Session Duration" 
                      secondary="32 minutes" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Conversion Rate" 
                      secondary="12.5%" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Average Revenue Per User" 
                      secondary="$42.80" 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default AnalyticsDashboard;
