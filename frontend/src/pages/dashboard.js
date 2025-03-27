import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Divider,
  Chip,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Event as EventIcon, 
  CreditCard as CreditCardIcon, 
  Star as StarIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useCreditContext } from '../context/CreditContext';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const { user } = useAuth();
  const { balance, transactions } = useCreditContext();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recommendedExperts, setRecommendedExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalCreditsSpent: 0,
    totalCreditsPurchased: 0,
    averageRating: 0
  });

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      // In a real app, these would be API calls
      // Mock data for demonstration
      setUpcomingMeetings([
        {
          id: 1,
          expertName: 'Dr. Jane Smith',
          expertTitle: 'Senior Software Architect',
          expertAvatar: '/images/expert-1.jpg',
          date: '2025-03-25',
          time: '14:00',
          duration: 60,
          creditsUsed: 100
        },
        {
          id: 2,
          expertName: 'Prof. Michael Johnson',
          expertTitle: 'Data Science Specialist',
          expertAvatar: '/images/expert-2.jpg',
          date: '2025-03-28',
          time: '10:30',
          duration: 30,
          creditsUsed: 50
        }
      ]);

      // Mock recommended experts
      setRecommendedExperts([
        {
          id: 1,
          name: 'Dr. Sarah Williams',
          title: 'AI Research Scientist',
          avatar: '/images/expert-1.jpg',
          rating: 4.9,
          reviewCount: 42,
          rate: 80
        },
        {
          id: 2,
          name: 'James Anderson',
          title: 'UX/UI Design Consultant',
          avatar: '/images/expert-2.jpg',
          rating: 4.7,
          reviewCount: 38,
          rate: 65
        },
        {
          id: 3,
          name: 'Dr. Emily Chen',
          title: 'Blockchain Developer',
          avatar: '/images/expert-3.jpg',
          rating: 4.8,
          reviewCount: 27,
          rate: 90
        }
      ]);

      // Use the first 3 transactions from the context
      setRecentTransactions(transactions.slice(0, 3));

      // Calculate stats
      const totalMeetings = 12; // Mock data
      const totalCreditsSpent = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalCreditsPurchased = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const averageRating = 4.7; // Mock data

      setStats({
        totalMeetings,
        totalCreditsSpent,
        totalCreditsPurchased,
        averageRating
      });
      
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [transactions]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const formatDateTime = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Layout>
      <Box sx={{ bgcolor: 'background.default', py: 4 }}>
        <Container maxWidth="lg">
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Welcome back, <Box component="span" fontWeight="bold" color="primary.main">{user?.name || 'User'}</Box>
            </Typography>
          </Box>
          
          {/* Credit Balance Card */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              color: 'white'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h6" fontWeight="medium" sx={{ opacity: 0.8 }}>
                    Your Credit Balance
                  </Typography>
                  {loading ? (
                    <Skeleton variant="text" width={150} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                      {balance} credits
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                    Use your credits to book consultations with experts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button 
                  variant="contained" 
                  size="large"
                  component={Link}
                  href="/credits"
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    },
                    px: 3
                  }}
                >
                  Buy More Credits
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                      <EventIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Consultations
                    </Typography>
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                      {stats.totalMeetings}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'error.light', mr: 2 }}>
                      <CreditCardIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Credits Spent
                    </Typography>
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                      {stats.totalCreditsSpent}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                      <CreditCardIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Credits Purchased
                    </Typography>
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                      {stats.totalCreditsPurchased}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
                      <StarIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Average Rating
                    </Typography>
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" height={40} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="text.primary" sx={{ mr: 1 }}>
                        {stats.averageRating.toFixed(1)}
                      </Typography>
                      <Rating value={stats.averageRating} precision={0.1} readOnly size="small" />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Main Content Grid */}
          <Grid container spacing={4}>
            {/* Upcoming Consultations */}
            <Grid item xs={12} lg={7}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                      Upcoming Consultations
                    </Typography>
                    <Button 
                      component={Link}
                      href="/meetings"
                      endIcon={<ArrowForwardIcon />}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  {loading ? (
                    Array.from(new Array(2)).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 1 }} />
                      </Box>
                    ))
                  ) : upcomingMeetings.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <PeopleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No upcoming consultations
                      </Typography>
                      <Button 
                        variant="contained" 
                        component={Link}
                        href="/experts"
                        sx={{ mt: 2 }}
                      >
                        Find Experts
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {upcomingMeetings.map((meeting, index) => (
                        <React.Fragment key={meeting.id}>
                          <Paper 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              mb: 2,
                              borderRadius: 2,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={7}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={meeting.expertAvatar} 
                                    alt={meeting.expertName}
                                    sx={{ width: 56, height: 56, mr: 2 }}
                                  />
                                  <Box>
                                    <Typography variant="h6" fontWeight="medium">
                                      {meeting.expertName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {meeting.expertTitle}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={5}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                                  <Chip 
                                    icon={<EventIcon />} 
                                    label={`${formatDate(meeting.date)} at ${formatTime(meeting.time)}`}
                                    sx={{ mb: 1 }}
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {meeting.duration} minutes • {meeting.creditsUsed} credits
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                  <Button 
                                    variant="contained" 
                                    size="small"
                                    component={Link}
                                    href={`/meetings/${meeting.id}`}
                                  >
                                    Join Meeting
                                  </Button>
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                    component={Link}
                                    href={`/meetings/${meeting.id}/reschedule`}
                                  >
                                    Reschedule
                                  </Button>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Transactions */}
            <Grid item xs={12} lg={5}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                      Recent Transactions
                    </Typography>
                    <Button 
                      component={Link}
                      href="/credits"
                      endIcon={<ArrowForwardIcon />}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  {loading ? (
                    Array.from(new Array(3)).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2, mb: 1 }} />
                      </Box>
                    ))
                  ) : recentTransactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CreditCardIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No recent transactions
                      </Typography>
                      <Button 
                        variant="contained" 
                        component={Link}
                        href="/credits"
                        sx={{ mt: 2 }}
                      >
                        Buy Credits
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {recentTransactions.map((transaction, index) => (
                        <React.Fragment key={transaction.id}>
                          <Paper 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              mb: 2,
                              borderRadius: 2
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={8}>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateTime(transaction.createdAt)}
                                </Typography>
                              </Grid>
                              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                                <Typography 
                                  variant="h6" 
                                  fontWeight="bold"
                                  color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                                >
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Balance: {transaction.balanceAfter}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Recommended Experts */}
          <Box sx={{ mt: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold">
                    Recommended Experts
                  </Typography>
                  <Button 
                    component={Link}
                    href="/experts"
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All
                  </Button>
                </Box>
                
                {loading ? (
                  <Grid container spacing={3}>
                    {Array.from(new Array(3)).map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    {recommendedExperts.map(expert => (
                      <Grid item xs={12} sm={6} md={4} key={expert.id}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            borderRadius: 3,
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: 4
                            }
                          }}
                        >
                          <Box sx={{ position: 'relative', height: 140 }}>
                            <Box
                              component="img"
                              src={expert.avatar}
                              alt={expert.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                          <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {expert.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {expert.title}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                              <Rating value={expert.rating} precision={0.1} readOnly size="small" />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({expert.reviewCount})
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              <Box component="span" fontWeight="bold" color="primary.main">
                                {expert.rate}
                              </Box> credits/hour
                            </Typography>
                            
                            <Button 
                              variant="contained" 
                              fullWidth
                              component={Link}
                              href={`/experts/${expert.id}`}
                            >
                              View Profile
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};

export default Dashboard;
