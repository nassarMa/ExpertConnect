import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useMeetings } from '@/context/MeetingContext';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function MeetingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { getMeeting, updateMeetingStatus, createReview, loading } = useMeetings();
  const [meeting, setMeeting] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (id) {
      const fetchMeeting = async () => {
        try {
          const meetingData = await getMeeting(id);
          setMeeting(meetingData);
        } catch (error) {
          console.error('Failed to fetch meeting:', error);
          setError('Failed to load meeting details.');
        }
      };

      fetchMeeting();
    }
  }, [id, user, router, getMeeting]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateMeetingStatus(id, { status: newStatus });
      setMeeting({ ...meeting, status: newStatus });
      setSuccess(`Meeting ${newStatus} successfully.`);
    } catch (error) {
      console.error('Failed to update meeting status:', error);
      setError('Failed to update meeting status.');
    }
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      setError('');

      if (!reviewText.trim()) {
        setError('Please enter a review.');
        setSubmittingReview(false);
        return;
      }

      await createReview({
        meeting_id: id,
        rating,
        review_text: reviewText,
        reviewer_id: user.id,
        reviewee_id: meeting.requester_id === user.id ? meeting.expert_id : meeting.requester_id
      });

      setSuccess('Review submitted successfully.');
      setReviewText('');
      setRating(5);
    } catch (error) {
      console.error('Failed to submit review:', error);
      setError('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const joinMeeting = () => {
    router.push(`/meetings/${id}/room`);
  };

  const canJoinMeeting = () => {
    if (!meeting || meeting.status !== 'confirmed') return false;

    const now = new Date();
    const meetingStart = new Date(meeting.scheduled_start);
    const meetingEnd = new Date(meeting.scheduled_end);
    
    // Allow joining 5 minutes before start time
    const joinWindow = new Date(meetingStart);
    joinWindow.setMinutes(joinWindow.getMinutes() - 5);

    return now >= joinWindow && now <= meetingEnd;
  };

  const canReview = () => {
    if (!meeting || meeting.status !== 'completed') return false;
    
    // Check if user has already submitted a review
    return !meeting.has_reviewed;
  };

  if (loading || !meeting) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {meeting.title}
          </Typography>

          {error && (
            <Box sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 2, borderRadius: 1, mb: 2 }}>
              {error}
            </Box>
          )}

          {success && (
            <Box sx={{ bgcolor: 'success.light', color: 'success.contrastText', p: 2, borderRadius: 1, mb: 2 }}>
              {success}
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
              </Typography>

              <Typography variant="subtitle1" color="text.secondary">
                {meeting.requester_id === user.id ? 'Expert' : 'Requester'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {meeting.requester_id === user.id ? meeting.expert_name : meeting.requester_name}
              </Typography>

              <Typography variant="subtitle1" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {meeting.category_name || 'Not specified'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Scheduled Time
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {format(new Date(meeting.scheduled_start), 'MMM dd, yyyy h:mm a')} - 
                {format(new Date(meeting.scheduled_end), 'h:mm a')}
              </Typography>

              <Typography variant="subtitle1" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {Math.round((new Date(meeting.scheduled_end) - new Date(meeting.scheduled_start)) / (1000 * 60))} minutes
              </Typography>

              <Typography variant="subtitle1" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {format(new Date(meeting.created_at), 'MMM dd, yyyy h:mm a')}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {meeting.description || 'No description provided.'}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {meeting.status === 'pending' && meeting.expert_id === user.id && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => handleStatusUpdate('confirmed')}
              >
                Accept Meeting
              </Button>
            )}

            {meeting.status === 'pending' && (
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => handleStatusUpdate('cancelled')}
              >
                Cancel Meeting
              </Button>
            )}

            {meeting.status === 'confirmed' && canJoinMeeting() && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={joinMeeting}
              >
                Join Meeting
              </Button>
            )}

            {meeting.status === 'confirmed' && new Date() > new Date(meeting.scheduled_end) && (
              <Button 
                variant="outlined"
                onClick={() => handleStatusUpdate('completed')}
              >
                Mark as Completed
              </Button>
            )}

            <Button 
              variant="outlined"
              onClick={() => router.push('/meetings')}
            >
              Back to Meetings
            </Button>
          </Box>

          {canReview() && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Leave a Review
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained"
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewText.trim()}
                >
                  {submittingReview ? <CircularProgress size={24} /> : 'Submit Review'}
                </Button>
              </Box>
            </Box>
          )}

          {meeting.reviews && meeting.reviews.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Reviews
              </Typography>
              {meeting.reviews.map((review) => (
                <Paper key={review.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    {review.reviewer_name} - Rating: {review.rating}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(review.created_at), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {review.review_text}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Container>
    </Layout>
  );
}
