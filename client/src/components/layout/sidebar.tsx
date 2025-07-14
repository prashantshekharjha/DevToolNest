import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { tools } from "@/lib/tools";
import { Settings, Home, Wrench, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) {
  const [location] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (route: string) => {
    return location === route || (route === "/" && location === "/");
  };

  // Collapse on mouse leave, expand on mouse enter
  const handleMouseEnter = () => setIsCollapsed(false);
  const handleMouseLeave = () => setIsCollapsed(true);

  return (
    <div 
      className={`sidebar-gradient border-r border-border flex flex-col transition-all duration-300 fixed md:left-0 md:top-0 md:h-screen md:z-40 z-40 bg-sidebar \
        ${isCollapsed ? 'w-16' : 'w-64'} \
        sm:w-20 \
        w-full md:w-auto \
        md:relative md:fixed \
        h-full md:h-screen \
        overflow-y-auto`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-square">
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
          <a className={cn(
            "nav-item group",
            isActive("/") && "active",
            isCollapsed ? "justify-center" : "flex flex-row items-center gap-x-2"
          )}
            style={{ minHeight: isCollapsed ? '2.5rem' : '2.5rem', transition: 'min-height 0.2s' }}
          >
            <div className={cn(
              isActive("/")
                ? "w-10 h-10 rounded-xl shadow-md -translate-y-0.5 z-10 bg-gradient-blue ring-2 ring-primary border border-border transition-all duration-200"
                : "w-10 h-10 rounded-xl bg-gradient-emerald flex items-center justify-center transition-all duration-200"
            )}>
              <Home className={isActive("/") ? "w-8 h-8 text-white" : "w-8 h-8 text-white"} />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-base truncate">Home</span>
            )}
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
              <a className={cn(
                "nav-item group",
                isToolActive && "active",
                isCollapsed ? "justify-center" : "flex flex-row items-center gap-x-2"
              )}
                style={{ minHeight: isCollapsed ? '2.5rem' : '2.5rem', transition: 'min-height 0.2s' }}
              >
                <div className={cn(
                  isToolActive
                    ? `w-10 h-10 rounded-xl shadow-md -translate-y-0.5 z-10 ${gradientClasses[index % gradientClasses.length]} ring-2 ring-primary border border-border transition-all duration-200`
                    : `w-10 h-10 rounded-xl ${gradientClasses[index % gradientClasses.length]} flex items-center justify-center transition-all duration-200`
                )}>
                  <tool.icon className={"w-8 h-8 text-white"} />
                </div>
                {!isCollapsed && (
                  <span className="font-medium text-base truncate">{tool.name}</span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      {/* Removed theme toggle button */}
    </div>
  );
}
