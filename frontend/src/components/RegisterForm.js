import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Alert,
  CircularProgress,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Business as BusinessIcon, 
  Compare as CompareIcon 
} from '@mui/icons-material';

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  re_password: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Password confirmation is required'),
  role: Yup.string()
    .oneOf(['consumer', 'provider', 'both'], 'Please select a valid role')
    .required('Role selection is required'),
});

const ProviderSchema = Yup.object().shape({
  headline: Yup.string()
    .max(100, 'Headline must be less than 100 characters')
    .required('Professional headline is required'),
  bio: Yup.string()
    .min(50, 'Bio must be at least 50 characters')
    .required('Professional bio is required'),
  hourly_rate: Yup.number()
    .min(1, 'Hourly rate must be at least 1 credit')
    .required('Hourly rate is required'),
});

const RegisterForm = () => {
  const theme = useTheme();
  const { register, error, loading } = useAuth();
  const router = useRouter();
  const [registerError, setRegisterError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    re_password: '',
    role: '',
    headline: '',
    bio: '',
    hourly_rate: 50,
    is_available_for_hire: true
  });

  const steps = ['Account Information', 'Role Selection', 'Professional Profile'];

  const handleNext = (values) => {
    setFormValues({...formValues, ...values});
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (values) => {
    const finalValues = {...formValues, ...values};
    setFormValues(finalValues);
    
    // Only include provider fields if role is provider or both
    const submitData = {
      username: finalValues.username,
      email: finalValues.email,
      first_name: finalValues.first_name,
      last_name: finalValues.last_name,
      password: finalValues.password,
      re_password: finalValues.re_password,
      role: finalValues.role,
    };
    
    if (finalValues.role === 'provider' || finalValues.role === 'both') {
      submitData.headline = finalValues.headline;
      submitData.bio = finalValues.bio;
      submitData.hourly_rate = finalValues.hourly_rate;
      submitData.is_available_for_hire = finalValues.is_available_for_hire;
    }

    const result = await register(submitData);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setRegisterError('Registration failed. Please try again.');
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Formik
            initialValues={{
              username: formValues.username,
              email: formValues.email,
              first_name: formValues.first_name,
              last_name: formValues.last_name,
              password: formValues.password,
              re_password: formValues.re_password
            }}
            validationSchema={Yup.object().shape({
              username: RegisterSchema.fields.username,
              email: RegisterSchema.fields.email,
              first_name: RegisterSchema.fields.first_name,
              last_name: RegisterSchema.fields.last_name,
              password: RegisterSchema.fields.password,
              re_password: RegisterSchema.fields.re_password
            })}
            onSubmit={handleNext}
          >
            {({ errors, touched }) => (
              <Form>
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      margin="normal"
                      required
                      fullWidth
                      id="first_name"
                      label="First Name"
                      name="first_name"
                      autoComplete="given-name"
                      error={touched.first_name && Boolean(errors.first_name)}
                      helperText={touched.first_name && errors.first_name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      margin="normal"
                      required
                      fullWidth
                      id="last_name"
                      label="Last Name"
                      name="last_name"
                      autoComplete="family-name"
                      error={touched.last_name && Boolean(errors.last_name)}
                      helperText={touched.last_name && errors.last_name}
                    />
                  </Grid>
                </Grid>
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  name="re_password"
                  label="Confirm Password"
                  type="password"
                  id="re_password"
                  autoComplete="new-password"
                  error={touched.re_password && Boolean(errors.re_password)}
                  helperText={touched.re_password && errors.re_password}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Next'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        );
      case 1:
        return (
          <Formik
            initialValues={{
              role: formValues.role
            }}
            validationSchema={Yup.object().shape({
              role: RegisterSchema.fields.role
            })}
            onSubmit={handleNext}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <FormControl component="fieldset" error={touched.role && Boolean(errors.role)} sx={{ width: '100%' }}>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
                    I want to join ExpertConnect as a:
                  </FormLabel>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          height: '100%',
                          borderColor: values.role === 'consumer' ? theme.palette.primary.main : 'divider',
                          borderWidth: values.role === 'consumer' ? 2 : 1,
                          boxShadow: values.role === 'consumer' ? theme.shadows[4] : 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: theme.shadows[2]
                          }
                        }}
                        onClick={() => setFieldValue('role', 'consumer')}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <PersonIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Consumer
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            I want to book consultations with experts and get professional advice
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          height: '100%',
                          borderColor: values.role === 'provider' ? theme.palette.primary.main : 'divider',
                          borderWidth: values.role === 'provider' ? 2 : 1,
                          boxShadow: values.role === 'provider' ? theme.shadows[4] : 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: theme.shadows[2]
                          }
                        }}
                        onClick={() => setFieldValue('role', 'provider')}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Provider
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            I want to offer my expertise and provide consultations to clients
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          height: '100%',
                          borderColor: values.role === 'both' ? theme.palette.primary.main : 'divider',
                          borderWidth: values.role === 'both' ? 2 : 1,
                          boxShadow: values.role === 'both' ? theme.shadows[4] : 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: theme.shadows[2]
                          }
                        }}
                        onClick={() => setFieldValue('role', 'both')}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <CompareIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Both
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            I want to both provide and receive consultations on the platform
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  {touched.role && errors.role && (
                    <FormHelperText error>{errors.role}</FormHelperText>
                  )}
                </FormControl>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Next'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        );
      case 2:
        return (
          <Formik
            initialValues={{
              headline: formValues.headline,
              bio: formValues.bio,
              hourly_rate: formValues.hourly_rate,
              is_available_for_hire: formValues.is_available_for_hire
            }}
            validationSchema={ProviderSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Typography variant="h6" gutterBottom>
                  Professional Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Complete your professional profile to start offering consultations.
                </Typography>
                
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="headline"
                  label="Professional Headline"
                  name="headline"
                  placeholder="e.g., Senior Software Engineer with 10+ years experience"
                  error={touched.headline && Boolean(errors.headline)}
                  helperText={touched.headline && errors.headline}
                />
                
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="bio"
                  label="Professional Bio"
                  name="bio"
                  multiline
                  rows={4}
                  placeholder="Describe your professional background, expertise, and the type of consultations you offer..."
                  error={touched.bio && Boolean(errors.bio)}
                  helperText={touched.bio && errors.bio}
                />
                
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="hourly_rate"
                  label="Hourly Rate (in credits)"
                  name="hourly_rate"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  error={touched.hourly_rate && Boolean(errors.hourly_rate)}
                  helperText={touched.hourly_rate && errors.hourly_rate}
                />
                
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                  <FormLabel component="legend">Availability Status</FormLabel>
                  <RadioGroup
                    name="is_available_for_hire"
                    value={values.is_available_for_hire}
                    onChange={(e) => setFieldValue('is_available_for_hire', e.target.value === 'true')}
                  >
                    <FormControlLabel value={true} control={<Radio />} label="Available for new clients" />
                    <FormControlLabel value={false} control={<Radio />} label="Not currently accepting new clients" />
                  </RadioGroup>
                </FormControl>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || success}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Join ExpertConnect
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create your account to connect with experts or offer your expertise
        </Typography>
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
            Registration successful! Redirecting to login...
          </Alert>
        )}
        
        {(error || registerError) && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error || registerError}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ width: '100%' }}>
          {renderStepContent(activeStep)}
        </Box>
        
        <Divider sx={{ width: '100%', my: 3 }} />
        
        <Grid container justifyContent="center">
          <Grid item>
            <Link href="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default RegisterForm;
