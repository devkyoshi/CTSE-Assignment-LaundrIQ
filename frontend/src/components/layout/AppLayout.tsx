import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu, X, LayoutDashboard, ShoppingBag,
  MapPin, User, LogOut, Settings, ChevronUp,
  CreditCard,
  ChevronRight, MessageSquare, Gift
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Addresses", href: "/addresses", icon: MapPin },
    { name: "loyalty", href: "/loyalty", icon: Gift  },
    { name: "Feedback", href: "/feedback", icon: MessageSquare  },
    { name: "Preferences", href: "/preferences", icon: Settings },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-50 flex items-center justify-between px-4">
        <span className="text-xl font-bold text-primary">LaundrIQ</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-foreground"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-[#1E3A8A] text-white transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:flex lg:flex-col h-full
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 flex items-center px-6 mb-4 hidden lg:flex shrink-0">
          <span className="text-2xl font-bold text-white">LaundrIQ</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-20 lg:mt-0 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-white/20 text-white" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
          
          {user?.roles?.includes("ROLE_ADMIN") && (
            <Link
              to="/admin/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mt-4 border-t border-white/10 pt-4
                ${location.pathname === "/admin/settings" 
                  ? "bg-white/20 text-white" 
                  : "text-yellow-400 hover:bg-white/10 hover:text-yellow-300"
                }
              `}
            >
              <Settings size={18} />
              Admin Pricing
            </Link>
          )}
        </nav>

        <div className="p-4 shrink-0 border-t border-white/10 mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors outline-none">
                <div className="flex items-center gap-3 truncate">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col items-start truncate text-left">
                    <span className="truncate w-full">{user?.username || "Account"}</span>
                    <span className="text-xs text-blue-200 truncate w-full">{user?.email || "User"}</span>
                  </div>
                </div>
                <ChevronUp size={16} className="text-gray-300 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="right">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/orders" className="cursor-pointer">My Orders</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:pt-0 pt-16">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}
