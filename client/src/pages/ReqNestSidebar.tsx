import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, History, Trash2, Menu, Settings, CheckSquare, Square, Globe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Collection {
  id: string;
  name: string;
  requests: any[];
}

interface RequestHistory {
  id: string;
  request: any;
  response: any;
  timestamp: Date;
}

interface ReqNestSidebarProps {
  collections: Collection[];
  selectedCollection: string | null;
  setSelectedCollection: (id: string | null) => void;
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  loadFromCollection: (collectionId: string, requestId: string) => void;
  requestHistory: RequestHistory[];
  setRequest: (req: any) => void;
  setResponse: (res: any) => void;
  selectedHistory: string[];
  setSelectedHistory: React.Dispatch<React.SetStateAction<string[]>>;
  deleteSelectedHistory: () => void;
  deleteAllHistory: () => void;
  setRequestHistory: (history: RequestHistory[]) => void;
}

export function ReqNestSidebar({
  collections,
  selectedCollection,
  setSelectedCollection,
  createCollection,
  deleteCollection,
  loadFromCollection,
  requestHistory,
  setRequest,
  setResponse,
  selectedHistory,
  setSelectedHistory,
  deleteSelectedHistory,
  deleteAllHistory,
  setRequestHistory
}: ReqNestSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'collections' | 'history'>('collections');
  const [newCollectionName, setNewCollectionName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newCollectionDialogOpen, setNewCollectionDialogOpen] = useState(false);

  const isCollapsed = !isHovered;

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('newCollectionDialogOpen changed to:', newCollectionDialogOpen);
  }, [newCollectionDialogOpen]);

  return (
    <div
      className={`border-r border-border flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        {/* In the sidebar header, remove the Menu and Globe icon buttons: */}
      </div>
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proxy Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proxy-url">Proxy URL</Label>
              <Input id="proxy-url" placeholder="http://localhost:8080" />
            </div>
            <Button onClick={() => setSettingsOpen(false)} className="w-full mt-2">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Sidebar Tabs and Content */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 p-0 flex items-center justify-center border-2 border-transparent"
            aria-label="Proxy Setting"
          >
            <Globe className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button
            variant={activeSidebarTab === 'collections' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActiveSidebarTab('collections')}
            className={`w-8 h-8 p-0 flex items-center justify-center border-2 ${activeSidebarTab === 'collections' ? 'border-primary bg-primary/10' : 'border-transparent'}`}
            aria-label="Collections"
          >
            <Folder className={`w-5 h-5 ${activeSidebarTab === 'collections' ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
          <Button
            variant={activeSidebarTab === 'history' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActiveSidebarTab('history')}
            className={`w-8 h-8 p-0 flex items-center justify-center border-2 ${activeSidebarTab === 'history' ? 'border-primary bg-primary/10' : 'border-transparent'}`}
            aria-label="History"
          >
            <History className={`w-5 h-5 ${activeSidebarTab === 'history' ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      ) : (
        <>
          {/* Sidebar Tabs */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="justify-start"
                aria-label="Proxy Setting"
              >
                <Globe className="w-4 h-4 mr-2" />
                Proxy Setting
              </Button>
              <Button
                variant={activeSidebarTab === 'collections' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSidebarTab('collections')}
                className="justify-start"
              >
                <Folder className="w-4 h-4 mr-2" />
                Collections
              </Button>
              <Button
                variant={activeSidebarTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSidebarTab('history')}
                className="justify-start"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </div>
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSidebarTab === 'collections' ? (
              <div className="space-y-4">
                {/* Add New Collection Button */}
                <button 
                  type="button"
                  className="w-full px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('New Collection button clicked - event:', e);
                    console.log('Current newCollectionDialogOpen state:', newCollectionDialogOpen);
                    setNewCollectionDialogOpen(true);
                    console.log('Set newCollectionDialogOpen to true');
                  }}
                  onMouseDown={(e) => {
                    console.log('New Collection button mousedown');
                  }}
                  onMouseUp={(e) => {
                    console.log('New Collection button mouseup');
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                  New Collection
                </button>
                
                <Dialog 
                  open={newCollectionDialogOpen} 
                  onOpenChange={(open) => {
                    console.log('Dialog onOpenChange called with:', open);
                    setNewCollectionDialogOpen(open);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Collection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="collection-name">Collection Name</Label>
                        <Input
                          id="collection-name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="Enter collection name"
                          autoFocus
                        />
                      </div>
                      <Button
                        onClick={() => {
                          console.log('Creating collection:', newCollectionName);
                          if (newCollectionName.trim()) {
                            createCollection(newCollectionName);
                            setNewCollectionName("");
                            setNewCollectionDialogOpen(false);
                          }
                        }}
                      >
                        Create Collection
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {/* Collections List */}
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{collection.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCollection(collection.id)}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-1 ml-4">
                        {collection.requests.map((req) => (
                          <div
                            key={req.id}
                            className="p-2 text-sm bg-muted rounded cursor-pointer hover:bg-muted/80"
                            onClick={() => loadFromCollection(collection.id, req.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{req.method}</Badge>
                              <span className="truncate">{req.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {requestHistory.length > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedHistory.length === 0}
                      onClick={deleteSelectedHistory}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteAllHistory}
                    >
                      Delete All
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  {requestHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 text-sm rounded cursor-pointer hover:bg-muted/80 flex items-start gap-2 min-w-0 group"
                      onClick={() => {
                        setRequest(item.request);
                        setResponse(item.response);
                      }}
                    >
                      <button
                        className="mr-2 mt-1"
                        onClick={e => {
                          e.stopPropagation();
                          setRequestHistory(requestHistory.filter(h => h.id !== item.id));
                          localStorage.setItem('reqnest-history', JSON.stringify(requestHistory.filter(h => h.id !== item.id)));
                        }}
                        aria-label="Delete history item"
                      >
                        <Trash2 className="w-4 h-4 text-destructive opacity-0 group-hover:opacity-100 transition" />
                      </button>
                      <button
                        className="mr-2 mt-1"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedHistory((sel: string[]) => sel.includes(item.id) ? sel.filter((id: string) => id !== item.id) : [...sel, item.id]);
                        }}
                        aria-label="Select history item"
                      >
                        {selectedHistory.includes(item.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <Badge 
                        variant={item.response.status === 0 ? "secondary" : item.response.status < 400 ? "default" : "destructive"}
                        className="text-xs flex-shrink-0"
                      >
                        {item.response.status === 0 ? "FAILED" : item.response.status}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate text-xs cursor-pointer">
                                {item.request.method} {item.request.url}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-mono text-xs">{item.request.url}</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 