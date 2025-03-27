import React, { useContext, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import styles from '@/styles/Meetings.module.css';
import { useAuth } from '@/context/AuthContext';
import { useCreditContext } from '@/context/CreditContext';
import Link from 'next/link';



const MeetingsPage = () => {
  const authContext = useAuth();
  const user = authContext?.user;
  const { transactions } = useCreditContext();
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    // Mock data for demonstration
    const mockMeetings = [
      {
        id: 1,
        expertId: '1',
        expertName: 'Dr. Jane Smith',
        expertTitle: 'Senior Software Architect',
        expertImage: '/images/expert-profile.jpg',
        date: '2025-03-25',
        time: '14:00',
        duration: 60,
        creditsUsed: 100,
        status: 'upcoming',
        notes: 'Discuss cloud architecture for new project'
      },
      {
        id: 2,
        expertId: '2',
        expertName: 'Prof. Michael Johnson',
        expertTitle: 'Data Science Specialist',
        expertImage: '/images/expert-profile.jpg',
        date: '2025-03-28',
        time: '10:30',
        duration: 30,
        creditsUsed: 50,
        status: 'upcoming',
        notes: 'Review machine learning model performance'
      },
      {
        id: 3,
        expertId: '3',
        expertName: 'Dr. Sarah Williams',
        expertTitle: 'UX Research Expert',
        expertImage: '/images/expert-profile.jpg',
        date: '2025-03-15',
        time: '11:00',
        duration: 45,
        creditsUsed: 75,
        status: 'completed',
        notes: 'Discuss user research findings',
        rating: 5,
        feedback: 'Excellent consultation, very insightful!'
      },
      {
        id: 4,
        expertId: '1',
        expertName: 'Dr. Jane Smith',
        expertTitle: 'Senior Software Architect',
        expertImage: '/images/expert-profile.jpg',
        date: '2025-03-10',
        time: '15:30',
        duration: 60,
        creditsUsed: 100,
        status: 'completed',
        notes: 'Initial project architecture discussion',
        rating: 4,
        feedback: 'Very helpful session, good insights on system design.'
      }
    ];

    setMeetings(mockMeetings);
    setIsLoading(false);
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getFilteredMeetings = () => {
    return meetings.filter(meeting => {
      if (activeTab === 'upcoming') {
        return meeting.status === 'upcoming';
      } else if (activeTab === 'completed') {
        return meeting.status === 'completed';
      } else if (activeTab === 'cancelled') {
        return meeting.status === 'cancelled';
      }
      return true;
    });
  };

  const handleCancelMeeting = (meetingId) => {
    // In a real app, this would be an API call
    // For demonstration, we'll just update the local state
    setMeetings(meetings.map(meeting => 
      meeting.id === meetingId 
        ? { ...meeting, status: 'cancelled' } 
        : meeting
    ));
  };

  const handleRescheduleMeeting = (meetingId) => {
    // This would open a reschedule modal in a real app
    alert(`Reschedule meeting ${meetingId} - This would open a reschedule modal in a real app`);
  };

  const handleRateMeeting = (meetingId, rating) => {
    // In a real app, this would be an API call
    // For demonstration, we'll just update the local state
    setMeetings(meetings.map(meeting => 
      meeting.id === meetingId 
        ? { ...meeting, rating } 
        : meeting
    ));
  };

  const handleSubmitFeedback = (meetingId, feedback) => {
    // In a real app, this would be an API call
    // For demonstration, we'll just update the local state
    setMeetings(meetings.map(meeting => 
      meeting.id === meetingId 
        ? { ...meeting, feedback } 
        : meeting
    ));
  };

  return (
    <Layout>
      <div className={styles.meetingsContainer}>
        <h1 className={styles.pageTitle}>My Consultations</h1>
        
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'completed' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </button>
          </div>

          <div className={styles.tabContent}>
            {isLoading ? (
              <div className={styles.loadingState}>Loading consultations...</div>
            ) : getFilteredMeetings().length === 0 ? (
              <div className={styles.emptyState}>
                <p>No {activeTab} consultations found.</p>
                {activeTab === 'upcoming' && (
                  <Link href="/experts">
                    <a className={styles.actionButton}>Find Experts</a>
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.meetingsList}>
                {getFilteredMeetings().map(meeting => (
                  <div key={meeting.id} className={styles.meetingCard}>
                    <div className={styles.meetingHeader}>
                      <div className={styles.expertInfo}>
                        <img 
                          src={meeting.expertImage || '/images/default-profile.jpg'} 
                          alt={meeting.expertName} 
                          className={styles.expertImage} 
                        />
                        <div>
                          <h3>{meeting.expertName}</h3>
                          <p className={styles.expertTitle}>{meeting.expertTitle}</p>
                        </div>
                      </div>
                      <div className={styles.meetingStatus}>
                        <span className={`${styles.statusBadge} ${styles[meeting.status]}`}>
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.meetingDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>📅</span>
                        <span>{formatDate(meeting.date)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>⏰</span>
                        <span>{formatTime(meeting.time)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>⏱️</span>
                        <span>{meeting.duration} minutes</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>💰</span>
                        <span>{meeting.creditsUsed} credits</span>
                      </div>
                    </div>
                    
                    {meeting.notes && (
                      <div className={styles.meetingNotes}>
                        <h4>Notes:</h4>
                        <p>{meeting.notes}</p>
                      </div>
                    )}
                    
                    {meeting.status === 'upcoming' && (
                      <div className={styles.meetingActions}>
                        <button className={styles.primaryButton}>Join Meeting</button>
                        <button 
                          className={styles.secondaryButton}
                          onClick={() => handleRescheduleMeeting(meeting.id)}
                        >
                          Reschedule
                        </button>
                        <button 
                          className={styles.dangerButton}
                          onClick={() => handleCancelMeeting(meeting.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {meeting.status === 'completed' && (
                      <div className={styles.meetingFeedback}>
                        <h4>Your Feedback:</h4>
                        {meeting.rating ? (
                          <>
                            <div className={styles.ratingStars}>
                              {[...Array(5)].map((_, i) => (
                                <span 
                                  key={i} 
                                  className={i < meeting.rating ? styles.starFilled : styles.starEmpty}
                                  onClick={() => handleRateMeeting(meeting.id, i + 1)}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            {meeting.feedback ? (
                              <p className={styles.feedbackText}>{meeting.feedback}</p>
                            ) : (
                              <div className={styles.feedbackForm}>
                                <textarea 
                                  placeholder="Share your thoughts about this consultation..."
                                  className={styles.feedbackInput}
                                  id={`feedback-${meeting.id}`}
                                ></textarea>
                                <button 
                                  className={styles.submitButton}
                                  onClick={() => handleSubmitFeedback(
                                    meeting.id, 
                                    document.getElementById(`feedback-${meeting.id}`).value
                                  )}
                                >
                                  Submit Feedback
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={styles.ratingPrompt}>
                            <p>How was your consultation?</p>
                            <div className={styles.ratingStars}>
                              {[...Array(5)].map((_, i) => (
                                <span 
                                  key={i} 
                                  className={styles.starEmpty}
                                  onClick={() => handleRateMeeting(meeting.id, i + 1)}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {meeting.status === 'cancelled' && (
                      <div className={styles.cancelledInfo}>
                        <p>This consultation was cancelled.</p>
                        <Link href={`/experts/${meeting.expertId}`}>
                          <a className={styles.rebookButton}>Book Again</a>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MeetingsPage;
