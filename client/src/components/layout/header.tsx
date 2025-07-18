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
      <div className="block w-full">
        <div className="text-left pl-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-left">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex items-center gap-4">{right}</div>}
      </div>
    </header>
  );
}
