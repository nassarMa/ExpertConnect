import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { userAPI, categoryAPI } from '../api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import Layout from '../components/Layout';

export default function Experts() {
  const router = useRouter();
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getUsers();
        setExperts(response.data);
      } catch (error) {
        console.error('Failed to fetch experts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    
    fetchExperts();
    fetchCategories();
  }, []);
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) {
        params.skill = searchTerm;
      }
      
      const response = await userAPI.getUsers(params);
      setExperts(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredExperts = selectedCategory
    ? experts.filter(expert => 
        expert.skills.some(skill => 
          categories.find(c => c.id === parseInt(selectedCategory))?.name.toLowerCase() === skill.skill_name.toLowerCase()
        )
      )
    : experts;
  
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Find Experts
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search by skill"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Categories</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredExperts.length > 0 ? (
          <Grid container spacing={3}>
            {filteredExperts.map((expert) => (
              <Grid item key={expert.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={expert.profile_picture || ''}
                        sx={{ width: 64, height: 64, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h6">
                          {expert.first_name} {expert.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {expert.headline || 'Expert on ExpertConnect'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" paragraph>
                      {expert.bio || 'No bio available'}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Skills:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {expert.skills && expert.skills.length > 0 ? (
                          expert.skills.map((skill, index) => (
                            <Chip 
                              key={index} 
                              label={`${skill.skill_name} (${skill.skill_level})`} 
                              size="small" 
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No skills listed
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => router.push(`/experts/${expert.id}`)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => router.push(`/meetings/new?expert=${expert.id}`)}
                    >
                      Request Meeting
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No experts found matching your criteria
            </Typography>
          </Box>
        )}
      </Container>
    </Layout>
  );
}
