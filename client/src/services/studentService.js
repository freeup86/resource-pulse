import axios from 'axios';

// Mock student data
const mockStudents = [
  {
    id: 1,
    firstName: 'Alex',
    lastName: 'Johnson',
    dateOfBirth: '2013-05-12',
    age: 10,
    grade: '5th',
    gender: 'Male',
    schoolName: 'Westside Elementary',
    currentSkillLevel: 'Intermediate',
    parent: {
      id: 1,
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'mjohnson@example.com',
      phone: '555-123-4567'
    },
    enrollments: [
      { id: 1, courseName: 'Robotics Fundamentals', status: 'Completed', startDate: '2022-09-10', endDate: '2022-12-15' },
      { id: 2, courseName: 'Advanced LEGO Robotics', status: 'Active', startDate: '2023-01-15', endDate: '2023-05-30' }
    ],
    specialNeeds: '',
    allergies: 'None',
    photoReleaseConsent: true,
    createdAt: '2022-07-15',
    notes: 'Shows strong interest in programming.',
    attendanceRate: 95,
    achievements: [
      { id: 1, name: 'Robot Design Award', date: '2022-11-10', description: 'First place in school competition' }
    ]
  },
  {
    id: 2,
    firstName: 'Sophia',
    lastName: 'Garcia',
    dateOfBirth: '2015-08-24',
    age: 8,
    grade: '3rd',
    gender: 'Female',
    schoolName: 'Lincoln Elementary',
    currentSkillLevel: 'Beginner',
    parent: {
      id: 2,
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'mgarcia@example.com',
      phone: '555-987-6543'
    },
    enrollments: [
      { id: 3, courseName: 'Intro to Robotics for Kids', status: 'Active', startDate: '2023-02-05', endDate: '2023-06-20' }
    ],
    specialNeeds: '',
    allergies: 'Peanuts',
    photoReleaseConsent: true,
    createdAt: '2023-01-25',
    notes: 'Very creative with building projects.',
    attendanceRate: 100,
    achievements: []
  },
  {
    id: 3,
    firstName: 'Tyler',
    lastName: 'Washington',
    dateOfBirth: '2010-11-30',
    age: 13,
    grade: '7th',
    gender: 'Male',
    schoolName: 'Oakridge Middle School',
    currentSkillLevel: 'Advanced',
    parent: {
      id: 3,
      firstName: 'David',
      lastName: 'Washington',
      email: 'dwashington@example.com',
      phone: '555-456-7890'
    },
    enrollments: [
      { id: 4, courseName: 'Competition Robotics Team', status: 'Active', startDate: '2022-08-15', endDate: '2023-06-15' },
      { id: 5, courseName: 'Robotics Programming with Python', status: 'Active', startDate: '2023-01-10', endDate: '2023-05-25' }
    ],
    specialNeeds: 'ADHD',
    allergies: 'None',
    photoReleaseConsent: true,
    createdAt: '2021-06-10',
    notes: 'Excellent at problem-solving and programming.',
    attendanceRate: 92,
    achievements: [
      { id: 2, name: 'Programming Excellence', date: '2022-04-15', description: 'Regional robotics competition award' },
      { id: 3, name: 'Team Captain', date: '2022-09-01', description: 'Selected as captain for competition team' }
    ]
  },
  {
    id: 4,
    firstName: 'Emily',
    lastName: 'Chen',
    dateOfBirth: '2012-03-18',
    age: 11,
    grade: '6th',
    gender: 'Female',
    schoolName: 'Eastside STEM Academy',
    currentSkillLevel: 'Intermediate',
    parent: {
      id: 4,
      firstName: 'James',
      lastName: 'Chen',
      email: 'jchen@example.com',
      phone: '555-222-3333'
    },
    enrollments: [
      { id: 6, courseName: 'Robotics and Engineering', status: 'Active', startDate: '2023-01-15', endDate: '2023-05-30' }
    ],
    specialNeeds: '',
    allergies: 'None',
    photoReleaseConsent: true,
    createdAt: '2022-12-05',
    notes: 'Particularly interested in mechanical design.',
    attendanceRate: 98,
    achievements: [
      { id: 4, name: 'Best Design', date: '2023-03-10', description: 'Class project award' }
    ]
  },
  {
    id: 5,
    firstName: 'Jamal',
    lastName: 'Wilson',
    dateOfBirth: '2014-07-22',
    age: 9,
    grade: '4th',
    gender: 'Male',
    schoolName: 'Westside Elementary',
    currentSkillLevel: 'Beginner',
    parent: {
      id: 5,
      firstName: 'Keisha',
      lastName: 'Wilson',
      email: 'kwilson@example.com',
      phone: '555-777-8888'
    },
    enrollments: [
      { id: 7, courseName: 'LEGO WeDo Robotics', status: 'Active', startDate: '2023-02-01', endDate: '2023-05-15' }
    ],
    specialNeeds: '',
    allergies: 'None',
    photoReleaseConsent: false,
    createdAt: '2023-01-15',
    notes: 'Showing great progress with basic programming concepts.',
    attendanceRate: 90,
    achievements: []
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get all students with optional filtering
export const getStudents = async (filters = {}) => {
  try {
    // In a real app, this would be an API call with query params
    // const response = await axios.get('/api/students', { params: filters });
    
    // Simulate API call
    await delay(800);
    
    // Apply mock filtering
    let filteredStudents = [...mockStudents];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredStudents = filteredStudents.filter(student => 
        student.firstName.toLowerCase().includes(search) || 
        student.lastName.toLowerCase().includes(search) ||
        student.schoolName.toLowerCase().includes(search)
      );
    }
    
    if (filters.skillLevel) {
      filteredStudents = filteredStudents.filter(student => 
        student.currentSkillLevel === filters.skillLevel
      );
    }
    
    if (filters.ageMin) {
      filteredStudents = filteredStudents.filter(student => 
        student.age >= parseInt(filters.ageMin)
      );
    }
    
    if (filters.ageMax) {
      filteredStudents = filteredStudents.filter(student => 
        student.age <= parseInt(filters.ageMax)
      );
    }
    
    return {
      data: filteredStudents,
      totalCount: filteredStudents.length
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// Get a specific student by ID
export const getStudentById = async (id) => {
  try {
    // In a real app, this would be an API call
    // const response = await axios.get(`/api/students/${id}`);
    
    // Simulate API call
    await delay(500);
    
    const student = mockStudents.find(s => s.id === parseInt(id));
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return { data: student };
  } catch (error) {
    console.error(`Error fetching student ${id}:`, error);
    throw error;
  }
};

// Create a new student
export const createStudent = async (studentData) => {
  try {
    // In a real app, this would be an API call
    // const response = await axios.post('/api/students', studentData);
    
    // Simulate API call
    await delay(1000);
    
    // Create a new student with mock ID
    const newStudent = {
      id: mockStudents.length + 1,
      ...studentData,
      createdAt: new Date().toISOString().split('T')[0],
      enrollments: [],
      achievements: [],
      attendanceRate: 0
    };
    
    // In a real app, we would use the response from the server
    // Here we're just simulating a successful creation
    return { 
      data: newStudent,
      message: 'Student created successfully' 
    };
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

// Update an existing student
export const updateStudent = async (id, studentData) => {
  try {
    // In a real app, this would be an API call
    // const response = await axios.put(`/api/students/${id}`, studentData);
    
    // Simulate API call
    await delay(1000);
    
    // In a real app, we would use the response from the server
    // Here we're just simulating a successful update
    return { 
      data: { id, ...studentData },
      message: 'Student updated successfully' 
    };
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
    throw error;
  }
};

// Delete a student
export const deleteStudent = async (id) => {
  try {
    // In a real app, this would be an API call
    // const response = await axios.delete(`/api/students/${id}`);
    
    // Simulate API call
    await delay(800);
    
    // In a real app, we would use the response from the server
    // Here we're just simulating a successful deletion
    return { message: 'Student deleted successfully' };
  } catch (error) {
    console.error(`Error deleting student ${id}:`, error);
    throw error;
  }
};

// Get student attendance
export const getStudentAttendance = async (studentId) => {
  try {
    // Simulate API call
    await delay(600);
    
    // Mock attendance data
    const attendanceData = [
      { id: 1, date: '2023-02-05', status: 'Present', courseName: 'Robotics Fundamentals' },
      { id: 2, date: '2023-02-12', status: 'Present', courseName: 'Robotics Fundamentals' },
      { id: 3, date: '2023-02-19', status: 'Absent', courseName: 'Robotics Fundamentals' },
      { id: 4, date: '2023-02-26', status: 'Present', courseName: 'Robotics Fundamentals' },
      { id: 5, date: '2023-03-05', status: 'Present', courseName: 'Robotics Fundamentals' },
      { id: 6, date: '2023-03-12', status: 'Late', courseName: 'Robotics Fundamentals' },
      { id: 7, date: '2023-03-19', status: 'Present', courseName: 'Robotics Fundamentals' },
      { id: 8, date: '2023-03-26', status: 'Present', courseName: 'Robotics Fundamentals' },
    ];
    
    return { data: attendanceData };
  } catch (error) {
    console.error(`Error fetching attendance for student ${studentId}:`, error);
    throw error;
  }
};

// Get student progress
export const getStudentProgress = async (studentId) => {
  try {
    // Simulate API call
    await delay(700);
    
    // Mock progress data
    const progressData = [
      { 
        id: 1, 
        date: '2023-02-28', 
        courseName: 'Robotics Fundamentals',
        skills: ['Basic robot construction', 'Simple programming', 'Sensor integration'],
        assessment: 'Excellent progress in construction skills. Programming concepts need more practice.',
        grade: 'B+',
        instructor: 'John Smith'
      },
      { 
        id: 2, 
        date: '2023-03-30', 
        courseName: 'Robotics Fundamentals',
        skills: ['Intermediate programming', 'Problem solving', 'Project planning'],
        assessment: 'Significant improvement in programming. Shows creative approaches to problem-solving.',
        grade: 'A-',
        instructor: 'John Smith'
      }
    ];
    
    return { data: progressData };
  } catch (error) {
    console.error(`Error fetching progress for student ${studentId}:`, error);
    throw error;
  }
};

// Enroll student in a course
export const enrollStudent = async (studentId, courseData) => {
  try {
    // Simulate API call
    await delay(1000);
    
    // In a real app, we would use the response from the server
    // Here we're just simulating a successful enrollment
    return { 
      message: 'Student enrolled successfully',
      data: {
        id: Math.floor(Math.random() * 1000) + 100,
        studentId,
        courseId: courseData.courseId,
        courseName: courseData.courseName,
        startDate: courseData.startDate,
        endDate: courseData.endDate,
        status: 'Active'
      }
    };
  } catch (error) {
    console.error(`Error enrolling student ${studentId}:`, error);
    throw error;
  }
};