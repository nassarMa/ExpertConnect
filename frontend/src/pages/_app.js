import { AuthProvider } from '../context/AuthContext';
import { CreditProvider } from '../context/CreditContext';
import { MeetingProvider } from '../context/MeetingContext';
import { MessagingProvider } from '../context/MessagingContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '../styles/globals.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CreditProvider>
          <MeetingProvider>
            <MessagingProvider>
              <Component {...pageProps} />
            </MessagingProvider>
          </MeetingProvider>
        </CreditProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
