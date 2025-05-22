import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppProvider from './contexts/AppProvider';
import { SkillsProvider } from './contexts/SkillsContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
import SkillsPage from './components/admin/SkillsPage';
import ImportPage from './components/admin/ImportPage';
import ExportPage from './components/admin/ExportPage';
import SyncPage from './components/admin/SyncPage';
import SettingsPage from './components/admin/SettingsPage';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import CapacityPlanningPage from './components/capacity/CapacityPlanningPage';
import NotificationsListPage from './components/notifications/NotificationsListPage';
import NotificationPage from './components/notifications/NotificationPage';
import NotificationSettingsPage from './components/notifications/NotificationSettingsPage';

// AI Feature Components
import UtilizationForecastPage from './components/ai-features/forecast/UtilizationForecastPage';
import ProjectRiskPage from './components/ai-features/risk/ProjectRiskPage';
import NaturalLanguageSearchPage from './components/ai-features/search/NaturalLanguageSearchPage';
import FinancialOptimizationPage from './components/ai-features/finance/FinancialOptimizationPage';
import DataFixTest from './components/ai-features/finance/DataFixTest';
import SkillsGapPage from './components/ai-features/skills-gap/SkillsGapPage';
import DocumentProcessingPage from './components/ai-features/document-processor/DocumentProcessingPage';
import ClientSatisfactionPage from './components/ai-features/satisfaction/ClientSatisfactionPage';
import WhatIfScenarioPage from './components/whatif/WhatIfScenarioPage';

// Auth Components
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import ProfilePage from './components/auth/ProfilePage';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <SkillsProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* All other protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/resources" element={<ResourcesPage />} />
                        <Route path="/resources/:id" element={<ResourceDetailPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:id" element={<ProjectDetailPage />} />
                        <Route path="/allocations" element={<AllocationsPage />} />
                        <Route path="/ending-soon" element={<EndingSoonPage />} />
                        <Route path="/matches" element={<MatchesPage />} />
                        <Route path="/timeline" element={<TimelinePage />} />
                        <Route path="/capacity" element={<CapacityPlanningPage />} />
                        <Route path="/admin/roles" element={<RolesPage />} />
                        <Route path="/admin/skills" element={<SkillsPage />} />
                        <Route path="/admin/import" element={<ImportPage />} />
                        <Route path="/admin/export" element={<ExportPage />} />
                        <Route path="/admin/sync" element={<SyncPage />} />
                        <Route path="/admin/settings" element={<SettingsPage />} />
                        <Route path="/analytics" element={<AnalyticsDashboard />} />
                        <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
                        <Route path="/notifications/:id" element={<NotificationPage />} />
                        <Route path="/notifications" element={<NotificationsListPage />} />
                        <Route path="/profile" element={<ProfilePage />} />

                        {/* AI Features Routes */}
                        <Route path="/ai/forecast" element={<UtilizationForecastPage />} />
                        <Route path="/ai/risk" element={<ProjectRiskPage />} />
                        <Route path="/ai/search" element={<NaturalLanguageSearchPage />} />
                        <Route path="/ai/finance" element={<FinancialOptimizationPage />} />
                        <Route path="/ai/finance/test" element={<DataFixTest />} />
                        <Route path="/ai/skills" element={<SkillsGapPage />} />
                        <Route path="/ai/documents" element={<DocumentProcessingPage />} />
                        <Route path="/ai/satisfaction" element={<ClientSatisfactionPage />} />
                        <Route path="/whatif" element={<WhatIfScenarioPage />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </SkillsProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;