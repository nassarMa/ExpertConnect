import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  Button, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton,
  Snackbar, Alert, Switch, FormControlLabel,
  Card, CardContent, CardActions, Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const PaymentGateways = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentGateway, setCurrentGateway] = useState(null);
  const [isNewGateway, setIsNewGateway] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/admin/payment-gateways');
          return;
        }

        const response = await axios.get('/api/users/me/', {
          headers: { Authorization: `Token ${token}` }
        });

        if (!response.data.is_admin) {
          router.push('/dashboard');
          return;
        }

        // Fetch payment gateways
        fetchGateways();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        router.push('/login?redirect=/admin/payment-gateways');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/payment-gateways/', {
        headers: { Authorization: `Token ${token}` }
      });
      setGateways(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching payment gateways');
      setLoading(false);
    }
  };

  const handleOpenDialog = (gateway = null) => {
    if (gateway) {
      setCurrentGateway(gateway);
      setIsNewGateway(false);
    } else {
      setCurrentGateway({
        gateway_type: 'paypal',
        is_active: false,
        api_key: '',
        api_secret: '',
        sandbox_mode: true,
        additional_config: {}
      });
      setIsNewGateway(true);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGateway(null);
    setIsNewGateway(false);
  };

  const handleSaveGateway = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (isNewGateway) {
        response = await axios.post('/api/admin/payment-gateways/', currentGateway, {
          headers: { Authorization: `Token ${token}` }
        });
        
        // Update local state
        setGateways([...gateways, response.data]);
        
        setSnackbar({
          open: true,
          message: 'Payment gateway created successfully',
          severity: 'success'
        });
      } else {
        response = await axios.put(`/api/admin/payment-gateways/${currentGateway.id}/`, currentGateway, {
          headers: { Authorization: `Token ${token}` }
        });
        
        // Update local state
        setGateways(gateways.map(gateway => 
          gateway.id === currentGateway.id ? response.data : gateway
        ));
        
        setSnackbar({
          open: true,
          message: 'Payment gateway updated successfully',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error saving payment gateway',
        severity: 'error'
      });
    }
  };

  const handleDeleteGateway = async (gatewayId) => {
    if (!window.confirm('Are you sure you want to delete this payment gateway?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/payment-gateways/${gatewayId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Update local state
      setGateways(gateways.filter(gateway => gateway.id !== gatewayId));
      
      setSnackbar({
        open: true,
        message: 'Payment gateway deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error deleting payment gateway',
        severity: 'error'
      });
    }
  };

  const handleToggleActive = async (gateway) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/payment-gateways/${gateway.id}/toggle_active/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Update local state
      setGateways(gateways.map(g => 
        g.id === gateway.id ? { ...g, is_active: !g.is_active } : g
      ));
      
      setSnackbar({
        open: true,
        message: `Payment gateway ${gateway.is_active ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error toggling payment gateway status',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getGatewayTypeLabel = (type) => {
    switch (type) {
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Stripe';
      case 'credit_card':
        return 'Credit Card';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <Typography variant="h4">Loading Payment Gateways...</Typography>
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
            Payment Gateway Configuration
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/admin')}
            >
              Back to Dashboard
            </Button>
            
            <Button 
              variant="contained" 
              color="success"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Payment Gateway
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {gateways.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    No Payment Gateways Configured
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Add a payment gateway to enable credit purchases.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add Payment Gateway
                  </Button>
                </Paper>
              </Grid>
            ) : (
              gateways.map(gateway => (
                <Grid item xs={12} md={6} key={gateway.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" component="h2">
                          {getGatewayTypeLabel(gateway.gateway_type)}
                        </Typography>
                        <Box>
                          {gateway.is_active ? (
                            <Chip 
                              icon={<CheckIcon />} 
                              label="Active" 
                              color="success" 
                              size="small"
                            />
                          ) : (
                            <Chip 
                              icon={<CloseIcon />} 
                              label="Inactive" 
                              color="error" 
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>API Key:</strong> ••••••••••••••••
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Environment:</strong> {gateway.sandbox_mode ? 'Sandbox/Test' : 'Production'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        <strong>Last Updated:</strong> {new Date(gateway.updated_at).toLocaleString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleToggleActive(gateway)}
                        color={gateway.is_active ? "error" : "success"}
                      >
                        {gateway.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleOpenDialog(gateway)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteGateway(gateway.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
        
        {/* Add/Edit Gateway Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isNewGateway ? 'Add Payment Gateway' : 'Edit Payment Gateway'}
          </DialogTitle>
          <DialogContent>
            {currentGateway && (
              <Box component="form" noValidate sx={{ mt: 1 }}>
                <TextField
                  select
                  margin="normal"
                  required
                  fullWidth
                  label="Gateway Type"
                  value={currentGateway.gateway_type}
                  onChange={(e) => setCurrentGateway({...currentGateway, gateway_type: e.target.value})}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="credit_card">Credit Card</option>
                </TextField>
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="API Key"
                  value={currentGateway.api_key}
                  onChange={(e) => setCurrentGateway({...currentGateway, api_key: e.target.value})}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="API Secret"
                  type="password"
                  value={currentGateway.api_secret}
                  onChange={(e) => setCurrentGateway({...currentGateway, api_secret: e.target.value})}
                />
                
                <Box mt={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentGateway.sandbox_mode}
                        onChange={(e) => setCurrentGateway({
                          ...currentGateway, 
                          sandbox_mode: e.target.checked
                        })}
                      />
                    }
                    label="Sandbox/Test Mode"
                  />
                </Box>
                
                <Box mt={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentGateway.is_active}
                        onChange={(e) => setCurrentGateway({
                          ...currentGateway, 
                          is_active: e.target.checked
                        })}
                      />
                    }
                    label="Active"
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveGateway} variant="contained" color="primary">
              {isNewGateway ? 'Add Gateway' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default PaymentGateways;
