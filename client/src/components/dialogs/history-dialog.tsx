import React, { useState } from 'react';
import { Clock, Trash2, RotateCcw, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ConfirmDeleteDialog } from '../ui/confirm-delete-dialog';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface HistoryItem {
  id: string;
  method: string;
  url: string;
  timestamp: string;
  status?: number;
  duration?: number;
}

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onReRunRequest: (item: HistoryItem) => void;
  onDeleteHistoryItem: (itemId: string) => void;
  onDeleteMultipleHistoryItems: (itemIds: string[]) => void;
  onClearAllHistory: () => void;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
};

export function HistoryDialog({
  isOpen,
  onClose,
  history,
  onReRunRequest,
  onDeleteHistoryItem,
  onDeleteMultipleHistoryItems,
  onClearAllHistory,
}: HistoryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple' | 'all';
    itemId?: string;
    itemName?: string;
  }>({ isOpen: false, type: 'single' });

  // Filter history based on search
  const filteredHistory = history.filter(item =>
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(item => item.id)));
    }
  };

  const handleDeleteSingle = (item: HistoryItem) => {
    setDeleteDialog({
      isOpen: true,
      type: 'single',
      itemId: item.id,
      itemName: `${item.method} ${item.url}`,
    });
  };

  const handleDeleteMultiple = () => {
    if (selectedItems.size === 0) return;
    setDeleteDialog({
      isOpen: true,
      type: 'multiple',
    });
  };

  const handleDeleteAll = () => {
    setDeleteDialog({
      isOpen: true,
      type: 'all',
    });
  };

  const confirmDelete = () => {
    switch (deleteDialog.type) {
      case 'single':
        if (deleteDialog.itemId) {
          onDeleteHistoryItem(deleteDialog.itemId);
        }
        break;
      case 'multiple':
        onDeleteMultipleHistoryItems(Array.from(selectedItems));
        setSelectedItems(new Set());
        break;
      case 'all':
        onClearAllHistory();
        setSelectedItems(new Set());
        break;
    }
    setDeleteDialog({ isOpen: false, type: 'single' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (status >= 500) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Request History
            </DialogTitle>
            <DialogDescription>
              View and manage your request history
            </DialogDescription>
          </DialogHeader>

          {/* Search and Actions */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedItems.size === filteredHistory.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select All
            </Button>
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMultiple}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedItems.size})
              </Button>
            )}
            {history.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No history items match your search.' : 'No request history yet.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedItems.has(item.id) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded"
                    />
                    
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", methodColors[item.method] || methodColors.GET)}
                    >
                      {item.method}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{item.url}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(item.timestamp)}
                        {item.duration && ` • ${item.duration}ms`}
                      </div>
                    </div>

                    {item.status && (
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getStatusColor(item.status))}
                      >
                        {item.status}
                      </Badge>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReRunRequest(item)}
                        className="h-8 w-8 p-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSingle(item)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: 'single' })}
        onConfirm={confirmDelete}
        title={
          deleteDialog.type === 'single' ? 'Delete History Item' :
          deleteDialog.type === 'multiple' ? 'Delete Selected Items' :
          'Clear All History'
        }
        description={
          deleteDialog.type === 'single' ? 'This action cannot be undone.' :
          deleteDialog.type === 'multiple' ? 'This action cannot be undone.' :
          'This will permanently delete all history items. This action cannot be undone.'
        }
        itemName={deleteDialog.itemName}
        isBulk={deleteDialog.type === 'multiple'}
        itemCount={deleteDialog.type === 'multiple' ? selectedItems.size : undefined}
      />
    </>
  );
} 