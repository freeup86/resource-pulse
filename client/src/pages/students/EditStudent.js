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
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Chip,
  LinearProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { parse, format } from 'date-fns';
import { getStudentById, updateStudent } from '../../services/studentService';

// Mock data for dropdowns and multi-selects
const mockSchools = [
  { id: 1, name: 'Eastside Middle School' },
  { id: 2, name: 'Lincoln Elementary' },
  { id: 3, name: 'Westside High School' },
  { id: 4, name: 'Central Academy' },
  { id: 5, name: 'Parkview Elementary' },
];

const mockCourses = [
  { id: 1, name: 'Robotics 101' },
  { id: 2, name: 'Robotics for Beginners' },
  { id: 3, name: 'Advanced Programming' },
  { id: 4, name: 'Competition Prep' },
  { id: 5, name: 'Mechanical Design' },
  { id: 6, name: 'Electronics Fundamentals' },
];

const gradeOptions = [
  'K', '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th'
];

// Mock student data for demonstration
const mockStudents = {
  '1': {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    age: 12,
    dateOfBirth: '2011-05-10',
    grade: '7th',
    school: 'Eastside Middle School',
    courses: [
      { id: 1, name: 'Robotics 101' },
      { id: 4, name: 'Competition Prep' }
    ],
    skillLevel: 'Intermediate',
    enrollmentDate: '2023-09-15',
    parentName: 'Sarah Johnson',
    parentEmail: 'sarah.j@example.com',
    parentPhone: '(555) 123-4567',
    photoPermission: true,
    emergencyContact: true,
    notes: 'Alex shows great interest in programming aspects of robotics. Consider advanced programming course for next semester.'
  },
  '2': {
    id: '2',
    name: 'Maya Rodriguez',
    email: 'maya.r@example.com',
    age: 10,
    dateOfBirth: '2013-06-21',
    grade: '5th',
    school: 'Lincoln Elementary',
    courses: [
      { id: 2, name: 'Robotics for Beginners' }
    ],
    skillLevel: 'Beginner',
    enrollmentDate: '2023-10-02',
    parentName: 'Carlos Rodriguez',
    parentEmail: 'carlos.r@example.com',
    parentPhone: '(555) 987-6543',
    photoPermission: false,
    emergencyContact: true,
    notes: 'Maya is enthusiastic and engaged. Shows particular interest in mechanical design.'
  },
  '3': {
    id: '3',
    name: 'Ethan Davis',
    email: 'ethan.d@example.com',
    age: 15,
    dateOfBirth: '2008-03-17',
    grade: '10th',
    school: 'Westside High School',
    courses: [
      { id: 3, name: 'Advanced Programming' },
      { id: 4, name: 'Competition Prep' }
    ],
    skillLevel: 'Advanced',
    enrollmentDate: '2023-08-20',
    parentName: 'Jennifer Davis',
    parentEmail: 'jennifer.d@example.com',
    parentPhone: '(555) 456-7890',
    photoPermission: true,
    emergencyContact: false,
    notes: 'Ethan is a team leader and mentor to younger students. Considering him for junior instructor role next summer.'
  }
};

// Validation schema
const validationSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .max(100, 'Name must be 100 characters or less'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  age: yup
    .number()
    .positive('Age must be positive')
    .integer('Age must be an integer')
    .min(5, 'Age must be at least 5')
    .max(18, 'Age must be 18 or less')
    .required('Age is required'),
  dateOfBirth: yup
    .date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future'),
  grade: yup
    .string()
    .required('Grade is required'),
  school: yup
    .string()
    .required('School is required'),
  skillLevel: yup
    .string()
    .required('Skill level is required'),
  parentName: yup
    .string()
    .required('Parent name is required')
    .max(100, 'Parent name must be 100 characters or less'),
  parentEmail: yup
    .string()
    .email('Enter a valid email')
    .required('Parent email is required'),
  parentPhone: yup
    .string()
    .required('Parent phone is required')
    .matches(
      /^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
      'Invalid phone number format'
    ),
  courses: yup
    .array()
    .min(1, 'At least one course must be selected')
});

