import React, { useContext, useState, useEffect } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/Dashboard.module.css';
import { AuthContext } from '../context/AuthContext';
import { CreditContext } from '../context/CreditContext';
import Link from 'next/link';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { creditBalance, transactions } = useContext(CreditContext);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalCreditsSpent: 0,
    totalCreditsPurchased: 0,
    averageRating: 0
  });

  useEffect(() => {
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
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <h1>Dashboard</h1>
          <div className={styles.userWelcome}>
            Welcome back, <span className={styles.userName}>{user?.name || 'User'}</span>
          </div>
        </div>

        <div className={styles.creditSummary}>
          <div className={styles.creditBalance}>
            <h2>Credit Balance</h2>
            <div className={styles.balanceAmount}>{creditBalance}</div>
            <Link href="/credits">
              <a className={styles.buyCreditsButton}>Buy Credits</a>
            </Link>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalMeetings}</div>
            <div className={styles.statLabel}>Total Consultations</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalCreditsSpent}</div>
            <div className={styles.statLabel}>Credits Spent</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalCreditsPurchased}</div>
            <div className={styles.statLabel}>Credits Purchased</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.averageRating.toFixed(1)}</div>
            <div className={styles.statLabel}>Average Rating</div>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2>Upcoming Consultations</h2>
              <Link href="/meetings">
                <a className={styles.viewAllLink}>View All</a>
              </Link>
            </div>
            
            {upcomingMeetings.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No upcoming consultations scheduled.</p>
                <Link href="/experts">
                  <a className={styles.actionButton}>Find Experts</a>
                </Link>
              </div>
            ) : (
              <div className={styles.meetingsList}>
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className={styles.meetingCard}>
                    <div className={styles.meetingInfo}>
                      <h3>{meeting.expertName}</h3>
                      <p className={styles.expertTitle}>{meeting.expertTitle}</p>
                      <div className={styles.meetingDetails}>
                        <div className={styles.meetingDetail}>
                          <span className={styles.detailLabel}>Date:</span>
                          <span>{formatDate(meeting.date)}</span>
                        </div>
                        <div className={styles.meetingDetail}>
                          <span className={styles.detailLabel}>Time:</span>
                          <span>{formatTime(meeting.time)}</span>
                        </div>
                        <div className={styles.meetingDetail}>
                          <span className={styles.detailLabel}>Duration:</span>
                          <span>{meeting.duration} minutes</span>
                        </div>
                        <div className={styles.meetingDetail}>
                          <span className={styles.detailLabel}>Credits:</span>
                          <span>{meeting.creditsUsed}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.meetingActions}>
                      <button className={styles.primaryButton}>Join Meeting</button>
                      <button className={styles.secondaryButton}>Reschedule</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Transactions</h2>
              <Link href="/credits">
                <a className={styles.viewAllLink}>View All</a>
              </Link>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No recent transactions.</p>
                <Link href="/credits">
                  <a className={styles.actionButton}>Buy Credits</a>
                </Link>
              </div>
            ) : (
              <div className={styles.transactionsList}>
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className={styles.transactionCard}>
                    <div className={styles.transactionInfo}>
                      <div className={styles.transactionType}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </div>
                      <div className={styles.transactionDate}>
                        {formatDateTime(transaction.createdAt)}
                      </div>
                    </div>
                    <div className={styles.transactionAmount}>
                      <span className={transaction.amount > 0 ? styles.positive : styles.negative}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                      <div className={styles.transactionBalance}>
                        Balance: {transaction.balanceAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.recommendedExperts}>
          <div className={styles.sectionHeader}>
            <h2>Recommended Experts</h2>
            <Link href="/experts">
              <a className={styles.viewAllLink}>View All</a>
            </Link>
          </div>
          
          <div className={styles.expertsGrid}>
            {/* Mock data for recommended experts */}
            {[1, 2, 3].map(id => (
              <div key={id} className={styles.expertCard}>
                <div className={styles.expertImageContainer}>
                  <img 
                    src={`/images/expert-${id}.jpg`} 
                    alt={`Expert ${id}`} 
                    className={styles.expertImage} 
                  />
                </div>
                <div className={styles.expertCardInfo}>
                  <h3>Dr. Expert Name</h3>
                  <p className={styles.expertCardTitle}>Professional Title</p>
                  <div className={styles.expertCardRating}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < 4 ? styles.starFilled : styles.starEmpty}>★</span>
                    ))}
                    <span className={styles.ratingCount}>(42)</span>
                  </div>
                  <div className={styles.expertCardRate}>
                    <span className={styles.rateValue}>80</span> credits/hour
                  </div>
                  <Link href={`/experts/${id}`}>
                    <a className={styles.viewProfileButton}>View Profile</a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
