import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Newspaper, 
  Settings, 
  History, 
  Eye, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const initials = user?.username 
    ? user.username.split(' ').map(n => n[0]).join('').toUpperCase() 
    : 'UN';

  const navItems = [
    { href: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { href: "/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
    { href: "/history", icon: <History className="h-5 w-5" />, label: "Delivery History" },
    { href: "/preview", icon: <Eye className="h-5 w-5" />, label: "Preview Articles" }
  ];

  return (
    <>
      {/* Mobile Nav Toggle */}
      <button 
        onClick={toggleSidebar}
        className="fixed z-50 bottom-4 right-4 md:hidden bg-primary p-3 rounded-full shadow-lg text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <div 
        className={cn(
          "sidebar-nav fixed md:relative w-64 md:w-72 min-h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] shadow-lg z-40 md:transform-none",
          isOpen ? "open" : "closed",
          className
        )}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-end mb-8">
            <button 
              onClick={closeSidebar}
              className="md:hidden text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="bg-primary-light rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-primary font-bold">
                {initials}
              </div>
              <div>
                <div className="font-medium">{user?.username || 'User'}</div>
                <div className="text-xs text-gray-300">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mb-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg",
                      location === item.href ? "bg-primary-light" : "hover:bg-primary-light"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <Button 
            variant="ghost" 
            className="flex items-center w-full justify-start space-x-3 p-3 rounded-lg hover:bg-primary-light mt-4"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
            <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
          </Button>

          {/* App Version */}
          <div className="text-xs text-gray-400 mt-4">
            Inkless News v1.0.0
          </div>
        </div>
      </div>
    </>
  );
}
