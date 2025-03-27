import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../components/theme';
import { AuthProvider } from '../context/AuthContext';
import { CreditProvider } from '../context/CreditContext';
import { MessagingProvider } from '../context/MessagingContext';

function MyApp({ Component, pageProps }) {
  React.useEffect(() => {
    // Remove the server-side injected CSS when running in browser
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CreditProvider>
          <MessagingProvider>
            <Component {...pageProps} />
          </MessagingProvider>
        </CreditProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
