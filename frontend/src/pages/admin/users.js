import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  Button, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton,
  Snackbar, Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/admin/users');
          return;
        }

        const response = await axios.get('/api/users/me/', {
          headers: { Authorization: `Token ${token}` }
        });

        if (!response.data.is_admin) {
          router.push('/dashboard');
          return;
        }

        // Fetch users
        fetchUsers();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        router.push('/login?redirect=/admin/users');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users/', {
        headers: { Authorization: `Token ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching users');
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (user) => {
    setCurrentUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${currentUser.id}/`, currentUser, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === currentUser.id ? currentUser : user
      ));
      
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating user',
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error deleting user',
        severity: 'error'
      });
    }
  };

  const handleViewUserDetails = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <Typography variant="h4">Loading Users...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <Box my={4} textAlign="center">
            <Typography variant="h4" color="error">{error}</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            User Management
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/admin')}
            >
              Back to Dashboard
            </Button>
            
            <TextField
              label="Search Users"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Box>
          
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                        <TableCell>{user.credit_balance}</TableCell>
                        <TableCell>{new Date(user.date_joined).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.is_verified ? 'Verified' : 'Unverified'}
                          {user.is_admin && ' (Admin)'}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewUserDetails(user.id)}
                            title="View Details"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(user)}
                            title="Edit User"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
        
        {/* Edit User Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            {currentUser && (
              <Box component="form" noValidate sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  value={currentUser.username}
                  onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="First Name"
                  value={currentUser.first_name}
                  onChange={(e) => setCurrentUser({...currentUser, first_name: e.target.value})}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Last Name"
                  value={currentUser.last_name}
                  onChange={(e) => setCurrentUser({...currentUser, last_name: e.target.value})}
                />
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      color={currentUser.is_verified ? "primary" : "error"}
                      fullWidth
                      onClick={() => setCurrentUser({
                        ...currentUser, 
                        is_verified: !currentUser.is_verified
                      })}
                    >
                      {currentUser.is_verified ? "Verified" : "Unverified"}
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      color={currentUser.is_admin ? "primary" : "error"}
                      fullWidth
                      onClick={() => setCurrentUser({
                        ...currentUser, 
                        is_admin: !currentUser.is_admin
                      })}
                    >
                      {currentUser.is_admin ? "Admin" : "Not Admin"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleUpdateUser} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default UserManagement;