function EditStudent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        // In a real app, this would call the API
        // const response = await getStudentById(id);
        // setStudent(response.data);
        
        // For demonstration, we'll simulate API delay and use mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (mockStudents[id]) {
          setStudent(mockStudents[id]);
          setSubmitError(null);
        } else {
          setSubmitError('Student not found');
        }
      } catch (err) {
        console.error('Error fetching student details:', err);
        setSubmitError('Failed to load student details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  // Formik form handling
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      age: '',
      dateOfBirth: null,
      grade: '',
      school: '',
      skillLevel: 'Beginner',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      courses: [],
      notes: '',
      photoPermission: false,
      emergencyContact: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        // In a real app, this would call the API
        // await updateStudent(id, values);
        
        // For demonstration, we'll just simulate an API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate to student details on success
        navigate(`/students/${id}`);
      } catch (err) {
        console.error('Error updating student:', err);
        setSubmitError('Failed to update student. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  // Update form values when student data is loaded
  useEffect(() => {
    if (student) {
      formik.setValues({
        name: student.name || '',
        email: student.email || '',
        age: student.age || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
        grade: student.grade || '',
        school: student.school || '',
        skillLevel: student.skillLevel || 'Beginner',
        parentName: student.parentName || '',
        parentEmail: student.parentEmail || '',
        parentPhone: student.parentPhone || '',
        courses: student.courses || [],
        notes: student.notes || '',
        photoPermission: student.photoPermission || false,
        emergencyContact: student.emergencyContact || false,
      });
    }
  }, [student]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Header with back button and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(`/students/${id}`)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Student
          </Typography>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Student Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    label="Student Name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Student Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="age"
                    name="age"
                    label="Age"
                    type="number"
                    value={formik.values.age}
                    onChange={formik.handleChange}
                    error={formik.touched.age && Boolean(formik.errors.age)}
                    helperText={formik.touched.age && formik.errors.age}
                    InputProps={{
                      inputProps: { min: 5, max: 18 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date of Birth"
                      value={formik.values.dateOfBirth}
                      onChange={(value) => {
                        formik.setFieldValue('dateOfBirth', value);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth),
                          helperText: formik.touched.dateOfBirth && formik.errors.dateOfBirth,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="grade"
                    name="grade"
                    select
                    label="Grade"
                    value={formik.values.grade}
                    onChange={formik.handleChange}
                    error={formik.touched.grade && Boolean(formik.errors.grade)}
                    helperText={formik.touched.grade && formik.errors.grade}
                  >
                    {gradeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    id="school"
                    options={mockSchools}
                    getOptionLabel={(option) => option.name || option}
                    value={
                      formik.values.school 
                        ? mockSchools.find(s => s.name === formik.values.school) || formik.values.school
                        : null
                    }
                    onChange={(event, newValue) => {
                      formik.setFieldValue('school', newValue ? newValue.name || newValue : '');
                    }}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="School"
                        error={formik.touched.school && Boolean(formik.errors.school)}
                        helperText={formik.touched.school && formik.errors.school}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Skill Level</FormLabel>
                    <RadioGroup
                      row
                      name="skillLevel"
                      value={formik.values.skillLevel}
                      onChange={formik.handleChange}
                    >
                      <FormControlLabel value="Beginner" control={<Radio />} label="Beginner" />
                      <FormControlLabel value="Intermediate" control={<Radio />} label="Intermediate" />
                      <FormControlLabel value="Advanced" control={<Radio />} label="Advanced" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    id="courses"
                    options={mockCourses}
                    getOptionLabel={(option) => option.name || option}
                    value={formik.values.courses}
                    onChange={(event, newValue) => {
                      formik.setFieldValue('courses', newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          label={option.name || option} 
                          {...getTagProps({ index })} 
                          color="primary" 
                          variant="outlined"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Courses"
                        error={formik.touched.courses && Boolean(formik.errors.courses)}
                        helperText={formik.touched.courses && formik.errors.courses}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <ContactPhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Parent/Guardian Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="parentName"
                    name="parentName"
                    label="Parent/Guardian Name"
                    value={formik.values.parentName}
                    onChange={formik.handleChange}
                    error={formik.touched.parentName && Boolean(formik.errors.parentName)}
                    helperText={formik.touched.parentName && formik.errors.parentName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="parentEmail"
                    name="parentEmail"
                    label="Parent/Guardian Email"
                    value={formik.values.parentEmail}
                    onChange={formik.handleChange}
                    error={formik.touched.parentEmail && Boolean(formik.errors.parentEmail)}
                    helperText={formik.touched.parentEmail && formik.errors.parentEmail}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="parentPhone"
                    name="parentPhone"
                    label="Parent/Guardian Phone"
                    value={formik.values.parentPhone}
                    onChange={formik.handleChange}
                    error={formik.touched.parentPhone && Boolean(formik.errors.parentPhone)}
                    helperText={formik.touched.parentPhone && formik.errors.parentPhone}
                    placeholder="(555) 123-4567"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="emergencyContact"
                          name="emergencyContact"
                          checked={formik.values.emergencyContact}
                          onChange={formik.handleChange}
                        />
                      }
                      label="Emergency contact is the same as parent/guardian"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Additional Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="notes"
                    name="notes"
                    label="Notes"
                    multiline
                    rows={4}
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="photoPermission"
                          name="photoPermission"
                          checked={formik.values.photoPermission}
                          onChange={formik.handleChange}
                        />
                      }
                      label="Parent/Guardian has granted permission for photos and videos"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/students/${id}`)}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Update Student'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default EditStudent;