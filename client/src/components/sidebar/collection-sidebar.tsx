import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Plus,
  MoreHorizontal,
  FileText,
  Globe,
  Database,
  Settings,
  Clock,
  Trash2,
  Edit3,
  Copy,
  Move,
  X,
  GripVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { cn } from '../../lib/utils';

// Types
export interface CollectionItem {
  id: string;
  name: string;
  type: 'collection' | 'folder' | 'request';
  method?: string;
  url?: string;
  children?: CollectionItem[];
  isExpanded?: boolean;
  color?: string;
  emoji?: string;
}

interface CollectionSidebarProps {
  collections: CollectionItem[];
  onCollectionSelect: (collection: CollectionItem) => void;
  onRequestSelect: (request: CollectionItem) => void;
  onAddCollection: () => void;
  onAddFolder: (collectionId: string) => void;
  onAddRequest: (collectionId: string, folderId?: string) => void;
  onDeleteItem: (itemId: string, type: string) => void;
  onRenameItem: (itemId: string, newName: string) => void;
  onDuplicateItem: (itemId: string, type: string) => void;
  onMoveItem: (itemId: string, targetId: string, targetType: string) => void;
  selectedItemId?: string;
}

// HTTP Method Colors
const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
};

// Icons for different types
const getItemIcon = (item: CollectionItem) => {
  if (item.type === 'collection') return <Database className="h-4 w-4" />;
  if (item.type === 'folder') return item.isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
  if (item.type === 'request') return <FileText className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

export function CollectionSidebar({
  collections,
  onCollectionSelect,
  onRequestSelect,
  onAddCollection,
  onAddFolder,
  onAddRequest,
  onDeleteItem,
  onRenameItem,
  onDuplicateItem,
  onMoveItem,
  selectedItemId,
}: CollectionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(collections.map(c => c.id)));
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    itemId: string;
    itemName: string;
    itemType: string;
  }>({ isOpen: false, x: 0, y: 0, itemId: '', itemName: '', itemType: '' });


  // Ref for the context menu container
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: string } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // Helper function to find an item by ID
  const findItemById = (itemId: string): CollectionItem | null => {
    for (const collection of collections) {
      if (collection.id === itemId) return collection;
      if (collection.children) {
        for (const child of collection.children) {
          if (child.id === itemId) return child;
          if (child.children) {
            for (const grandchild of child.children) {
              if (grandchild.id === itemId) return grandchild;
            }
          }
        }
      }
    }
    return null;
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Filter collections and their children based on search
  function filterChildren(children: CollectionItem[], query: string): CollectionItem[] {
    return (children || [])
      .map(child => {
        if (child.type === 'folder' && child.children) {
          const filteredGrandchildren = filterChildren(child.children, query);
          if (
            child.name.toLowerCase().includes(query) ||
            filteredGrandchildren.length > 0
          ) {
            return { ...child, children: filteredGrandchildren };
          }
          return null;
        }
        if (
          child.name.toLowerCase().includes(query) ||
          (child.method && child.method.toLowerCase().includes(query)) ||
          (child.url && child.url.toLowerCase().includes(query))
        ) {
          return child;
        }
        return null;
      })
      .filter((c): c is CollectionItem => Boolean(c));
  }

  const filteredCollections = collections.map(collection => {
    if (!searchQuery) return collection;
    const query = searchQuery.toLowerCase();
    const collectionMatches = collection.name.toLowerCase().includes(query);
    const filteredChildren = filterChildren(collection.children || [], query);
    if (collectionMatches || filteredChildren.length > 0) {
      return {
        ...collection,
        children: filteredChildren
      };
    }
    return null;
  }).filter(Boolean) as CollectionItem[];

  // Auto-expand collections that have matching children when searching
  React.useEffect(() => {
    if (searchQuery) {
      const newExpanded = new Set(expandedItems);
      collections.forEach(collection => {
        const hasMatchingChild = collection.children?.some(child => {
          const query = searchQuery.toLowerCase();
          return child.name.toLowerCase().includes(query) ||
                 child.method?.toLowerCase().includes(query) ||
                 child.url?.toLowerCase().includes(query);
        });
        if (hasMatchingChild) {
          newExpanded.add(collection.id);
        }
      });
      setExpandedItems(newExpanded);
    }
  }, [searchQuery, collections]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.isOpen && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ isOpen: false, x: 0, y: 0, itemId: '', itemName: '', itemType: '' });
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu.isOpen]);

  // Persist search query in localStorage
  React.useEffect(() => {
    const savedQuery = localStorage.getItem('reqnest-search-query');
    if (savedQuery) {
      setSearchQuery(savedQuery);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('reqnest-search-query', searchQuery);
  }, [searchQuery]);

  const handleDelete = (itemId: string, itemName: string, itemType: string) => {
    // Directly call the parent's delete function - let the parent handle confirmation
    onDeleteItem(itemId, itemType);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string, itemType: string) => {
    
    // Only allow dragging requests
    if (itemType !== 'request') {
      e.preventDefault();
      return;
    }
    
    // Additional check: make sure this isn't a folder (folders have method: 'FOLDER')
    const item = findItemById(itemId);
    if (item && item.method === 'FOLDER') {
      e.preventDefault();
      return;
    }
    
    // Stop event propagation to prevent parent elements from also triggering drag
    e.stopPropagation();
    
    setDraggedItem({ id: itemId, type: itemType });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: itemId, type: itemType }));
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent elements
    setDragOverItem(itemId);
    
    // Find the item being dragged over
    const targetItem = findItemById(itemId);
    
    // Only allow dropping on collections and folders
    if (targetItem && (targetItem.type === 'collection' || targetItem.type === 'folder')) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent elements
    setDragOverItem(null);
    
    
    if (draggedItem && draggedItem.id !== targetId) {
      // Only allow dropping requests, and only onto collections or folders
      if (draggedItem.type === 'request' && (targetType === 'collection' || targetType === 'folder')) {
        onMoveItem(draggedItem.id, targetId, targetType);
      }
    } else if (draggedItem && draggedItem.id === targetId) {
      // Cannot drop item onto itself
    } else {
      // No dragged item or invalid drop target
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const renderItem = (item: CollectionItem, level: number = 0) => {
    const isSelected = selectedItemId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const paddingLeft = level * 16 + 8;
    const isDragging = draggedItem?.id === item.id;
    const isDragOver = dragOverItem === item.id;
    const canDrop = draggedItem && draggedItem.type === 'request' && (item.type === 'collection' || item.type === 'folder');

    return (
      <div 
        key={item.id} 
        className={cn(
          "group",
          isDragging && "opacity-50",
          isDragOver && canDrop && "bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600",
          isDragOver && !canDrop && "bg-gray-100 dark:bg-gray-900/20"
        )}
        draggable={item.type === 'request'}
        onDragStart={item.type === 'request' ? (e) => handleDragStart(e, item.id, item.type) : undefined}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          handleDrop(e, item.id, item.type);
        }}
        onDragEnd={handleDragEnd}
      >
        <div
          className={cn(
            "flex items-center justify-between p-2 rounded-md transition-colors",
            item.type === 'request' ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
            "hover:bg-accent/50",
            isSelected && "bg-accent text-accent-foreground",
            level > 0 && "ml-4",
            isDragOver && canDrop && "bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600"
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (item.type === 'collection') {
              onCollectionSelect(item);
            } else if (item.type === 'request') {
              onRequestSelect(item);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(item.id);
                }}
                className="p-1 hover:bg-accent/50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.type === 'request' && (
                <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {getItemIcon(item)}
              <span className="text-sm truncate">{item.name}</span>
              {item.type === 'request' && item.method && (
                <Badge variant="outline" className={cn("text-xs", methodColors[item.method] || "bg-gray-100 text-gray-800")}>
                  {item.method}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu({
                  isOpen: true,
                  x: e.clientX,
                  y: e.clientY,
                  itemId: item.id,
                  itemName: item.name,
                  itemType: item.type,
                });
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Context menu action handlers
  const handleContextMenuAction = (action: string, itemId: string, itemType: string) => {
    
    switch (action) {
      case 'add-folder':
        onAddFolder(itemId);
        break;
      case 'add-request':
        if (itemType === 'folder') {
          // For folders, we need to find the parent collection
          // Since folders are stored as requests with method: 'FOLDER', 
          // we need to find which collection contains this folder
          const parentCollection = collections.find(collection => 
            collection.children?.some(child => child.id === itemId)
          );
          if (parentCollection) {
            onAddRequest(parentCollection.id, itemId);
          }
        } else {
          // For collections, just pass the collection ID
          onAddRequest(itemId);
        }
        break;
      case 'duplicate':
        onDuplicateItem(itemId, itemType);
        break;
      case 'move':
        onMoveItem(itemId, '', 'move');
        break;
      case 'rename':
        onRenameItem(itemId, contextMenu.itemName);
        break;
      case 'delete':
        handleDelete(itemId, contextMenu.itemName, itemType);
        break;
      default:
        console.warn('Unknown context menu action:', action);
    }
    
    // Close context menu
    setContextMenu({ isOpen: false, x: 0, y: 0, itemId: '', itemName: '', itemType: '' });
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* Debug: Show search query */}
      {searchQuery && (
        <div className="p-2 bg-blue-100 text-xs text-blue-800 border border-blue-300">
          🔍 Searching for: "{searchQuery}" - Found {filteredCollections.length} collections
        </div>
      )}
      
      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            onFocus={(e) => e.target.select()}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredCollections.map(collection => renderItem(collection))}
        </div>
      </div>

      {/* Add Collection Button */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCollection}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {/* Context Menu Portal */}
      {contextMenu.isOpen && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px]"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 200),
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {contextMenu.itemType === 'collection' && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('add-folder', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <Folder className="mr-2 h-4 w-4" />
                Add Folder
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('add-request', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Add Request
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('duplicate', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Collection
              </button>
            </>
          )}
          {contextMenu.itemType === 'folder' && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('add-request', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Add Request
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('duplicate', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Folder
              </button>
            </>
          )}
          {contextMenu.itemType === 'request' && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('duplicate', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Request
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('move', contextMenu.itemId, contextMenu.itemType);
                }}
              >
                <Move className="mr-2 h-4 w-4" />
                Move Request
              </button>
            </>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenuAction('rename', contextMenu.itemId, contextMenu.itemType);
            }}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Rename
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 dark:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenuAction('delete', contextMenu.itemId, contextMenu.itemType);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>,
        document.body
      )}


    </div>
  );
} 