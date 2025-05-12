import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Student pages
import Students from './pages/students/Students';
import StudentDetails from './pages/students/StudentDetails';
import AddStudent from './pages/students/AddStudent';
import EditStudent from './pages/students/EditStudent';

// Course pages
import Courses from './pages/courses/Courses';
import CourseDetails from './pages/courses/CourseDetails';
import AddCourse from './pages/courses/AddCourse';
import EditCourse from './pages/courses/EditCourse';

// Session pages
import Sessions from './pages/sessions/Sessions';
import SessionDetails from './pages/sessions/SessionDetails';
import AddSession from './pages/sessions/AddSession';
import EditSession from './pages/sessions/EditSession';

// Parent pages
import Parents from './pages/parents/Parents';
import ParentDetails from './pages/parents/ParentDetails';
import AddParent from './pages/parents/AddParent';
import EditParent from './pages/parents/EditParent';

// School pages
import Schools from './pages/schools/Schools';
import SchoolDetails from './pages/schools/SchoolDetails';
import AddSchool from './pages/schools/AddSchool';
import EditSchool from './pages/schools/EditSchool';

// Equipment pages
import Equipment from './pages/equipment/Equipment';
import EquipmentDetails from './pages/equipment/EquipmentDetails';
import AddEquipment from './pages/equipment/AddEquipment';
import EditEquipment from './pages/equipment/EditEquipment';

// Instructor pages
import Instructors from './pages/instructors/Instructors';
import InstructorDetails from './pages/instructors/InstructorDetails';
import AddInstructor from './pages/instructors/AddInstructor';
import EditInstructor from './pages/instructors/EditInstructor';

// Enrollment pages
import Enrollments from './pages/enrollments/Enrollments';
import EnrollmentDetails from './pages/enrollments/EnrollmentDetails';
import AddEnrollment from './pages/enrollments/AddEnrollment';
import EditEnrollment from './pages/enrollments/EditEnrollment';

// Competition pages
import Competitions from './pages/competitions/Competitions';
import CompetitionDetails from './pages/competitions/CompetitionDetails';
import AddCompetition from './pages/competitions/AddCompetition';
import EditCompetition from './pages/competitions/EditCompetition';

// Report pages
import Reports from './pages/reports/Reports';

// Settings pages
import SettingsAlternative from './pages/settings/SettingsAlternative';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Students */}
          <Route path="students">
            <Route index element={<Students />} />
            <Route path=":id" element={<StudentDetails />} />
            <Route path="add" element={<AddStudent />} />
            <Route path="edit/:id" element={<EditStudent />} />
          </Route>
          
          {/* Parents */}
          <Route path="parents">
            <Route index element={<Parents />} />
            <Route path=":id" element={<ParentDetails />} />
            <Route path="add" element={<AddParent />} />
            <Route path="edit/:id" element={<EditParent />} />
          </Route>
          
          {/* Schools */}
          <Route path="schools">
            <Route index element={<Schools />} />
            <Route path=":id" element={<SchoolDetails />} />
            <Route path="add" element={<AddSchool />} />
            <Route path="edit/:id" element={<EditSchool />} />
          </Route>
          
          {/* Courses */}
          <Route path="courses">
            <Route index element={<Courses />} />
            <Route path=":id" element={<CourseDetails />} />
            <Route path="add" element={<AddCourse />} />
            <Route path="edit/:id" element={<EditCourse />} />
          </Route>
          
          {/* Sessions */}
          <Route path="sessions">
            <Route index element={<Sessions />} />
            <Route path=":id" element={<SessionDetails />} />
            <Route path="add" element={<AddSession />} />
            <Route path="edit/:id" element={<EditSession />} />
          </Route>
          
          {/* Enrollments */}
          <Route path="enrollments">
            <Route index element={<Enrollments />} />
            <Route path=":id" element={<EnrollmentDetails />} />
            <Route path="add" element={<AddEnrollment />} />
            <Route path="edit/:id" element={<EditEnrollment />} />
          </Route>
          
          {/* Equipment */}
          <Route path="equipment">
            <Route index element={<Equipment />} />
            <Route path=":id" element={<EquipmentDetails />} />
            <Route path="add" element={<AddEquipment />} />
            <Route path="edit/:id" element={<EditEquipment />} />
          </Route>
          
          {/* Instructors */}
          <Route path="instructors">
            <Route index element={<Instructors />} />
            <Route path=":id" element={<InstructorDetails />} />
            <Route path="add" element={<AddInstructor />} />
            <Route path="edit/:id" element={<EditInstructor />} />
          </Route>
          
          {/* Competitions */}
          <Route path="competitions">
            <Route index element={<Competitions />} />
            <Route path=":id" element={<CompetitionDetails />} />
            <Route path="add" element={<AddCompetition />} />
            <Route path="edit/:id" element={<EditCompetition />} />
          </Route>
          
          {/* Reports */}
          <Route path="reports" element={<Reports />} />

          {/* Settings - alternative modern design that works with existing layout */}
          <Route path="settings/*" element={<SettingsAlternative />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;