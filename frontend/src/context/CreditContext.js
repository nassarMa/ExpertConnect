import { createContext, useState, useEffect, useContext } from 'react';
import { creditAPI } from '../api';

const CreditContext = createContext();

export const CreditProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await creditAPI.getBalance();
      setBalance(response.data.balance);
      return response.data.balance;
    } catch (error) {
      setError('Failed to fetch credit balance');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await creditAPI.getTransactions();
      setTransactions(response.data);
      return response.data;
    } catch (error) {
      setError('Failed to fetch transactions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async (paymentData) => {
    try {
      setLoading(true);
      const response = await creditAPI.purchaseCredits(paymentData);
      await fetchBalance();
      return response.data;
    } catch (error) {
      setError('Failed to purchase credits');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  return (
    <CreditContext.Provider
      value={{
        balance,
        transactions,
        loading,
        error,
        fetchBalance,
        fetchTransactions,
        purchaseCredits,
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => useContext(CreditContext);

export default CreditContext;
