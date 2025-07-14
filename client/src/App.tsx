import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Pages
import Home from "@/pages/home";
import ReqNest from "@/pages/reqnest";

import SpecCraft from "@/pages/spec-craft";
import TokenPeek from "@/pages/token-peek";

import CodeBeautifier from "@/pages/code-beautifier";
import DataMorph from "@/pages/data-morph";
import TimeFlip from "@/pages/time-flip";
import MockWizard from "@/pages/mock-wizard";
import ThrottleViz from "@/pages/throttle-viz";
import FlowTrace from "@/pages/flow-trace";
import ImageSqueeze from "@/pages/image-squeeze";
import CVForge from "@/pages/cv-forge";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/reqnest" component={ReqNest} />

          <Route path="/spec-craft" component={SpecCraft} />
          <Route path="/token-peek" component={TokenPeek} />

          <Route path="/code-beautifier" component={CodeBeautifier} />
          <Route path="/data-morph" component={DataMorph} />
          <Route path="/time-flip" component={TimeFlip} />
          <Route path="/mock-wizard" component={MockWizard} />
          <Route path="/throttle-viz" component={ThrottleViz} />
          <Route path="/flow-trace" component={FlowTrace} />
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
        defaultTheme="dark"
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
