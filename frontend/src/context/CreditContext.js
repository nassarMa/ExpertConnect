import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

export const CreditContext = createContext();

export const CreditProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch credit balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCreditBalance();
      fetchTransactionHistory();
    }
  }, [isAuthenticated, user]);

  // Fetch credit balance from API
  const fetchCreditBalance = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/balance', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCreditBalance(response.data.balance);
      setError(null);
    } catch (err) {
      console.error('Error fetching credit balance:', err);
      setError('Failed to fetch credit balance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history from API
  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/transactions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Purchase credits
  const purchaseCredits = async (amount, paymentMethod) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/credits/purchase', 
        { amount, paymentMethod },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update balance after purchase
      setCreditBalance(prevBalance => prevBalance + amount);
      
      // Add new transaction to history
      setTransactions(prev => [response.data, ...prev]);
      
      setError(null);
      return { success: true, transaction: response.data };
    } catch (err) {
      console.error('Error purchasing credits:', err);
      setError('Failed to purchase credits');
      return { success: false, error: err.response?.data?.message || 'Transaction failed' };
    } finally {
      setLoading(false);
    }
  };

  // Use credits for booking
  const useCreditsForBooking = async (expertId, sessionDuration, creditsRequired) => {
    setLoading(true);
    try {
      // Check if user has enough credits
      if (creditBalance < creditsRequired) {
        throw new Error('Insufficient credits');
      }

      const response = await axios.post('/api/credits/use', 
        { 
          expertId, 
          sessionDuration,
          creditsRequired 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update balance after using credits
      setCreditBalance(prevBalance => prevBalance - creditsRequired);
      
      // Add new transaction to history
      setTransactions(prev => [response.data, ...prev]);
      
      setError(null);
      return { success: true, booking: response.data };
    } catch (err) {
      console.error('Error using credits for booking:', err);
      setError(err.message || 'Failed to use credits for booking');
      return { 
        success: false, 
        error: err.message || 'Failed to use credits for booking' 
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreditContext.Provider
      value={{
        creditBalance,
        transactions,
        loading,
        error,
        fetchCreditBalance,
        fetchTransactionHistory,
        purchaseCredits,
        useCreditsForBooking
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};

export default CreditProvider;
export const useCreditContext = () => useContext(CreditContext);