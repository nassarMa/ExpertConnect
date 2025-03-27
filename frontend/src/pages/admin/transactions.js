import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  Button, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton,
  Snackbar, Alert, Chip
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  MoneyOff as RefundIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const CreditTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
          router.push('/login?redirect=/admin/transactions');
          return;
        }

        const response = await axios.get('/api/users/me/', {
          headers: { Authorization: `Token ${token}` }
        });

        if (!response.data.is_admin) {
          router.push('/dashboard');
          return;
        }

        // Fetch transactions
        fetchTransactions();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        router.push('/login?redirect=/admin/transactions');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/transactions/', {
        headers: { Authorization: `Token ${token}` }
      });
      setTransactions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching transactions');
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenRefundDialog = (transaction) => {
    // Only purchased transactions can be refunded
    if (transaction.transaction_type !== 'purchased') {
      setSnackbar({
        open: true,
        message: 'Only purchased credits can be refunded',
        severity: 'warning'
      });
      return;
    }
    
    setCurrentTransaction(transaction);
    setOpenRefundDialog(true);
  };

  const handleCloseRefundDialog = () => {
    setOpenRefundDialog(false);
    setCurrentTransaction(null);
    setRefundReason('');
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason for the refund',
        severity: 'error'
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/transactions/refund/', {
        transaction_id: currentTransaction.id,
        reason: refundReason
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Refresh transactions
      fetchTransactions();
      
      setSnackbar({
        open: true,
        message: 'Refund processed successfully',
        severity: 'success'
      });
      
      handleCloseRefundDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Error processing refund',
        severity: 'error'
      });
    }
  };

  const handleViewUserDetails = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredTransactions = transactions.filter(transaction => 
    transaction.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'purchased':
        return 'success';
      case 'spent':
        return 'primary';
      case 'earned':
        return 'info';
      case 'refunded':
        return 'error';
      case 'bonus':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <Typography variant="h4">Loading Transactions...</Typography>
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
            Credit Transactions
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => router.push('/admin')}
                sx={{ mr: 2 }}
              >
                Back to Dashboard
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={fetchTransactions}
              >
                Refresh
              </Button>
            </Box>
            
            <TextField
              label="Search Transactions"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Box>
          
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.username}</TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.transaction_type} 
                            color={getTransactionTypeColor(transaction.transaction_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewUserDetails(transaction.user)}
                            title="View User"
                          >
                            <ViewIcon />
                          </IconButton>
                          {transaction.transaction_type === 'purchased' && (
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenRefundDialog(transaction)}
                              title="Process Refund"
                              color="error"
                            >
                              <RefundIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredTransactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
        
        {/* Refund Dialog */}
        <Dialog open={openRefundDialog} onClose={handleCloseRefundDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogContent>
            {currentTransaction && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" gutterBottom>
                  You are about to refund the following transaction:
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>User:</strong> {currentTransaction.username}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Amount:</strong> {currentTransaction.amount} credits
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date:</strong> {new Date(currentTransaction.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Description:</strong> {currentTransaction.description}
                </Typography>
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Refund Reason"
                  multiline
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please provide a reason for this refund"
                />
                
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                  Note: This action cannot be undone. The credits will be deducted from the user's balance.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRefundDialog}>Cancel</Button>
            <Button onClick={handleRefund} variant="contained" color="error">
              Process Refund
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

export default CreditTransactions;
