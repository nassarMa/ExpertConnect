import { createTheme } from '@mui/material/styles';

// Create a custom theme for ExpertConnect
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a6cf7',
      light: '#7b8ff8',
      dark: '#3a5bd9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#6c757d',
    },
    success: {
      main: '#28a745',
      light: '#48c664',
      dark: '#1e7e34',
    },
    error: {
      main: '#dc3545',
      light: '#e45c6a',
      dark: '#bd2130',
    },
    warning: {
      main: '#ffc107',
      light: '#ffcd38',
      dark: '#e0a800',
    },
    info: {
      main: '#17a2b8',
      light: '#4db6c6',
      dark: '#117a8b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 16px 24px rgba(0, 0, 0, 0.05)',
    '0px 24px 32px rgba(0, 0, 0, 0.05)',
    '0px 32px 40px rgba(0, 0, 0, 0.05)',
    '0px 40px 48px rgba(0, 0, 0, 0.05)',
    '0px 48px 56px rgba(0, 0, 0, 0.05)',
    '0px 56px 64px rgba(0, 0, 0, 0.05)',
    '0px 64px 72px rgba(0, 0, 0, 0.05)',
    '0px 72px 80px rgba(0, 0, 0, 0.05)',
    '0px 80px 88px rgba(0, 0, 0, 0.05)',
    '0px 88px 96px rgba(0, 0, 0, 0.05)',
    '0px 96px 104px rgba(0, 0, 0, 0.05)',
    '0px 104px 112px rgba(0, 0, 0, 0.05)',
    '0px 112px 120px rgba(0, 0, 0, 0.05)',
    '0px 120px 128px rgba(0, 0, 0, 0.05)',
    '0px 128px 136px rgba(0, 0, 0, 0.05)',
    '0px 136px 144px rgba(0, 0, 0, 0.05)',
    '0px 144px 152px rgba(0, 0, 0, 0.05)',
    '0px 152px 160px rgba(0, 0, 0, 0.05)',
    '0px 160px 168px rgba(0, 0, 0, 0.05)',
    '0px 168px 176px rgba(0, 0, 0, 0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minWidth: 'auto',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
        },
      },
    },
  },
});

export default theme;
