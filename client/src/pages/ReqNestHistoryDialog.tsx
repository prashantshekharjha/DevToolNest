import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play, CheckSquare, Square } from "lucide-react";

export function ReqNestHistoryDialog({
  open,
  onOpenChange,
  requestHistory,
  onUse,
  onDelete,
  onDeleteSelected,
  onDeleteAll,
  selectedIds,
  setSelectedIds
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestHistory: any[];
  onUse: (item: any) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}) {
  const toggleSelect = (id: string) => {
    setSelectedIds(selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]);
  };
  const allSelected = requestHistory.length > 0 && selectedIds.length === requestHistory.length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Request History</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={onDeleteSelected} disabled={selectedIds.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={onDeleteAll} disabled={requestHistory.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(allSelected ? [] : requestHistory.map(i => i.id))}>
            {allSelected ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />} Select All
          </Button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {requestHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No requests in history yet</p>
            </div>
          ) : (
            requestHistory.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4"
                  />
                  <Badge variant="outline">{item.request.method}</Badge>
                  <span className="text-sm truncate max-w-[200px]">{item.request.url}</span>
                  <Badge variant={item.response.status === 0 ? "secondary" : item.response.status < 400 ? "default" : "destructive"}>
                    {item.response.status === 0 ? "FAILED" : item.response.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.response.time}ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onUse(item)}>
                    <Play className="w-4 h-4 mr-2" /> Use
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 