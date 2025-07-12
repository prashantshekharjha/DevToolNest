import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { tools } from "@/lib/tools";
import { Settings, Home, Wrench, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (route: string) => {
    return location === route || (route === "/" && location === "/");
  };

  const isHomePage = location === "/";
  const isCollapsed = !isHomePage && !isHovered;

  return (
    <div 
      className={`sidebar-gradient border-r border-border flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-purple rounded-lg flex items-center justify-center shadow-lg animate-pulse-glow">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              DevToolNest
            </h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <Link href="/">
          <a className={cn("nav-item", isActive("/") && "active", isCollapsed && "justify-center")}> 
            <div className={cn(
              isActive("/") ? "w-14 h-14 rounded-full ring-2 ring-primary shadow-lg -translate-y-1 z-10 bg-yellow-400 flex items-center justify-center transition-all duration-200" : "w-10 h-10 rounded bg-gradient-emerald flex items-center justify-center transition-all duration-200"
            )}>
              <Home className={isActive("/") ? "w-10 h-10 text-white" : "w-7 h-7 text-white"} />
            </div>
            {!isCollapsed && <span>Home</span>}
          </a>
        </Link>
        
        {tools.map((tool, index) => {
          const gradientClasses = [
            'bg-gradient-blue',
            'bg-gradient-purple', 
            'bg-gradient-emerald',
            'bg-gradient-amber',
            'bg-gradient-rose',
            'bg-gradient-indigo',
            'bg-gradient-cyan',
            'bg-gradient-orange',
            'bg-gradient-teal',
            'bg-gradient-purple',
            'bg-gradient-emerald',
            'bg-gradient-amber'
          ];
          const isToolActive = isActive(tool.route);
          return (
            <Link key={tool.id} href={tool.route}>
              <a className={cn("nav-item", isToolActive && "active", isCollapsed && "justify-center")}> 
                <div className={cn(
                  isToolActive ? `w-14 h-14 rounded-full ring-2 ring-primary shadow-lg -translate-y-1 z-10 bg-yellow-400 flex items-center justify-center transition-all duration-200` : `w-10 h-10 rounded ${gradientClasses[index % gradientClasses.length]} flex items-center justify-center transition-all duration-200`
                )}>
                  <tool.icon className={isToolActive ? "w-10 h-10 text-white" : "w-7 h-7 text-white"} />
                </div>
                {!isCollapsed && <span>{tool.name}</span>}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className={cn("w-full", isCollapsed ? "justify-center" : "justify-start")}
        >
          {mounted && theme === "light" ? (
            <>
              <Moon className={cn("w-5 h-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Dark Mode"}
            </>
          ) : (
            <>
              <Sun className={cn("w-5 h-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Light Mode"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
