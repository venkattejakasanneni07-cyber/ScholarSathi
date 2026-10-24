import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DeveloperDrawer } from './components/DeveloperDrawer';
import { ProfilePage } from './pages/ProfilePage';
import { EligibilityPage } from './pages/EligibilityPage';
import { PlannerPage } from './pages/PlannerPage';
import { TimelinePage } from './pages/TimelinePage';
import { ChecksPage } from './pages/ChecksPage';
import { EvaluationPage } from './pages/EvaluationPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EC] text-[#14213D]">
      {/* Sticky Header with NSP styling & synthetic banner */}
      <Header />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar (Desktop) */}
        <Navigation />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/profile" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/eligibility" element={<EligibilityPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/checks" element={<ChecksPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="*" element={<Navigate to="/profile" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating Developer & Judge Drawer */}
      <DeveloperDrawer />
    </div>
  );
};
