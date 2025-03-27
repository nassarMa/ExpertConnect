import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, Menu, MenuItem, IconButton, Badge, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Message as MessageIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCreditContext } from '../context/CreditContext';
import { useMessagingContext } from '../context/MessagingContext';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[1],
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  marginLeft: theme.spacing(2),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  fontWeight: active ? 600 : 500,
  position: 'relative',
  '&:after': active ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '3px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px 3px 0 0',
  } : {},
}));

const MobileNavItem = styled(MenuItem)(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  fontWeight: active ? 600 : 500,
}));

const CreditBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
  fontSize: '0.875rem',
}));

const Layout = ({ children }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { balance } = useCreditContext();
  const { unreadCount } = useMessagingContext ? useMessagingContext() : { unreadCount: 0 };
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    router.push('/login');
  };
  
  const isActive = (path) => {
    if (path === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(path);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <StyledAppBar position="sticky">
        <Toolbar>
          <Link href="/" passHref>
            <LogoText variant="h5" component="a">
              ExpertConnect
            </LogoText>
          </Link>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {user ? (
            <>
              {!isMobile && (
                <>
                  <NavButton 
                    component={Link} 
                    href="/dashboard"
                    active={isActive('/dashboard')}
                  >
                    Dashboard
                  </NavButton>
                  <NavButton 
                    component={Link} 
                    href="/experts"
                    active={isActive('/experts')}
                  >
                    Experts
                  </NavButton>
                  <NavButton 
                    component={Link} 
                    href="/meetings"
                    active={isActive('/meetings')}
                  >
                    Meetings
                  </NavButton>
                  <NavButton 
                    component={Link} 
                    href="/messages"
                    active={isActive('/messages')}
                    endIcon={
                      unreadCount > 0 ? (
                        <Badge badgeContent={unreadCount} color="error" />
                      ) : null
                    }
                  >
                    Messages
                  </NavButton>
                  <NavButton 
                    component={Link} 
                    href="/credits"
                    active={isActive('/credits')}
                  >
                    <CreditBadge>
                      <CreditCardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {balance}
                    </CreditBadge>
                  </NavButton>
                </>
              )}
              
              <IconButton 
                color="inherit" 
                sx={{ ml: 1 }}
                onClick={handleUserMenuOpen}
              >
                {user.avatar ? (
                  <Avatar 
                    src={user.avatar} 
                    alt={user.name || 'User'} 
                    sx={{ width: 40, height: 40 }}
                  />
                ) : (
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                )}
              </IconButton>
              
              {isMobile && (
                <IconButton 
                  color="inherit" 
                  edge="end" 
                  onClick={handleMobileMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              {/* User Menu */}
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 2,
                  sx: { mt: 1, width: 200, borderRadius: 2 }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {user.name || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                
                <MenuItem 
                  component={Link} 
                  href="/profile"
                  onClick={handleUserMenuClose}
                  sx={{ py: 1.5 }}
                >
                  <PersonIcon sx={{ mr: 2 }} />
                  Profile
                </MenuItem>
                
                {user.isAdmin && (
                  <MenuItem 
                    component={Link} 
                    href="/admin"
                    onClick={handleUserMenuClose}
                    sx={{ py: 1.5 }}
                  >
                    <DashboardIcon sx={{ mr: 2 }} />
                    Admin Panel
                  </MenuItem>
                )}
                
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ py: 1.5, color: theme.palette.error.main }}
                >
                  <LogoutIcon sx={{ mr: 2 }} />
                  Logout
                </MenuItem>
              </Menu>
              
              {/* Mobile Menu */}
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 2,
                  sx: { mt: 1, width: 200, borderRadius: 2 }
                }}
              >
                <MobileNavItem 
                  component={Link} 
                  href="/dashboard"
                  onClick={handleMobileMenuClose}
                  active={isActive('/dashboard')}
                  sx={{ py: 1.5 }}
                >
                  <DashboardIcon sx={{ mr: 2 }} />
                  Dashboard
                </MobileNavItem>
                
                <MobileNavItem 
                  component={Link} 
                  href="/experts"
                  onClick={handleMobileMenuClose}
                  active={isActive('/experts')}
                  sx={{ py: 1.5 }}
                >
                  <PeopleIcon sx={{ mr: 2 }} />
                  Experts
                </MobileNavItem>
                
                <MobileNavItem 
                  component={Link} 
                  href="/meetings"
                  onClick={handleMobileMenuClose}
                  active={isActive('/meetings')}
                  sx={{ py: 1.5 }}
                >
                  <EventNoteIcon sx={{ mr: 2 }} />
                  Meetings
                </MobileNavItem>
                
                <MobileNavItem 
                  component={Link} 
                  href="/messages"
                  onClick={handleMobileMenuClose}
                  active={isActive('/messages')}
                  sx={{ py: 1.5 }}
                >
                  <MessageIcon sx={{ mr: 2 }} />
                  Messages
                  {unreadCount > 0 && (
                    <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
                  )}
                </MobileNavItem>
                
                <MobileNavItem 
                  component={Link} 
                  href="/credits"
                  onClick={handleMobileMenuClose}
                  active={isActive('/credits')}
                  sx={{ py: 1.5 }}
                >
                  <CreditCardIcon sx={{ mr: 2 }} />
                  Credits: {balance}
                </MobileNavItem>
                
                <MobileNavItem 
                  component={Link} 
                  href="/profile"
                  onClick={handleMobileMenuClose}
                  active={isActive('/profile')}
                  sx={{ py: 1.5 }}
                >
                  <PersonIcon sx={{ mr: 2 }} />
                  Profile
                </MobileNavItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                component={Link} 
                href="/login"
                variant="outlined" 
                color="primary"
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                component={Link} 
                href="/register"
                variant="contained" 
                color="primary"
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </StyledAppBar>
      
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 0 }
            }}
          >
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} ExpertConnect. All rights reserved.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="/terms" passHref>
                <Typography variant="body2" component="a" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                  Terms of Service
                </Typography>
              </Link>
              <Link href="/privacy" passHref>
                <Typography variant="body2" component="a" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                  Privacy Policy
                </Typography>
              </Link>
              <Link href="/contact" passHref>
                <Typography variant="body2" component="a" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                  Contact Us
                </Typography>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
