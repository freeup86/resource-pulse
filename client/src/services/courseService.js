import axios from 'axios';

const API_URL = '/api/courses';

/**
 * Fetches all courses with optional filtering
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} Promise object with course data
 */
export const getCourses = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

/**
 * Fetches a specific course by ID
 * @param {string} id - Course ID
 * @returns {Promise} Promise object with course data
 */
export const getCourseById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new course
 * @param {Object} courseData - Course data object
 * @returns {Promise} Promise object with created course data
 */
export const createCourse = async (courseData) => {
  try {
    const response = await axios.post(API_URL, courseData);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Updates an existing course
 * @param {string} id - Course ID
 * @param {Object} courseData - Updated course data
 * @returns {Promise} Promise object with updated course data
 */
export const updateCourse = async (id, courseData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, courseData);
    return response.data;
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a course
 * @param {string} id - Course ID
 * @returns {Promise} Promise object with deletion status
 */
export const deleteCourse = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    throw error;
  }
};

/**
 * Gets all sessions for a course
 * @param {string} courseId - Course ID
 * @returns {Promise} Promise object with course sessions
 */
export const getCourseSchedule = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/${courseId}/sessions`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sessions for course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Gets all enrolled students for a course
 * @param {string} courseId - Course ID
 * @returns {Promise} Promise object with enrolled students
 */
export const getCourseEnrollments = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/${courseId}/enrollments`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching enrollments for course ${courseId}:`, error);
    throw error;
  }
};

// Mock data for courses
export const mockCourses = [
  {
    id: '1',
    title: 'Robotics for Beginners',
    description: 'An introduction to robotics concepts and building simple robots. Students will learn basic programming and engineering concepts through hands-on activities.',
    ageRange: '7-10',
    skillLevel: 'Beginner',
    duration: '8 weeks',
    curriculum: [
      'Introduction to robotics',
      'Simple machines and mechanisms',
      'Basic programming concepts',
      'Sensors and inputs',
      'Building your first robot',
      'Robot movement and control',
      'Team challenges',
      'Final project showcase'
    ],
    materials: 'LEGO® Education SPIKE™ Essential Kit or similar beginner-friendly robotics kit',
    maxCapacity: 15,
    price: 249.99,
    imageUrl: 'https://example.com/robotics-beginners.jpg',
    active: true,
    createdAt: '2023-09-01'
  },
  {
    id: '2',
    title: 'Robotics 101',
    description: 'A comprehensive introduction to robotics for middle school students. Covers programming, design, and problem-solving through engaging robot-building activities.',
    ageRange: '11-13',
    skillLevel: 'Intermediate',
    duration: '10 weeks',
    curriculum: [
      'Robotics fundamentals',
      'Mechanical design principles',
      'Programming with blocks and text',
      'Sensors and data collection',
      'Autonomous navigation',
      'Robot arm mechanics',
      'Obstacle courses and challenges',
      'Design thinking process',
      'Iterative testing and improvement',
      'Competition preparation'
    ],
    materials: 'LEGO® MINDSTORMS® Education EV3 Core Set or similar',
    maxCapacity: 12,
    price: 299.99,
    imageUrl: 'https://example.com/robotics-101.jpg',
    active: true,
    createdAt: '2023-08-15'
  },
  {
    id: '3',
    title: 'Advanced Programming for Robotics',
    description: 'Deep dive into programming concepts for advanced robotics applications. Students will learn to use Python to control robots and implement complex behaviors.',
    ageRange: '14-18',
    skillLevel: 'Advanced',
    duration: '12 weeks',
    curriculum: [
      'Python programming fundamentals',
      'Object-oriented programming for robotics',
      'Robot Operating System (ROS) basics',
      'Sensor fusion and data processing',
      'Computer vision fundamentals',
      'Machine learning for robotics',
      'Control algorithms',
      'Autonomous navigation systems',
      'Multi-robot coordination',
      'Real-world problem solving',
      'Advanced project development',
      'Final competition'
    ],
    materials: 'Raspberry Pi with robot kit or Arduino-based robot platform',
    maxCapacity: 10,
    price: 399.99,
    imageUrl: 'https://example.com/advanced-programming.jpg',
    active: true,
    createdAt: '2023-07-20'
  },
  {
    id: '4',
    title: 'Competition Prep Workshop',
    description: 'Intensive workshop designed to prepare students for robotics competitions. Focus on strategy, advanced building techniques, efficient programming, and teamwork.',
    ageRange: '10-18',
    skillLevel: 'Intermediate to Advanced',
    duration: '6 weeks',
    curriculum: [
      'Competition rules and strategies',
      'Advanced building techniques',
      'Efficient programming',
      'Time management during competitions',
      'Troubleshooting under pressure',
      'Team roles and collaboration'
    ],
    materials: 'Varies by competition type (FIRST LEGO League, VEX, etc.)',
    maxCapacity: 20,
    price: 249.99,
    imageUrl: 'https://example.com/competition-prep.jpg',
    active: true,
    createdAt: '2023-08-05'
  },
  {
    id: '5',
    title: 'Robotics Mini-Camp for Young Innovators',
    description: 'A fun introduction to robotics for our youngest engineers. Building, programming, and playing with robot kits designed for early elementary students.',
    ageRange: '5-7',
    skillLevel: 'Beginner',
    duration: '4 weeks',
    curriculum: [
      'What is a robot?',
      'Simple machines',
      'Building blocks of programming',
      'Robot stories and creativity'
    ],
    materials: 'LEGO® Education BricQ Motion Essential Set and tablets with kid-friendly programming apps',
    maxCapacity: 10,
    price: 149.99,
    imageUrl: 'https://example.com/mini-camp.jpg',
    active: true,
    createdAt: '2023-10-01'
  },
  {
    id: '6',
    title: 'Robotics and AI Exploration',
    description: 'Explore the fascinating intersection of robotics and artificial intelligence. Learn how AI enhances robot capabilities and build projects that demonstrate machine learning concepts.',
    ageRange: '15-18',
    skillLevel: 'Advanced',
    duration: '14 weeks',
    curriculum: [
      'Fundamentals of AI and machine learning',
      'Neural networks for robotics',
      'Computer vision and object recognition',
      'Natural language processing for robots',
      'Reinforcement learning',
      'AI ethics and considerations',
      'Advanced sensors and data collection',
      'Building intelligent robot systems',
      'Robot decision making',
      'Predictive algorithms',
      'Human-robot interaction',
      'Research trends in robotics AI',
      'Capstone project development',
      'Project showcase and demonstration'
    ],
    materials: 'NVIDIA Jetson Nano Developer Kit or similar AI-capable hardware with robotic components',
    maxCapacity: 8,
    price: 499.99,
    imageUrl: 'https://example.com/robotics-ai.jpg',
    active: true,
    createdAt: '2023-07-10'
  },
  {
    id: '7',
    title: 'Girls in Robotics',
    description: "A program designed to encourage girls' participation in robotics and engineering. Build confidence, skills, and a supportive community while working on exciting robotics projects.",
    ageRange: '10-15',
    skillLevel: 'Beginner to Intermediate',
    duration: '10 weeks',
    curriculum: [
      'Introduction to engineering and robotics',
      'Women in STEM: history and role models',
      'Robot design fundamentals',
      'Programming essentials',
      'Electronics and circuits',
      'Project planning and management',
      'Creative problem solving',
      'Team leadership skills',
      'Design challenges',
      'Showcase and community presentation'
    ],
    materials: 'VEX IQ Super Kit or similar platform with variety of components',
    maxCapacity: 12,
    price: 299.99,
    imageUrl: 'https://example.com/girls-robotics.jpg',
    active: true,
    createdAt: '2023-09-15'
  },
  {
    id: '8',
    title: 'Underwater Robotics Challenge',
    description: 'Design, build, and operate underwater robots (ROVs) to solve simulated real-world marine scenarios. Great for students interested in marine science and engineering.',
    ageRange: '13-18',
    skillLevel: 'Intermediate to Advanced',
    duration: '12 weeks',
    curriculum: [
      'Marine robotics introduction',
      'Underwater engineering principles',
      'Waterproofing and buoyancy',
      'Propulsion systems',
      'Control systems for underwater environments',
      'Sensor selection for underwater use',
      'Camera and lighting systems',
      'Tether management',
      'Marine conservation applications',
      'Field testing procedures',
      'Challenge mission preparation',
      'Final ROV competition'
    ],
    materials: 'Underwater ROV kit with waterproof motors, controllers, and housing',
    maxCapacity: 10,
    price: 449.99,
    imageUrl: 'https://example.com/underwater-robotics.jpg',
    active: true,
    createdAt: '2023-08-20'
  }
];