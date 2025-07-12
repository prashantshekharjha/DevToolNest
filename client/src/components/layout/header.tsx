import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <header className="glass-effect border-b border-border p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {right}
          <Button variant="ghost" size="sm" className="hover:bg-primary/10">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-primary/10">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
