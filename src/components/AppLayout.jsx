import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, Moon, Sun, User, LogOut } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <Link to="/" className="flex items-center gap-2 mr-6">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-semibold">StoryForge</span>
          </Link>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <span className="text-xs text-muted-foreground">
                  {user?.email || 'User'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
