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
  Paper,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Event as EventIcon, 
  AccessTime as AccessTimeIcon,
  CreditCard as CreditCardIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useCreditContext } from '../context/CreditContext';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { balance, transactions } = useCreditContext();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
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
          date: '2025-03-25',
          time: '14:00',
          duration: 60,
          creditsUsed: 100
        },
        {
          id: 2,
          expertName: 'Prof. Michael Johnson',
          expertTitle: 'Data Science Specialist',
          date: '2025-03-28',
          time: '10:30',
          duration: 30,
          creditsUsed: 50
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
                <Typography variant="h6" fontWeight="medium">
                  Credit Balance
                </Typography>
                {loading ? (
                  <Skeleton variant="text" width={120} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                ) : (
                  <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                    {balance}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                  Use credits to book consultations with experts
                </Typography>
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
                    }
                  }}
                >
                  Buy Credits
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  {loading ? (
                    <>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" height={60} />
                      <Skeleton variant="text" width="80%" />
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Total Consultations
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="text.primary">
                        {stats.totalMeetings}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Across all categories
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  {loading ? (
                    <>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" height={60} />
                      <Skeleton variant="text" width="80%" />
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Credits Spent
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="text.primary">
                        {stats.totalCreditsSpent}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        On consultations and services
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  {loading ? (
                    <>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" height={60} />
                      <Skeleton variant="text" width="80%" />
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Credits Purchased
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="text.primary">
                        {stats.totalCreditsPurchased}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total credits bought
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  {loading ? (
                    <>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" height={60} />
                      <Skeleton variant="text" width="80%" />
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Average Rating
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        {stats.averageRating.toFixed(1)}
                        <StarIcon sx={{ ml: 1, color: 'warning.main' }} />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        From your feedback
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Main Content Grid */}
          <Grid container spacing={4}>
            {/* Upcoming Consultations */}
            <Grid item xs={12} md={7}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Upcoming Consultations
                    </Typography>
                    <Button 
                      component={Link}
                      href="/meetings"
                      endIcon={<ArrowForwardIcon />}
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {loading ? (
                    Array(2).fill(0).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 1 }} />
                      </Box>
                    ))
                  ) : upcomingMeetings.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        No upcoming consultations scheduled.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        component={Link}
                        href="/experts"
                      >
                        Find Experts
                      </Button>
                    </Box>
                  ) : (
                    upcomingMeetings.map((meeting) => (
                      <Card 
                        key={meeting.id} 
                        variant="outlined" 
                        sx={{ 
                          mb: 2, 
                          borderRadius: 2,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={7}>
                              <Typography variant="h6" fontWeight="medium">
                                {meeting.expertName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {meeting.expertTitle}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EventIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {formatDate(meeting.date)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AccessTimeIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {formatTime(meeting.time)} ({meeting.duration} min)
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CreditCardIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {meeting.creditsUsed} credits
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={5} sx={{ 
                              display: 'flex', 
                              flexDirection: { xs: 'row', sm: 'column' }, 
                              justifyContent: { xs: 'flex-start', sm: 'center' },
                              alignItems: { xs: 'flex-start', sm: 'flex-end' },
                              gap: 1
                            }}>
                              <Button 
                                variant="contained" 
                                color="primary"
                                fullWidth={!isMobile}
                              >
                                Join Meeting
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="primary"
                                fullWidth={!isMobile}
                              >
                                Reschedule
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Transactions */}
            <Grid item xs={12} md={5}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Recent Transactions
                    </Typography>
                    <Button 
                      component={Link}
                      href="/credits"
                      endIcon={<ArrowForwardIcon />}
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {loading ? (
                    Array(3).fill(0).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 1 }} />
                      </Box>
                    ))
                  ) : recentTransactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        No recent transactions.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        component={Link}
                        href="/credits"
                      >
                        Buy Credits
                      </Button>
                    </Box>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <Card 
                        key={transaction.id} 
                        variant="outlined" 
                        sx={{ 
                          mb: 2, 
                          borderRadius: 2,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={7}>
                              <Typography variant="subtitle2" fontWeight="medium">
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDateTime(transaction.createdAt)}
                              </Typography>
                            </Grid>
                            <Grid item xs={5} sx={{ textAlign: 'right' }}>
                              <Typography 
                                variant="subtitle1" 
                                fontWeight="bold"
                                color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                              >
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Balance: {transaction.balanceAfter}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Recommended Experts */}
          <Box sx={{ mt: 4 }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Recommended Experts
                  </Typography>
                  <Button 
                    component={Link}
                    href="/experts"
                    endIcon={<ArrowForwardIcon />}
                    color="primary"
                  >
                    View All
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {loading ? (
                  <Grid container spacing={3}>
                    {Array(3).fill(0).map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    {[1, 2, 3].map(id => (
                      <Grid item xs={12} sm={6} md={4} key={id}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: theme.shadows[10],
                            }
                          }}
                        >
                          <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.100' }}>
                            <Avatar
                              src={`/images/expert-${id}.jpg`}
                              alt={`Expert ${id}`}
                              variant="rounded"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '16px 16px 0 0'
                              }}
                            />
                          </Box>
                          <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                              Dr. Expert Name
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Professional Title
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 2 }}>
                              {[...Array(5)].map((_, i) => (
                                i < 4 ? 
                                <StarIcon key={i} sx={{ color: 'warning.main', fontSize: 20 }} /> :
                                <StarBorderIcon key={i} sx={{ color: 'warning.main', fontSize: 20 }} />
                              ))}
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                (42)
                              </Typography>
                            </Box>
                            
                            <Chip 
                              label="80 credits/hour" 
                              color="primary" 
                              size="small"
                              sx={{ mb: 2 }}
                            />
                            
                            <Button 
                              variant="contained" 
                              color="primary"
                              fullWidth
                              component={Link}
                              href={`/experts/${id}`}
                              sx={{ mt: 'auto' }}
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
