import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useCreditContext } from '@/context/CreditContext';
import styles from '@/styles/Credits.module.css';




const CreditPackages = [
  { id: 1, name: 'Basic', amount: 100, price: 10 },
  { id: 2, name: 'Standard', amount: 300, price: 25 },
  { id: 3, name: 'Premium', amount: 500, price: 40 },
  { id: 4, name: 'Professional', amount: 1000, price: 75 }
];

const CreditsPage = () => {
  const { balance, transactions, purchaseCredits } = useCreditContext();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    try {
      await purchaseCredits({
        packageId: selectedPackage.id,
        amount: selectedPackage.amount,
        price: selectedPackage.price
      });
      setSelectedPackage(null);
    } catch (error) {
      console.error('Failed to purchase credits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Credits Management</h1>
        
        <div className={styles.balanceCard}>
          <h2>Current Balance</h2>
          <p className={styles.balance}>{balance} credits</p>
        </div>
        
        <div className={styles.purchaseSection}>
          <h2>Purchase Credits</h2>
          <div className={styles.packages}>
            {CreditPackages.map(pkg => (
              <div 
                key={pkg.id} 
                className={`${styles.packageCard} ${selectedPackage?.id === pkg.id ? styles.selected : ''}`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <h3>{pkg.name}</h3>
                <p className={styles.amount}>{pkg.amount} credits</p>
                <p className={styles.price}>${pkg.price}</p>
              </div>
            ))}
          </div>
          
          <button 
            className={styles.purchaseButton}
            disabled={!selectedPackage || isProcessing}
            onClick={handlePurchase}
          >
            {isProcessing ? 'Processing...' : `Purchase ${selectedPackage?.amount || ''} Credits`}
          </button>
        </div>
        
        <div className={styles.transactionsSection}>
          <h2>Transaction History</h2>
          {transactions.length === 0 ? (
            <p className={styles.noTransactions}>No transactions yet</p>
          ) : (
            <table className={styles.transactionsTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.type}</td>
                    <td className={transaction.type === 'purchase' ? styles.positive : styles.negative}>
                      {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                    </td>
                    <td>{transaction.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreditsPage;
