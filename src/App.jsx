import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';

// Pages
import Home from '@/pages/Home';
import Workspace from '@/pages/Workspace';
import StoryBible from '@/pages/StoryBible';
import StoryState from '@/pages/StoryState';
import StrategicBoard from '@/pages/StrategicBoard';
import Analytics from '@/pages/Analytics';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Routes>
              {/* Auth pages (public) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                </Route>
                <Route path="/project/:id" element={<Workspace />} />
                <Route path="/project/:id/bible" element={<StoryBible />} />
                <Route path="/project/:id/state" element={<StoryState />} />
                <Route path="/project/:id/board" element={<StrategicBoard />} />
                <Route path="/project/:id/analytics" element={<Analytics />} />
              </Route>
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
