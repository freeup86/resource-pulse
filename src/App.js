import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppProvider from './contexts/AppProvider';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import ResourcesPage from './components/resources/ResourcesPage';
import ResourceDetailPage from './components/resources/ResourceDetailPage';
import ProjectsPage from './components/projects/ProjectsPage';
import ProjectDetailPage from './components/projects/ProjectDetailPage';
import AllocationsPage from './components/allocations/AllocationsPage';
import EndingSoonPage from './components/allocations/EndingSoonPage';
import MatchesPage from './components/matching/MatchesPage';
import TimelinePage from './components/pages/TimelinePage';
import RolesPage from './components/admin/RolesPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/allocations" element={<AllocationsPage />} />
            <Route path="/ending-soon" element={<EndingSoonPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </AppProvider>
  );
}

export default App;