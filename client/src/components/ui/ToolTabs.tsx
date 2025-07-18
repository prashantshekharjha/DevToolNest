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
  onTabCloseToLeft?: (id: string) => void;
  onTabCloseToRight?: (id: string) => void;
  onTabCloseOthers?: (id: string) => void;
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
  onTabCloseToLeft,
  onTabCloseToRight,
  onTabCloseOthers,
  renderTabContent,
  className,
}: ToolTabsProps<T>) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <Tabs value={activeTabId} onValueChange={onTabChange} className={className}>
      <div className="flex items-center border-b bg-transparent">
        <TabsList>
          {tabs.map((tab, idx) => (
            <TabsTrigger key={tab.id} value={tab.id} asChild>
              <div
                className="flex items-center group relative"
                onContextMenu={e => handleContextMenu(e, tab.id)}
              >
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
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-white border border-gray-200 rounded shadow-lg text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={closeContextMenu}
        >
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { onTabClose && onTabClose(contextMenu.tabId); closeContextMenu(); }}>Close</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { onTabCloseToLeft && onTabCloseToLeft(contextMenu.tabId); closeContextMenu(); }}>Close Tabs to Left</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { onTabCloseToRight && onTabCloseToRight(contextMenu.tabId); closeContextMenu(); }}>Close Tabs to Right</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { onTabCloseOthers && onTabCloseOthers(contextMenu.tabId); closeContextMenu(); }}>Close Others</button>
        </div>
      )}
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="h-full min-h-0 flex-1">
          {renderTabContent(tab)}
        </TabsContent>
      ))}
    </Tabs>
  );
} 