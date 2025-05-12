import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Alert,
  LinearProgress,
  FormHelperText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getCourseById, updateCourse, mockCourses } from '../../services/courseService';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [curriculumItem, setCurriculumItem] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ageRange: '',
    skillLevel: '',
    duration: '',
    curriculum: [],
    materials: '',
    maxCapacity: 15,
    price: 0,
    imageUrl: '',
    active: true,
  });
  
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    ageRange: '',
    skillLevel: '',
    duration: '',
    materials: '',
    maxCapacity: '',
    price: '',
  });
  
  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // In a real app, this would call the API
        // const response = await getCourseById(id);
        
        // For demonstration, we're using mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        const course = mockCourses.find(c => c.id === id);
        if (!course) {
          throw new Error('Course not found');
        }
        
        setFormData(course);
        setError(null);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. The course may not exist or there was a network error.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [id]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Handle switch toggle
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };
  
  // Handle curriculum item input change
  const handleCurriculumItemChange = (e) => {
    setCurriculumItem(e.target.value);
  };
  
  // Add curriculum item to the list
  const handleAddCurriculumItem = () => {
    if (curriculumItem.trim()) {
      setFormData({
        ...formData,
        curriculum: [...formData.curriculum, curriculumItem.trim()],
      });
      setCurriculumItem('');
    }
  };
  
  // Remove curriculum item from the list
  const handleRemoveCurriculumItem = (index) => {
    const updatedCurriculum = [...formData.curriculum];
    updatedCurriculum.splice(index, 1);
    setFormData({
      ...formData,
      curriculum: updatedCurriculum,
    });
  };
  
  // Validate form fields
  const validateForm = () => {
    let valid = true;
    const errors = {
      title: '',
      description: '',
      ageRange: '',
      skillLevel: '',
      duration: '',
      materials: '',
      maxCapacity: '',
      price: '',
    };
    
    if (!formData.title.trim()) {
      errors.title = 'Course title is required';
      valid = false;
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Course description is required';
      valid = false;
    } else if (formData.description.length < 20) {
      errors.description = 'Description should be at least 20 characters';
      valid = false;
    }
    
    if (!formData.ageRange.trim()) {
      errors.ageRange = 'Age range is required';
      valid = false;
    }
    
    if (!formData.skillLevel) {
      errors.skillLevel = 'Skill level is required';
      valid = false;
    }
    
    if (!formData.duration.trim()) {
      errors.duration = 'Duration is required';
      valid = false;
    }
    
    if (!formData.materials.trim()) {
      errors.materials = 'Materials information is required';
      valid = false;
    }
    
    if (formData.maxCapacity <= 0) {
      errors.maxCapacity = 'Maximum capacity must be greater than 0';
      valid = false;
    }
    
    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In a real app, this would call the API
      // const response = await updateCourse(id, formData);
      
      // For demonstration, we'll simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/courses/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body1">Loading course data...</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/courses/${id}`)}
        sx={{ mb: 4 }}
      >
        Back to Course Details
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Course
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Course updated successfully! Redirecting...
        </Alert>
      )}
      
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        {(loading || submitting) && <LinearProgress sx={{ mb: 3 }} />}
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleSwitchChange}
                    name="active"
                    color="primary"
                    disabled={submitting}
                  />
                }
                label={formData.active ? "Active" : "Inactive"}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Course Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={!!formErrors.title}
              helperText={formErrors.title}
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!formErrors.skillLevel}>
              <InputLabel id="skill-level-label">Skill Level</InputLabel>
              <Select
                labelId="skill-level-label"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
                label="Skill Level"
                disabled={submitting}
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Beginner to Intermediate">Beginner to Intermediate</MenuItem>
                <MenuItem value="Intermediate to Advanced">Intermediate to Advanced</MenuItem>
              </Select>
              {formErrors.skillLevel && <FormHelperText>{formErrors.skillLevel}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Age Range"
              name="ageRange"
              value={formData.ageRange}
              onChange={handleChange}
              placeholder="e.g., 7-10"
              error={!!formErrors.ageRange}
              helperText={formErrors.ageRange}
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 8 weeks"
              error={!!formErrors.duration}
              helperText={formErrors.duration}
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Maximum Capacity"
              name="maxCapacity"
              type="number"
              value={formData.maxCapacity}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
              error={!!formErrors.maxCapacity}
              helperText={formErrors.maxCapacity}
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
              error={!!formErrors.price}
              helperText={formErrors.price}
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Course Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={!!formErrors.description}
              helperText={formErrors.description}
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Materials Required"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              error={!!formErrors.materials}
              helperText={formErrors.materials}
              disabled={submitting}
              placeholder="List all materials required for this course"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              disabled={submitting}
              placeholder="URL to course image (optional)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Curriculum Items
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="New Curriculum Item"
                value={curriculumItem}
                onChange={handleCurriculumItemChange}
                disabled={submitting}
                placeholder="e.g., Introduction to robotics"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddCurriculumItem}
                disabled={!curriculumItem.trim() || submitting}
                sx={{ ml: 1 }}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.curriculum.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onDelete={() => handleRemoveCurriculumItem(index)}
                  disabled={submitting}
                />
              ))}
              
              {formData.curriculum.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No curriculum items added yet. Add some curriculum topics above.
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/courses/${id}`)}
                sx={{ mr: 1 }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={submitting}
              >
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default EditCourse;