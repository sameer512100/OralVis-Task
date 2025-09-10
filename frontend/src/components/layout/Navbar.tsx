import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Activity, LogOut, Upload, FileText, Users, Eye } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const PatientNav = () => (
    <div className="flex items-center space-x-4">
      <Link to="/dashboard">
        <Button
          variant={isActive('/dashboard') ? 'default' : 'ghost'}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </Link>
      <Link to="/submissions">
        <Button
          variant={isActive('/submissions') ? 'default' : 'ghost'}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          My Reports
        </Button>
      </Link>
    </div>
  );

  const AdminNav = () => (
    <div className="flex items-center space-x-4">
      <Link to="/admin/submissions">
        <Button
          variant={isActive('/admin/submissions') ? 'default' : 'ghost'}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Submissions
        </Button>
      </Link>
    </div>
  );

  return (
    <nav className="bg-medical-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">DentalCare</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user.role === 'patient' ? <PatientNav /> : <AdminNav />}
            
            <div className="flex items-center space-x-4 ml-8 border-l border-border pl-4">
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.role})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};