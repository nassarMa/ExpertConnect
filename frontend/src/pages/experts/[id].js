import React, { useContext, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import styles from '@/styles/Experts.module.css';
import { CreditContext } from '@/context/CreditContext';

const ExpertDetailPage = ({ expert }) => {
  const router = useRouter();
  const { creditBalance, useCreditsForBooking } = useContext(CreditContext);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate credit cost based on expert rate and duration
  const calculateCreditCost = () => {
    return (expert.creditRate * selectedDuration) / 60;
  };

  const handleDurationChange = (e) => {
    setSelectedDuration(parseInt(e.target.value));
  };

  const handleDateChange = (e) => {
    setBookingDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setBookingTime(e.target.value);
  };

  const handleBookSession = async () => {
    if (!bookingDate || !bookingTime) {
      setBookingStatus({
        success: false,
        message: 'Please select a date and time for your session'
      });
      return;
    }

    const creditsRequired = calculateCreditCost();
    
    if (creditBalance < creditsRequired) {
      setBookingStatus({
        success: false,
        message: `Insufficient credits. You need ${creditsRequired} credits for this booking.`
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await useCreditsForBooking(
        expert.id,
        selectedDuration,
        creditsRequired
      );

      if (result.success) {
        setBookingStatus({
          success: true,
          message: 'Session booked successfully! Check your meetings page for details.'
        });
        
        // Redirect to meetings page after successful booking
        setTimeout(() => {
          router.push('/meetings');
        }, 3000);
      } else {
        setBookingStatus({
          success: false,
          message: result.error || 'Failed to book session. Please try again.'
        });
      }
    } catch (error) {
      setBookingStatus({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      });
      console.error('Booking error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className={styles.expertDetailContainer}>
        <div className={styles.expertProfile}>
          <div className={styles.expertImageContainer}>
            <img 
              src={expert.profileImage || '/images/default-profile.jpg'} 
              alt={expert.name} 
              className={styles.expertImage} 
            />
          </div>
          
          <div className={styles.expertInfo}>
            <h1 className={styles.expertName}>{expert.name}</h1>
            <p className={styles.expertTitle}>{expert.title}</p>
            
            <div className={styles.expertRating}>
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={i < expert.rating ? styles.starFilled : styles.starEmpty}
                >
                  ★
                </span>
              ))}
              <span className={styles.ratingCount}>({expert.reviewCount} reviews)</span>
            </div>
            
            <div className={styles.expertRate}>
              <span className={styles.rateValue}>{expert.creditRate}</span> credits per hour
            </div>
            
            <div className={styles.expertTags}>
              {expert.specialties.map((specialty, index) => (
                <span key={index} className={styles.tag}>{specialty}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className={styles.expertContent}>
          <div className={styles.expertAbout}>
            <h2>About</h2>
            <p>{expert.bio}</p>
          </div>
          
          <div className={styles.expertExperience}>
            <h2>Experience</h2>
            <ul>
              {expert.experience.map((exp, index) => (
                <li key={index}>
                  <strong>{exp.position}</strong> at {exp.company}
                  <div className={styles.experiencePeriod}>{exp.period}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className={styles.expertEducation}>
            <h2>Education</h2>
            <ul>
              {expert.education.map((edu, index) => (
                <li key={index}>
                  <strong>{edu.degree}</strong> from {edu.institution}
                  <div className={styles.educationPeriod}>{edu.year}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className={styles.bookingSection}>
          <h2>Book a Consultation</h2>
          
          <div className={styles.currentCredits}>
            Your current balance: <span className={styles.creditBalance}>{creditBalance} credits</span>
          </div>
          
          <div className={styles.bookingForm}>
            <div className={styles.formGroup}>
              <label>Session Duration:</label>
              <select 
                value={selectedDuration} 
                onChange={handleDurationChange}
                className={styles.formControl}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Date:</label>
              <input 
                type="date" 
                min={getMinDate()}
                value={bookingDate} 
                onChange={handleDateChange}
                className={styles.formControl}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Time:</label>
              <select 
                value={bookingTime} 
                onChange={handleTimeChange}
                className={styles.formControl}
              >
                <option value="">Select a time</option>
                {generateTimeSlots().map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.costSummary}>
              <div className={styles.costRow}>
                <span>Duration:</span>
                <span>{selectedDuration} minutes</span>
              </div>
              <div className={styles.costRow}>
                <span>Rate:</span>
                <span>{expert.creditRate} credits/hour</span>
              </div>
              <div className={`${styles.costRow} ${styles.costTotal}`}>
                <span>Total Cost:</span>
                <span>{calculateCreditCost()} credits</span>
              </div>
            </div>
            
            {bookingStatus && (
              <div className={`${styles.bookingMessage} ${bookingStatus.success ? styles.successMessage : styles.errorMessage}`}>
                {bookingStatus.message}
              </div>
            )}
            
            <button 
              className={styles.bookButton}
              onClick={handleBookSession}
              disabled={isProcessing || !bookingDate || !bookingTime}
            >
              {isProcessing ? 'Processing...' : 'Book Session'}
            </button>
            
            {creditBalance < calculateCreditCost() && (
              <div className={styles.insufficientCredits}>
                <p>You don't have enough credits for this booking.</p>
                <button 
                  className={styles.buyCreditsButton}
                  onClick={() => router.push('/credits')}
                >
                  Buy Credits
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// This would normally fetch data from an API
export async function getStaticProps({ params }) {
  // Mock expert data
  const expert = {
    id: params.id,
    name: 'Dr. Jane Smith',
    title: 'Senior Software Architect',
    rating: 4.8,
    reviewCount: 124,
    creditRate: 100, // credits per hour
    profileImage: '/images/expert-profile.jpg',
    specialties: ['Cloud Architecture', 'System Design', 'DevOps'],
    bio: 'Dr. Jane Smith is a senior software architect with over 15 years of experience in designing and implementing large-scale distributed systems. She specializes in cloud architecture, system design, and DevOps practices.',
    experience: [
      { position: 'Senior Software Architect', company: 'Tech Solutions Inc.', period: '2018 - Present' },
      { position: 'Lead Developer', company: 'InnovateTech', period: '2012 - 2018' },
      { position: 'Software Engineer', company: 'GlobalSoft', period: '2008 - 2012' }
    ],
    education: [
      { degree: 'Ph.D. in Computer Science', institution: 'Stanford University', year: '2008' },
      { degree: 'M.S. in Computer Science', institution: 'MIT', year: '2005' },
      { degree: 'B.S. in Computer Engineering', institution: 'UC Berkeley', year: '2003' }
    ]
  };

  return {
    props: {
      expert
    },
    revalidate: 60 // Revalidate every minute
  };
}

export async function getStaticPaths() {
  // In a real app, this would fetch all expert IDs from an API
  const expertIds = ['1', '2', '3'];
  
  const paths = expertIds.map(id => ({
    params: { id }
  }));

  return {
    paths,
    fallback: true
  };
}

export default ExpertDetailPage;
