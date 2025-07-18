import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { tools } from "@/lib/tools";
import { Settings, Home, Wrench, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) {
  const [location] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Global font size state
  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem('appFontSize');
    return stored ? parseInt(stored) : 16;
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');
    localStorage.setItem('appFontSize', String(fontSize));
  }, [fontSize]);
  const handleFontSizeChange = (delta: number) => {
    setFontSize(f => Math.max(12, Math.min(32, f + delta)));
  };

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
              "rounded-lg p-2 transition-all duration-200 flex items-center justify-center bg-primary/10 dark:bg-primary/20 group-hover:scale-105 group-hover:shadow-md",
              isActive("/") ? "ring-2 ring-primary bg-primary text-white" : ""
            )}>
              <Home className={isActive("/") ? "w-7 h-7 text-white" : "w-7 h-7 text-primary"} />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-base truncate">Home</span>
            )}
          </a>
        </Link>
        {tools.map((tool, index) => {
          return (
            <Link key={tool.id} href={tool.route}>
              <a className={cn(
                "nav-item group",
                isActive(tool.route) && "active",
                isCollapsed ? "justify-center" : "flex flex-row items-center gap-x-2"
              )}
                style={{ minHeight: isCollapsed ? '2.5rem' : '2.5rem', transition: 'min-height 0.2s' }}
              >
                <div className={cn(
                  "rounded-lg p-2 transition-all duration-200 flex items-center justify-center bg-primary/10 dark:bg-primary/20 group-hover:scale-105 group-hover:shadow-md",
                  isActive(tool.route) ? "ring-2 ring-primary bg-primary text-white" : ""
                )}>
                  <tool.icon className={isActive(tool.route) ? "w-7 h-7 text-white" : "w-7 h-7 text-primary"} />
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
      {/* Global Font Size Controls */}
      <div className="p-4 border-t border-border flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground mb-1">Font Size</span>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-lg font-bold"
            onClick={() => handleFontSizeChange(-2)}
            title="Decrease font size"
          >A-</button>
          <span className="text-base font-medium w-8 text-center" style={{ minWidth: 24 }}>{fontSize}</span>
          <button
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-lg font-bold"
            onClick={() => handleFontSizeChange(2)}
            title="Increase font size"
          >A+</button>
        </div>
      </div>
    </div>
  );
}
