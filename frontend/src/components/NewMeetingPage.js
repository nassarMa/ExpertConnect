import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useMeetings } from '@/context/MeetingContext';
import { useCreditContext } from '@/context/CreditContext';
import { Formik, Form, Field } from 'formik';
import Layout from '@/components/Layout';
import * as Yup from 'yup';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addHours, format } from 'date-fns';
import { categoryAPI, userAPI } from '@/api';

const MeetingSchema = Yup.object().shape({
  expert: Yup.number().required('Expert is required'),
  title: Yup.string().required('Title is required').max(100, 'Title is too long'),
  description: Yup.string(),
  category: Yup.number().required('Category is required'),
  scheduled_start: Yup.date().required('Start time is required'),
  scheduled_end: Yup.date().required('End time is required')
    .min(
      Yup.ref('scheduled_start'),
      'End time must be after start time'
    )
});

export default function NewMeeting() {
  const router = useRouter();
  const { user } = useAuth();
  const { createMeeting } = useMeetings();
  const { balance, fetchBalance } = useCreditContext();
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { expert: expertId } = router.query;

  useState(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [expertsResponse, categoriesResponse] = await Promise.all([
          userAPI.getUsers(),
          categoryAPI.getCategories()
        ]);
        setExperts(expertsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load experts or categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchBalance();
  }, [user, router, fetchBalance]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (balance < 1) {
        setError('You do not have enough credits to request a meeting. Please purchase more credits.');
        setSubmitting(false);
        return;
      }

      setLoading(true);
      setError('');
      
      // Format dates for API
      const formattedValues = {
        ...values,
        scheduled_start: format(values.scheduled_start, "yyyy-MM-dd'T'HH:mm:ss"),
        scheduled_end: format(values.scheduled_end, "yyyy-MM-dd'T'HH:mm:ss")
      };
      
      await createMeeting(formattedValues);
      setSuccess(true);
      
      // Redirect after successful creation
      setTimeout(() => {
        router.push('/meetings');
      }, 2000);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      setError('Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Request New Meeting
          </Typography>
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Meeting request created successfully! Redirecting to meetings page...
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {balance < 1 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              You currently have {balance} credits. You need at least 1 credit to request a meeting.
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ ml: 2 }}
                onClick={() => router.push('/credits/purchase')}
              >
                Purchase Credits
              </Button>
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Formik
              initialValues={{
                expert: expertId || '',
                title: '',
                description: '',
                category: '',
                scheduled_start: new Date(),
                scheduled_end: addHours(new Date(), 1)
              }}
              validationSchema={MeetingSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, values, setFieldValue, isSubmitting }) => (
                <Form>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth error={touched.expert && Boolean(errors.expert)}>
                        <InputLabel id="expert-label">Select Expert</InputLabel>
                        <Field
                          as={Select}
                          labelId="expert-label"
                          id="expert"
                          name="expert"
                          label="Select Expert"
                          value={values.expert}
                          onChange={(e) => setFieldValue('expert', e.target.value)}
                        >
                          {experts.map((expert) => (
                            <MenuItem key={expert.id} value={expert.id}>
                              {expert.first_name} {expert.last_name} - {expert.headline || 'Expert'}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.expert && errors.expert && (
                          <FormHelperText>{errors.expert}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        id="title"
                        name="title"
                        label="Meeting Title"
                        error={touched.title && Boolean(errors.title)}
                        helperText={touched.title && errors.title}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        id="description"
                        name="description"
                        label="Meeting Description"
                        multiline
                        rows={4}
                        error={touched.description && Boolean(errors.description)}
                        helperText={touched.description && errors.description}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth error={touched.category && Boolean(errors.category)}>
                        <InputLabel id="category-label">Category</InputLabel>
                        <Field
                          as={Select}
                          labelId="category-label"
                          id="category"
                          name="category"
                          label="Category"
                          value={values.category}
                          onChange={(e) => setFieldValue('category', e.target.value)}
                        >
                          {categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.category && errors.category && (
                          <FormHelperText>{errors.category}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Start Time
                      </Typography>
                      <DatePicker
                        selected={values.scheduled_start}
                        onChange={(date) => setFieldValue('scheduled_start', date)}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={30}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        minDate={new Date()}
                        customInput={
                          <TextField
                            fullWidth
                            error={touched.scheduled_start && Boolean(errors.scheduled_start)}
                            helperText={touched.scheduled_start && errors.scheduled_start}
                          />
                        }
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        End Time
                      </Typography>
                      <DatePicker
                        selected={values.scheduled_end}
                        onChange={(date) => setFieldValue('scheduled_end', date)}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={30}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        minDate={values.scheduled_start}
                        customInput={
                          <TextField
                            fullWidth
                            error={touched.scheduled_end && Boolean(errors.scheduled_end)}
                            helperText={touched.scheduled_end && errors.scheduled_end}
                          />
                        }
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => router.back()}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSubmitting || loading || success || balance < 1}
                        >
                          {isSubmitting ? <CircularProgress size={24} /> : 'Request Meeting'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          )}
        </Paper>
      </Container>
    </Layout>
  );
}
