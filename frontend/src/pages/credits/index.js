import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import Layout from '../components/Layout';

export default function Credits() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, transactions, fetchBalance, fetchTransactions, purchaseCredits, loading, error } = useCredits();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchBalance();
    fetchTransactions();
  }, [user, router, fetchBalance, fetchTransactions]);

  const handlePurchase = async () => {
    try {
      setPurchaseLoading(true);
      setPurchaseError('');
      
      const creditsAmount = parseInt(amount, 10);
      if (isNaN(creditsAmount) || creditsAmount <= 0) {
        setPurchaseError('Please enter a valid amount of credits to purchase');
        return;
      }
      
      // Calculate price (e.g., $1 per credit)
      const price = creditsAmount;
      
      await purchaseCredits({
        payment_method: paymentMethod,
        amount: price,
        credits_to_purchase: creditsAmount
      });
      
      setPurchaseSuccess(true);
      setAmount('');
      
      // Refresh balance and transactions
      await fetchBalance();
      await fetchTransactions();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setPurchaseSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to purchase credits:', error);
      setPurchaseError('Failed to process payment. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned':
        return 'success.main';
      case 'spent':
        return 'error.main';
      case 'purchased':
        return 'primary.main';
      case 'refunded':
        return 'warning.main';
      case 'bonus':
        return 'secondary.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Credit Management
        </Typography>
        
        <Grid container spacing={3}>
          {/* Credit Balance Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Your Balance
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography variant="h2" color="primary">
                    {balance}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Available Credits
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Purchase Credits Card */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Purchase Credits
              </Typography>
              
              {purchaseSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Credits purchased successfully!
                </Alert>
              )}
              
              {(error || purchaseError) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error || purchaseError}
                </Alert>
              )}
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Amount of Credits"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      value={paymentMethod}
                      label="Payment Method"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                      <MenuItem value="paypal">PayPal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handlePurchase}
                    disabled={purchaseLoading || !amount}
                  >
                    {purchaseLoading ? <CircularProgress size={24} /> : 'Purchase'}
                  </Button>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  * Credits are priced at $1 per credit
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  * Credits can be used to request meetings with experts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  * You earn credits when others request meetings with you
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Transaction History */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Transaction History
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : transactions && transactions.length > 0 ? (
                <Box>
                  {transactions.map((transaction, index) => (
                    <Card key={transaction.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                              {transaction.transaction_type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={7}>
                            <Typography variant="body1">
                              {transaction.description || `${transaction.transaction_type} transaction`}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                textAlign: 'right',
                                color: getTransactionColor(transaction.transaction_type)
                              }}
                            >
                              {transaction.transaction_type === 'spent' ? '-' : '+'}{transaction.amount}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                  No transactions found
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
