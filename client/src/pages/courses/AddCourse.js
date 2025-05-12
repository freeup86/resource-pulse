import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { createCourse } from '../../services/courseService';

const AddCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    
    setLoading(true);
    
    try {
      // In a real app, this would call the API
      // const response = await createCourse(formData);
      
      // For demonstration, we'll simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/courses');
      }, 1500);
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/courses')}
        sx={{ mb: 4 }}
      >
        Back to Courses
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Robotics Course
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Course created successfully! Redirecting...
        </Alert>
      )}
      
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 3 }} />}
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
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
              disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
                disabled={loading}
                placeholder="e.g., Introduction to robotics"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddCurriculumItem}
                disabled={!curriculumItem.trim() || loading}
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
                  disabled={loading}
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
                onClick={() => navigate('/courses')}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                Create Course
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AddCourse;