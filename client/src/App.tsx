import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useState, useEffect } from "react";

// Pages
import Home from "@/pages/home";
import ReqNest from "@/pages/reqnest";

import SpecCraft from "@/pages/spec-craft";
import TokenPeek from "@/pages/token-peek";

import CodeBeautifier from "@/pages/code-beautifier";
import EncoderDecoder from "@/pages/encoder-decoder";
import ImageSqueeze from "@/pages/image-squeeze";
import CVForge from "@/pages/cv-forge";
import NotFound from "@/pages/not-found";

function Router() {
  // Track sidebar collapsed/expanded state globally
  const [isCollapsed, setIsCollapsed] = useState(false);
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
  return (
    <div className="flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col overflow-auto transition-all duration-300 ${
          isCollapsed ? 'ml-16' : ''
        }`}
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/reqnest" component={ReqNest} />

          <Route path="/spec-craft" component={SpecCraft} />
          <Route path="/token-peek" component={TokenPeek} />

          <Route path="/code-beautifier" component={CodeBeautifier} />
          <Route path="/encoder-decoder" component={EncoderDecoder} />
          <Route path="/image-squeeze" component={ImageSqueeze} />
          <Route path="/cv-forge" component={CVForge} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <WouterRouter base="/DevToolNest">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
