import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Button } from "./button";
import { X, Plus } from "lucide-react";

export interface ToolTab<T = any> {
  id: string;
  title: string;
  state: T;
}

interface ToolTabsProps<T = any> {
  tabs: ToolTab<T>[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabAdd: () => void;
  onTabClose: (id: string) => void;
  onTabRename?: (id: string, title: string) => void;
  renderTabContent: (tab: ToolTab<T>) => React.ReactNode;
  className?: string;
}

export function ToolTabs<T = any>({
  tabs,
  activeTabId,
  onTabChange,
  onTabAdd,
  onTabClose,
  onTabRename,
  renderTabContent,
  className,
}: ToolTabsProps<T>) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <Tabs value={activeTabId} onValueChange={onTabChange} className={className}>
      <div className="flex items-center border-b bg-transparent">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} asChild>
              <div className="flex items-center group relative">
                {editingTabId === tab.id ? (
                  <input
                    className="w-24 px-2 py-1 rounded border focus:outline-none text-sm"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      setEditingTabId(null);
                      if (onTabRename && editValue.trim()) onTabRename(tab.id, editValue.trim());
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEditingTabId(null);
                        if (onTabRename && editValue.trim()) onTabRename(tab.id, editValue.trim());
                      }
                    }}
                  />
                ) : (
                  <span
                    className="px-2 py-1 cursor-pointer select-none"
                    onDoubleClick={() => {
                      setEditingTabId(tab.id);
                      setEditValue(tab.title);
                    }}
                  >
                    {tab.title}
                  </span>
                )}
                {tabs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 p-1 opacity-60 group-hover:opacity-100"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={onTabAdd}
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="h-full min-h-0 flex-1">
          {renderTabContent(tab)}
        </TabsContent>
      ))}
    </Tabs>
  );
} 