import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Copy, Download, Save, Plus, Trash2, Play, Folder, FolderPlus, Maximize2, Minimize2, Upload, Code, Settings, Eye, EyeOff, Terminal, CheckCircle, XCircle, Clock, Database, Zap, FlaskConical, History, Globe, Wand2, X, Menu, Home, Archive, Users, FileText as FileTextIcon, BarChart3, Cog, Sparkles, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { CollectionSidebar, CollectionItem } from "../components/sidebar/collection-sidebar";
import { HistoryDialog } from "../components/dialogs/history-dialog";
import { BulkEditDialog } from "../components/dialogs/bulk-edit-dialog";
// Removed problematic imports - will implement these features differently

interface Header {
  key: string;
  value: string;
}

interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api-key';
  token?: string;
  username?: string;
  password?: string;
  keyName?: string;
  keyValue?: string;
  keyLocation?: 'header' | 'query';
}

interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
}

interface TestAssertion {
  id: string;
  type: 'status' | 'header' | 'body' | 'response-time';
  field?: string;
  operator: 'equals' | 'contains' | 'not-equals' | 'greater-than' | 'less-than' | 'exists';
  value: string;
  enabled: boolean;
}

interface Request {
  id?: string;
  name?: string;
  method: string;
  url: string;
  headers: Header[];
  body: string;
  auth: AuthConfig;
  params: Header[];
  preRequestScript?: string;
  postRequestScript?: string;
  tests: TestAssertion[];
  description?: string;
  parentId?: string; // For folder hierarchy
}

interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
  testResults?: { assertion: TestAssertion; passed: boolean; message: string }[];
}

interface Collection {
  id: string;
  name: string;
  requests: Request[];
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  environmentId?: string;
}



interface RequestHistory {
  id: string;
  request: Request;
  response: Response;
  timestamp: Date;
}

// At the top, add:
// let reqnestChannel: BroadcastChannel | null = null;
// if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
//   reqnestChannel = new BroadcastChannel('reqnest-import');
// }

export default function ReqNest() {
  const { toast } = useToast();
  const [request, setRequest] = useState<Request>({
    method: "GET",
    url: "",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: "",
    auth: { type: 'none' },
    params: [],
    tests: []
  });
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState<'request' | 'response' | 'both'>('both');
  const [showPassword, setShowPassword] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [curlCommand, setCurlCommand] = useState("");
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<string | null>(null);
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showEnvironments, setShowEnvironments] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState("");
  const [environmentVariables, setEnvironmentVariables] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("headers");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bodyType, setBodyType] = useState("json");
  
  // Bulk edit state
  const [bulkEditDialog, setBulkEditDialog] = useState<{
    isOpen: boolean;
    type: 'headers' | 'params' | 'tests';
    initialText: string;
  }>({ isOpen: false, type: 'headers', initialText: '' });
  
  // Import from SpecCraft states
  const [showImportFromSpecDialog, setShowImportFromSpecDialog] = useState(false);
  const [pendingImportRequest, setPendingImportRequest] = useState<Request | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  
  // Proxy settings
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyUrl, setProxyUrl] = useState("");
  
  // Mobile responsive states
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Maximize state
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Sidebar state for maximized mode
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Request/Response maximize states
  const [requestMaximized, setRequestMaximized] = useState(false);
  const [responseMaximized, setResponseMaximized] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  
  // New Collection Dialog state
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  
  // Save to Collection Dialog state
  const [showSaveToCollectionDialog, setShowSaveToCollectionDialog] = useState(false);
  
  // Edit Request Name Dialog state
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<{ collectionId: string; requestId: string; currentName: string } | null>(null);
  
  // Delete confirmation dialogs
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'collection' | 'request' | 'environment' | 'history';
    itemId: string;
    itemName: string;
    isBulk?: boolean;
    itemCount?: number;
  }>({ isOpen: false, type: 'collection', itemId: '', itemName: '' });

  // Add state for rename dialog
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    currentName: string;
    itemType: string;
  }>({ isOpen: false, itemId: '', currentName: '', itemType: '' });

  // Add state for move dialog
  const [moveDialog, setMoveDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    itemName: string;
    itemType: string;
  }>({ isOpen: false, itemId: '', itemName: '', itemType: '' });

  // Drag and drop functionality will be implemented later

  // 1. Add state for bulk import requests
  const [bulkImportRequests, setBulkImportRequests] = useState<Request[] | null>(null);
  const [pendingSaveCollectionId, setPendingSaveCollectionId] = useState<string | null>(null);
  const [pendingSaveFolderId, setPendingSaveFolderId] = useState<string | null>(null);

  useEffect(() => {
    const collections = storage.getCollections();
    
    // Migrate existing collections to include parentId field
    const migratedCollections = collections.map(collection => ({
      ...collection,
      requests: collection.requests.map(request => ({
        ...request,
        parentId: request.parentId || undefined
      }))
    }));
    
    setCollections(migratedCollections);
    loadEnvironments();
    loadRequestHistory();
    
    // Check for mobile screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check for URL parameters for import (always do this on load)
    const urlParams = new URLSearchParams(window.location.search);
    const importData = urlParams.get('import');
    const bulkImport = urlParams.get('bulk_import');
    
    if (importData) {
      try {
        const importedRequest = JSON.parse(decodeURIComponent(importData));
        const normalizedRequest = normalizeRequest(importedRequest);
        // Immediately populate the form with imported data
        setRequest(normalizedRequest);
        setPendingImportRequest(normalizedRequest);
        setShowImportFromSpecDialog(true);
        // Clean up the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        toast({
          title: "Request Imported",
          description: "Request data has been imported from SpecCraft",
        });
      } catch (error) {
        console.error('Error parsing imported request:', error);
        toast({
          title: "Import Error",
          description: "Failed to import request data",
          variant: "destructive"
        });
      }
    }
    
    // Check for bulk import data in localStorage (always check, not just with URL parameter)
    const bulkImportData = localStorage.getItem('reqnest_bulk_import_collection');
    if (bulkImportData) {
      try {
        const importedCollection = JSON.parse(bulkImportData);
        // Normalize all requests in the collection to ensure proper format
        const normalizedRequests = importedCollection.requests.map((req: any, idx: number) => {
          const norm = normalizeRequest(req);
          return norm;
        });
        // Set bulk import requests and show save dialog
        setBulkImportRequests(normalizedRequests);
        setShowSaveToCollectionDialog(true);
        // Clean up the localStorage item
        localStorage.removeItem('reqnest_bulk_import_collection');
        toast({
          title: "Bulk Import Ready",
          description: `Ready to save ${normalizedRequests.length} requests from "${importedCollection.name}"`,
        });
      } catch (error) {
        console.error('Error parsing bulk import collection:', error);
        toast({
          title: "Bulk Import Error",
          description: "Failed to parse bulk import data",
          variant: "destructive"
        });
      }
    }
    
    // Clean up URL parameter if it exists
    if (bulkImport) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Check for imported request from SpecCraft (legacy localStorage method)
    const importedRequestData = localStorage.getItem('reqnest_import_request');
    if (importedRequestData) {
      try {
        const importedRequest = JSON.parse(importedRequestData);
        const normalizedRequest = normalizeRequest(importedRequest);
        // Immediately populate the form with imported data
        setRequest(normalizedRequest);
        setPendingImportRequest(normalizedRequest);
        setShowImportFromSpecDialog(true);
        // Clean up the localStorage item
        localStorage.removeItem('reqnest_import_request');
        toast({
          title: "Request Imported",
          description: "Request data has been imported from SpecCraft",
        });
      } catch (error) {
        console.error('Error parsing imported request:', error);
        toast({
          title: "Import Error",
          description: "Failed to import request data",
          variant: "destructive"
        });
      }
    }
    
    // Setup BroadcastChannel for ReqNest import
    let reqnestChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      reqnestChannel = new BroadcastChannel('reqnest-import');
      reqnestChannel.onmessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'import-request') {
          const importedRequest = event.data.data;
          const normalizedRequest = normalizeRequest(importedRequest);
          setRequest(normalizedRequest);
          setPendingImportRequest(normalizedRequest);
          setShowImportFromSpecDialog(true);
          toast({
            title: 'Request Imported',
            description: 'Request data has been imported from SpecCraft',
          });
        }
      };
    }
    return () => {
      if (reqnestChannel) {
        reqnestChannel.close();
      }
    };
  }, []);

  const loadEnvironments = () => {
    const storedEnvs = storage.get<Environment[]>('reqnest-environments') || [];
    setEnvironments(storedEnvs);
    const activeEnv = storedEnvs.find(env => env.isActive);
    if (activeEnv) {
      setActiveEnvironment(activeEnv.id);
    }
  };

  const loadRequestHistory = () => {
    const history = storage.get<RequestHistory[]>('reqnest-history') || [];
    setRequestHistory(history.slice(0, 50)); // Keep last 50 requests
  };

  const saveRequestToHistory = (req: Request, res: Response) => {
    const historyItem: RequestHistory = {
      id: Date.now().toString(),
      request: req,
      response: res,
      timestamp: new Date()
    };
    
    const newHistory = [historyItem, ...requestHistory].slice(0, 50);
    setRequestHistory(newHistory);
    storage.set('reqnest-history', newHistory);
  };

  // Header management
  const addHeader = () => {
    setRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "" }]
    }));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      )
    }));
  };

  const removeHeader = (index: number) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  // Parameter management
  const addParam = () => {
    setRequest(prev => ({
      ...prev,
      params: [...prev.params, { key: "", value: "" }]
    }));
  };

  const updateParam = (index: number, field: 'key' | 'value', value: string) => {
    setRequest(prev => ({
      ...prev,
      params: prev.params.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const removeParam = (index: number) => {
    setRequest(prev => ({
      ...prev,
      params: prev.params.filter((_, i) => i !== index)
    }));
  };

  // Bulk edit functions
  const openBulkEdit = (type: 'headers' | 'params' | 'tests') => {
    let text = "";
    
    if (type === 'headers') {
      text = request.headers.map(h => `${h.key}: ${h.value}`).join('\n');
    } else if (type === 'params') {
      text = request.params.map(p => `${p.key}=${p.value}`).join('\n');
    } else if (type === 'tests') {
      text = (request.tests || []).map(t => `${t.type} ${t.operator} ${t.value}`).join('\n');
    }
    
    setBulkEditDialog({ isOpen: true, type, initialText: text });
  };

  const handleBulkEditApply = (items: Header[] | TestAssertion[]) => {
    if (bulkEditDialog.type === 'headers' || bulkEditDialog.type === 'params') {
      const typedItems = items as Header[];
      if (bulkEditDialog.type === 'headers') {
        setRequest(prev => ({ ...prev, headers: typedItems }));
      } else {
        setRequest(prev => ({ ...prev, params: typedItems }));
      }
    } else if (bulkEditDialog.type === 'tests') {
      const typedItems = items as TestAssertion[];
      setRequest(prev => ({ ...prev, tests: typedItems }));
    }
    
    toast({
      title: "Bulk edit applied",
      description: `${bulkEditDialog.type} updated successfully`
    });
  };

  // Collection management
  // Get or create default collection
  const getOrCreateDefaultCollection = (): Collection => {
    let defaultCollection = collections.find(c => c.name === 'Imported Requests');
    
    if (!defaultCollection) {
      defaultCollection = {
        id: `default_${Date.now()}`,
        name: 'Imported Requests',
        requests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Default collection for imported requests'
      };
      
      storage.saveCollection(defaultCollection);
      setCollections(prev => [...prev, defaultCollection!]);
    }
    
    return defaultCollection;
  };

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName,
      requests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    storage.saveCollection(newCollection);
    setCollections(prev => [...prev, newCollection]);
    
    // If there's a pending import request, save it to the new collection
    if (pendingImportRequest) {
      const requestToSave: Request = {
        ...pendingImportRequest,
        id: Date.now().toString(),
        name: pendingImportRequest.url || "Untitled Request"
      };
      
      newCollection.requests = [...(newCollection.requests || []), requestToSave];
      newCollection.updatedAt = new Date();
      storage.saveCollection(newCollection);
      
      setPendingImportRequest(null);
      setShowImportFromSpecDialog(false);
      
      toast({
        title: "Request saved",
        description: `Request saved to new collection "${newCollectionName}"`
      });
    } else {
      toast({
        title: "Collection created",
        description: `Collection "${newCollectionName}" created successfully`
      });
    }
    
    setNewCollectionName("");
  };

  const saveToCollection = (collectionId: string, folderId?: string) => {
    if (bulkImportRequests) {
      // Handle bulk import
      const collection = collections.find(c => c.id === collectionId);
      if (collection) {
        const requestsToSave = bulkImportRequests.map(req => ({
          ...req,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          parentId: folderId // Set parent folder if provided
        }));
        
        collection.requests = [...(collection.requests || []), ...requestsToSave];
        collection.updatedAt = new Date();
        storage.saveCollection(collection);
        setCollections(prev => 
          prev.map(c => c.id === collectionId ? collection : c)
        );
        setShowImportFromSpecDialog(false);
        setBulkImportRequests(null);
        setPendingSaveCollectionId(null);
        setPendingSaveFolderId(null);
        setSelectedCollection(undefined);
        setSelectedFolder(undefined);
        setNewFolderName("");
        setShowNewFolderInput(false);
        
        const folderName = folderId ? collection.requests.find(r => r.id === folderId)?.name : '';
        const message = folderId ? 
          `${bulkImportRequests.length} requests saved to "${collection.name}" in folder "${folderName}"` :
          `${bulkImportRequests.length} requests saved to "${collection.name}"`;
        
        toast({
          title: "Requests saved",
          description: message
        });
      }
    } else {
      // Handle single request import
      const requestToSave: Request = {
        ...(pendingImportRequest || request),
        id: Date.now().toString(),
        name: (pendingImportRequest || request).url || "Untitled Request",
        parentId: folderId // Set parent folder if provided
      };
      
      const collection = collections.find(c => c.id === collectionId);
      if (collection) {
        collection.requests = [...(collection.requests || []), requestToSave];
        collection.updatedAt = new Date();
        storage.saveCollection(collection);
        setCollections(prev => 
          prev.map(c => c.id === collectionId ? collection : c)
        );
        setRequest(normalizeRequest(requestToSave)); // <-- Update UI with new request
        setShowImportFromSpecDialog(false);
        setPendingImportRequest(null);
        setSelectedCollection(undefined);
        setSelectedFolder(undefined);
        setNewFolderName("");
        setShowNewFolderInput(false);
        
        const folderName = folderId ? collection.requests.find(r => r.id === folderId)?.name : '';
        const message = folderId ? 
          `Request saved to "${collection.name}" in folder "${folderName}"` :
          `Request saved to "${collection.name}"`;
        
        toast({
          title: "Request saved",
          description: message
        });
      }
    }
  };

  const saveToDefaultCollection = () => {
    const defaultCollection = getOrCreateDefaultCollection();
    saveToCollection(defaultCollection.id, selectedFolder);
  };

  const createFolderAndSave = (collectionId: string) => {
    if (!newFolderName.trim()) return;
    
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const newFolder: Request = {
        id: `folder_${Date.now()}`,
        name: newFolderName,
        method: 'FOLDER',
        url: '',
        headers: [],
        body: '',
        auth: { type: 'none' },
        params: [],
        tests: []
      };
      
      // Add folder to collection
      collection.requests = [...(collection.requests || []), newFolder];
      collection.updatedAt = new Date();
      storage.saveCollection(collection);
      setCollections(prev => 
        prev.map(c => c.id === collectionId ? collection : c)
      );
      
      // Save request(s) to the new folder
      if (bulkImportRequests) {
        // Handle bulk import
        const requestsToSave = bulkImportRequests.map(req => ({
          ...req,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          parentId: newFolder.id
        }));
        
        collection.requests = [...(collection.requests || []), ...requestsToSave];
        collection.updatedAt = new Date();
        storage.saveCollection(collection);
        setCollections(prev => 
          prev.map(c => c.id === collectionId ? collection : c)
        );
        setShowImportFromSpecDialog(false);
        setBulkImportRequests(null);
        setPendingSaveCollectionId(null);
        setPendingSaveFolderId(null);
        setSelectedFolder(undefined);
        setNewFolderName("");
        setShowNewFolderInput(false);
        
        toast({
          title: "Requests saved",
          description: `${bulkImportRequests.length} requests saved to "${collection.name}" in new folder "${newFolderName}"`
        });
      } else if (pendingImportRequest) {
        // Handle single request import
        const requestToSave: Request = {
          ...pendingImportRequest,
          id: Date.now().toString(),
          name: pendingImportRequest.url || "Untitled Request",
          parentId: newFolder.id
        };
        
        collection.requests.push(requestToSave);
        collection.updatedAt = new Date();
        storage.saveCollection(collection);
        setCollections(prev => 
          prev.map(c => c.id === collectionId ? collection : c)
        );
        setRequest(normalizeRequest(requestToSave)); // <-- Update UI with new request
        setShowImportFromSpecDialog(false);
        setPendingImportRequest(null);
        setSelectedFolder(undefined);
        setNewFolderName("");
        setShowNewFolderInput(false);
        
        toast({
          title: "Request saved",
          description: `Request saved to "${collection.name}" in new folder "${newFolderName}"`
        });
      }
    }
  };

  const saveCurrentRequestToCollection = (collectionId: string, requestName?: string) => {
    const requestToSave: Request = {
      ...request,
      id: Date.now().toString(),
      name: requestName || request.url || "Untitled Request"
    };
    
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      collection.requests.push(requestToSave);
      collection.updatedAt = new Date();
      storage.saveCollection(collection);
      setCollections(prev => 
        prev.map(c => c.id === collectionId ? collection : c)
      );
      toast({
        title: "Request saved",
        description: `Request saved to "${collection.name}"`
      });
    }
  };

  const updateRequestName = (collectionId: string, requestId: string, newName: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const updatedCollection = {
        ...collection,
        requests: collection.requests.map(req => 
          req.id === requestId ? { ...req, name: newName } : req
        ),
        updatedAt: new Date()
      };
      storage.saveCollection(updatedCollection);
      setCollections(prev => 
        prev.map(c => c.id === collectionId ? updatedCollection : c)
      );
      toast({
        title: "Request updated",
        description: "Request name updated successfully"
      });
    }
  };

  // Utility function to normalize request objects
  const normalizeRequest = (req: Partial<Request>): Request => {
    // Ensure headers is an array of objects with key/value pairs
    const normalizedHeaders = req.headers || [];
    const headers = Array.isArray(normalizedHeaders) 
      ? normalizedHeaders.map(h => ({ key: h.key || '', value: h.value || '' }))
      : [];
    
    // Ensure params is an array of objects with key/value pairs
    const normalizedParams = req.params || [];
    const params = Array.isArray(normalizedParams) 
      ? normalizedParams.map(p => ({ key: p.key || '', value: p.value || '' }))
      : [];
    
    // Ensure tests is an array of test objects
    const normalizedTests = req.tests || [];
    const tests = Array.isArray(normalizedTests) 
      ? normalizedTests.map(t => ({
          id: t.id || Date.now().toString(),
          type: t.type || 'status',
          field: t.field || '',
          operator: t.operator || 'equals',
          value: t.value || '',
          enabled: t.enabled !== undefined ? t.enabled : true
        }))
      : [];
    
    return {
      id: req.id || Date.now().toString(),
      name: req.name || "Untitled Request",
      method: req.method || 'GET',
      url: req.url || '',
      headers: headers,
      body: req.body || '',
      auth: req.auth || { type: 'none' },
      params: params,
      preRequestScript: req.preRequestScript || '',
      postRequestScript: req.postRequestScript || '',
      tests: tests,
      description: req.description || '',
      parentId: req.parentId
    };
  };

  const loadFromCollection = (collectionId: string, requestId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    const savedRequest = collection?.requests.find(r => r.id === requestId);
    if (savedRequest) {
      const normalizedRequest = normalizeRequest(savedRequest);
      setRequest(normalizedRequest);
      toast({
        title: "Request loaded",
        description: "Request loaded from collection"
      });
    }
  };

  const deleteCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setDeleteDialog({
        isOpen: true,
        type: 'collection',
        itemId: collectionId,
        itemName: collection.name,
      });
    }
  };

  const confirmDeleteCollection = () => {
    const collection = collections.find(c => c.id === deleteDialog.itemId);
    if (collection) {
      storage.deleteCollection(deleteDialog.itemId);
      setCollections(prev => prev.filter(c => c.id !== deleteDialog.itemId));
      
      if (selectedCollection === deleteDialog.itemId) {
        setSelectedCollection(undefined);
      }
      
      setDeleteDialog({ isOpen: false, type: 'collection', itemId: '', itemName: '' });
      
      toast({
        title: "Collection deleted",
        description: `"${collection.name}" has been deleted`
      });
    }
  };

  const duplicateItem = (itemId: string, type: string) => {
    console.log('Duplicating item:', itemId, 'type:', type);
    
    if (type === 'collection') {
      const collection = collections.find(c => c.id === itemId);
      if (collection) {
        const duplicatedCollection = {
          ...collection,
          id: `collection_${Date.now()}`,
          name: `${collection.name} (Copy)`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        storage.saveCollection(duplicatedCollection);
        setCollections(prev => [...prev, duplicatedCollection]);
        
        toast({
          title: "Collection duplicated",
          description: `"${duplicatedCollection.name}" has been created`
        });
      }
    } else if (type === 'request' || type === 'folder') {
      // Find the collection containing this request/folder
      const collection = collections.find(c => c.requests.some(r => r.id === itemId));
      if (collection) {
        const request = collection.requests.find(r => r.id === itemId);
        if (request) {
                  const duplicatedRequest = {
          ...request,
          id: `${type === 'folder' ? 'folder' : 'request'}_${Date.now()}`,
          name: request.name ? `${request.name} (Copy)` : `${request.url || 'Untitled'} (Copy)`,
          parentId: request.parentId // Preserve folder relationship
        };
          
          const updatedCollection = {
            ...collection,
            requests: [...collection.requests, duplicatedRequest],
            updatedAt: new Date(),
          };
          
          storage.saveCollection(updatedCollection);
          setCollections(prev => 
            prev.map(c => c.id === collection.id ? updatedCollection : c)
          );
          
          const itemType = type === 'folder' ? 'Folder' : 'Request';
          toast({
            title: `${itemType} duplicated`,
            description: `"${duplicatedRequest.name}" has been created`
          });
        }
      }
    }
  };

  const deleteRequestFromCollection = (collectionId: string, requestId: string) => {
    console.log('Deleting request/folder:', requestId, 'from collection:', collectionId);
    
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const requestToDelete = collection.requests.find(r => r.id === requestId);
      const isFolder = requestToDelete?.method === 'FOLDER';
      
      const updatedCollection = {
        ...collection,
        requests: collection.requests.filter(r => r.id !== requestId),
        updatedAt: new Date()
      };
      storage.saveCollection(updatedCollection);
      setCollections(prev => 
        prev.map(c => c.id === collectionId ? updatedCollection : c)
      );
      
      const itemType = isFolder ? 'Folder' : 'Request';
      toast({
        title: `${itemType} deleted`,
        description: `${itemType} removed from collection`
      });
    }
  };

  // Curl import/export
  const parseCurlCommand = (curl: string): Partial<Request> => {
    let method = 'GET';
    let url = '';
    const headers: Header[] = [];
    let body = '';
    const params: Header[] = [];
    
    // Normalize the curl command - handle multi-line commands and line continuations
    const normalizedCurl = curl
      .replace(/\\\s*\n\s*/g, ' ') // Remove line continuations
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();
    
    console.log('Normalized cURL:', normalizedCurl);
    
    // Split the command into parts, respecting quotes
    const parts = splitCurlCommand(normalizedCurl);
    console.log('Split parts:', parts);
    
    // Extract method
    const methodIndex = parts.findIndex(part => part === '-X' || part === '--request');
    if (methodIndex !== -1 && parts[methodIndex + 1]) {
      method = parts[methodIndex + 1].toUpperCase();
    }
    
    // Extract URL (first non-flag argument after curl, but not method)
    let urlIndex = 1; // Skip 'curl'
    while (urlIndex < parts.length && (parts[urlIndex].startsWith('-') || parts[urlIndex] === 'curl')) {
      urlIndex++;
    }
    // Skip method if it's the next argument
    if (urlIndex < parts.length && (parts[urlIndex] === 'GET' || parts[urlIndex] === 'POST' || parts[urlIndex] === 'PUT' || parts[urlIndex] === 'DELETE' || parts[urlIndex] === 'PATCH' || parts[urlIndex] === 'HEAD' || parts[urlIndex] === 'OPTIONS')) {
      urlIndex++;
    }
    if (urlIndex < parts.length) {
      url = parts[urlIndex];
      // Clean up URL
      url = url.replace(/^['"`]|['"`]$/g, '');
    }
    
    // Extract headers
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '-H' || part === '--header') {
        if (i + 1 < parts.length) {
          const headerValue = parts[i + 1];
          const colonIndex = headerValue.indexOf(':');
          if (colonIndex > 0) {
            const key = headerValue.substring(0, colonIndex).trim();
            const value = headerValue.substring(colonIndex + 1).trim();
            headers.push({ key, value });
          }
        }
      }
    }
    
    // Extract body data
    const bodyFlags = ['-d', '--data', '--data-raw', '--data-binary', '--data-urlencode'];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (bodyFlags.includes(part)) {
        if (i + 1 < parts.length) {
          body = parts[i + 1];
          // Clean up body
          body = body.replace(/^['"`]|['"`]$/g, '');
          break;
        }
      }
    }
    
    // Fix Content-Type header if it's multipart/form-data but body is JSON
    if (body && body.trim().startsWith('{') && body.trim().endsWith('}')) {
      const contentTypeHeader = headers.find(h => h.key.toLowerCase() === 'content-type');
      if (contentTypeHeader && contentTypeHeader.value.includes('multipart/form-data')) {
        contentTypeHeader.value = 'application/json';
      }
    }
    
    // Extract query parameters from URL
    if (url.includes('?')) {
      const [baseUrl, queryString] = url.split('?');
      url = baseUrl;
      
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((value, key) => {
        params.push({ key, value });
      });
    }
    
    console.log('Parsed cURL - URL:', url, 'Method:', method, 'Headers:', headers, 'Body:', body, 'Params:', params);
    
    return {
      method,
      url,
      headers,
      body,
      params
    };
  };

  // Helper function to split cURL command respecting quotes
  const splitCurlCommand = (command: string): string[] => {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escapeNext = false;
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        current += char;
        continue;
      }
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }
      
      if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  };

  const importFromCurl = () => {
    if (!curlCommand.trim()) return;
    
    try {
      const parsed = parseCurlCommand(curlCommand);
      const importedRequest = normalizeRequest({
        ...parsed,
        headers: parsed.headers || [],
        body: parsed.body || '',
        auth: { type: 'none' },
        params: parsed.params || []
      });
      setRequest(importedRequest);
      setCurlCommand("");
      setShowCurlImport(false);
      // Always show import dialog to save to collection
      setPendingImportRequest(importedRequest);
      setShowImportFromSpecDialog(true);
      toast({
        title: "cURL imported",
        description: "Request imported from cURL command"
      });
    } catch (error) {
      console.error('cURL import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to parse cURL command",
        variant: "destructive"
      });
    }
  };

  const exportToCurl = () => {
    let curl = `curl -X ${request.method}`;
    
    // Add URL
    curl += ` "${request.url}"`;
    
    // Add headers
    const allHeaders = [...request.headers];
    
    // Add auth headers
    if (request.auth.type === 'bearer' && request.auth.token) {
      allHeaders.push({ key: 'Authorization', value: `Bearer ${request.auth.token}` });
    } else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
      const encoded = btoa(`${request.auth.username}:${request.auth.password}`);
      allHeaders.push({ key: 'Authorization', value: `Basic ${encoded}` });
    } else if (request.auth.type === 'api-key' && request.auth.keyName && request.auth.keyValue) {
      if (request.auth.keyLocation === 'header') {
        allHeaders.push({ key: request.auth.keyName, value: request.auth.keyValue });
      }
    }
    
    allHeaders.forEach(header => {
      if (header.key && header.value) {
        curl += ` \\\n  -H "${header.key}: ${header.value}"`;
      }
    });
    
    // Add body
    if (request.body && request.method !== 'GET') {
      curl += ` \\\n  -d '${request.body}'`;
    }
    
    return curl;
  };

  const copyCurl = () => {
    const curl = exportToCurl();
    navigator.clipboard.writeText(curl);
    toast({
      title: "cURL copied",
      description: "cURL command copied to clipboard"
    });
  };

  // Environment variable utilities
  const substituteVariables = (text: string): string => {
    if (!activeEnvironment) return text;
    
    const env = environments.find(e => e.id === activeEnvironment);
    if (!env) return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return env.variables[varName] || match;
    });
  };

  const createEnvironment = () => {
    if (!newEnvironmentName.trim()) return;
    
    const newEnv: Environment = {
      id: Date.now().toString(),
      name: newEnvironmentName,
      variables: { ...environmentVariables },
      isActive: environments.length === 0
    };
    
    const updatedEnvs = [...environments, newEnv];
    setEnvironments(updatedEnvs);
    storage.set('reqnest-environments', updatedEnvs);
    
    if (environments.length === 0) {
      setActiveEnvironment(newEnv.id);
    }
    
    setNewEnvironmentName("");
    setEnvironmentVariables({});
    toast({
      title: "Environment created",
      description: `Environment "${newEnvironmentName}" created successfully`
    });
  };

  const setActiveEnv = (envId: string) => {
    const updatedEnvs = environments.map(env => ({
      ...env,
      isActive: env.id === envId
    }));
    setEnvironments(updatedEnvs);
    setActiveEnvironment(envId);
    storage.set('reqnest-environments', updatedEnvs);
  };

  const addEnvironmentVariable = () => {
    setEnvironmentVariables(prev => ({
      ...prev,
      [`var${Object.keys(prev).length + 1}`]: ""
    }));
  };

  const updateEnvironmentVariable = (key: string, value: string) => {
    setEnvironmentVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const removeEnvironmentVariable = (key: string) => {
    setEnvironmentVariables(prev => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  // Testing utilities
  const runTests = (response: Response): { assertion: TestAssertion; passed: boolean; message: string }[] => {
    return (request.tests || []).filter(test => test.enabled).map(test => {
      let passed = false;
      let message = "";
      
      try {
        switch (test.type) {
          case 'status':
            const statusValue = response.status.toString();
            passed = evaluateAssertion(statusValue, test.operator, test.value);
            message = passed ? 
              `Status code ${statusValue} ${test.operator} ${test.value}` : 
              `Expected status ${test.operator} ${test.value}, got ${statusValue}`;
            break;
            
          case 'header':
            const headerValue = response.headers[test.field || ''] || '';
            passed = evaluateAssertion(headerValue, test.operator, test.value);
            message = passed ? 
              `Header ${test.field} ${test.operator} ${test.value}` : 
              `Header ${test.field} assertion failed`;
            break;
            
          case 'body':
            passed = evaluateAssertion(response.data, test.operator, test.value);
            message = passed ? 
              `Body ${test.operator} ${test.value}` : 
              `Body assertion failed`;
            break;
            
          case 'response-time':
            const timeValue = response.time.toString();
            passed = evaluateAssertion(timeValue, test.operator, test.value);
            message = passed ? 
              `Response time ${timeValue}ms ${test.operator} ${test.value}ms` : 
              `Response time assertion failed`;
            break;
        }
      } catch (error) {
        passed = false;
        message = `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
      
      return { assertion: test, passed, message };
    });
  };

  const evaluateAssertion = (actual: string, operator: string, expected: string): boolean => {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return actual.includes(expected);
      case 'not-equals':
        return actual !== expected;
      case 'greater-than':
        return parseFloat(actual) > parseFloat(expected);
      case 'less-than':
        return parseFloat(actual) < parseFloat(expected);
      case 'exists':
        return actual !== undefined && actual !== null && actual !== '';
      default:
        return false;
    }
  };

  const addTest = () => {
    const newTest: TestAssertion = {
      id: Date.now().toString(),
      type: 'status',
      operator: 'equals',
      value: '200',
      enabled: true
    };
    
    setRequest(prev => ({
      ...prev,
      tests: [...prev.tests, newTest]
    }));
  };

  const updateTest = (testId: string, field: keyof TestAssertion, value: any) => {
    setRequest(prev => ({
      ...prev,
      tests: prev.tests.map(test => 
        test.id === testId ? { ...test, [field]: value } : test
      )
    }));
  };

  const removeTest = (testId: string) => {
    setRequest(prev => ({
      ...prev,
      tests: prev.tests.filter(test => test.id !== testId)
    }));
  };

  const toggleTest = (testId: string, enabled: boolean) => {
    setRequest(prev => ({
      ...prev,
      tests: prev.tests.map(test =>
        test.id === testId ? { ...test, enabled } : test
      )
    }));
  };

  const deleteEnvironment = (envId: string) => {
    const updatedEnvs = environments.filter(env => env.id !== envId);
    setEnvironments(updatedEnvs);
    storage.set('reqnest-environments', updatedEnvs);
    if (activeEnvironment === envId) {
      setActiveEnvironment(updatedEnvs.length > 0 ? updatedEnvs[0].id : null);
    }
    toast({
      title: "Environment deleted",
      description: "Environment has been deleted"
    });
  };

  // Pre-request script execution
  const executePreRequestScript = async () => {
    if (!request.preRequestScript) return {};
    
    try {
      const env = environments.find(e => e.id === activeEnvironment);
      const variables = env?.variables || {};
      
      // Create a safe execution context
      const context = {
        environment: variables,
        request: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body
        },
        console: {
          log: (msg: any) => console.log('[Pre-request]', msg)
        }
      };
      
      // Simple script execution (in real implementation, you'd use a sandboxed environment)
      const func = new Function('context', request.preRequestScript);
      const result = func(context);
      
      return result || {};
    } catch (error) {
      console.error('Pre-request script error:', error);
      toast({
        title: "Pre-request script error",
        description: error instanceof Error ? error.message : "Script execution failed",
        variant: "destructive"
      });
      return {};
    }
  };

  const sendRequest = async () => {
    if (!request.url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      // Execute pre-request script
      await executePreRequestScript();

      // Build headers with variable substitution
      const headers: Record<string, string> = {};
      request.headers.forEach(header => {
        if (header.key && header.value) {
          headers[substituteVariables(header.key)] = substituteVariables(header.value);
        }
      });

      // Add authentication headers
      if (request.auth.type === 'bearer' && request.auth.token) {
        headers['Authorization'] = `Bearer ${substituteVariables(request.auth.token)}`;
      } else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
        const encoded = btoa(`${substituteVariables(request.auth.username)}:${substituteVariables(request.auth.password)}`);
        headers['Authorization'] = `Basic ${encoded}`;
      } else if (request.auth.type === 'api-key' && request.auth.keyName && request.auth.keyValue) {
        if (request.auth.keyLocation === 'header') {
          headers[substituteVariables(request.auth.keyName)] = substituteVariables(request.auth.keyValue);
        }
      }

      // Build URL with parameters and variable substitution
      let finalUrl = substituteVariables(request.url);
      if (request.params.length > 0) {
        const url = new URL(finalUrl);
        request.params.forEach(param => {
          if (param.key && param.value) {
            url.searchParams.append(
              substituteVariables(param.key), 
              substituteVariables(param.value)
            );
          }
        });
        
        // Add API key to query params if needed
        if (request.auth.type === 'api-key' && request.auth.keyName && request.auth.keyValue) {
          if (request.auth.keyLocation === 'query') {
            url.searchParams.append(
              substituteVariables(request.auth.keyName), 
              substituteVariables(request.auth.keyValue)
            );
          }
        }
        
        finalUrl = url.toString();
      }

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.method !== "GET" && request.body) {
        fetchOptions.body = substituteVariables(request.body);
      }

      const res = await fetch(finalUrl, fetchOptions);
      const data = await res.text();
      const time = Date.now() - startTime;

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Calculate response size
      const size = new Blob([data]).size;

      // Run tests
      const testResults = runTests({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        time,
        size
      });

      const response: Response = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        time,
        size,
        testResults
      };

      setResponse(response);
      saveRequestToHistory(request, response);

      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;

      toast({
        title: "Request sent successfully",
        description: totalTests > 0 ? 
          `Response received in ${time}ms • ${passedTests}/${totalTests} tests passed` :
          `Response received in ${time}ms`
      });
    } catch (error) {
      const time = Date.now() - startTime;
      
      // Create a failed response object
      const failedResponse: Response = {
        status: 0,
        statusText: "Request Failed",
        headers: {},
        data: error instanceof Error ? error.message : "Unknown error",
        time,
        size: 0,
        testResults: []
      };

      setResponse(failedResponse);
      saveRequestToHistory(request, failedResponse);

      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.data);
      toast({
        title: "Copied",
        description: "Response copied to clipboard"
      });
    }
  };

  const downloadResponse = () => {
    if (response) {
      const blob = new Blob([response.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "response.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const containerClass = isFullScreen 
    ? "fixed inset-0 z-50 bg-background"
    : "flex-1 overflow-y-auto p-6";

  const gridClass = isFullScreen 
    ? fullScreenMode === 'both' 
      ? "grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6"
      : "h-full p-6"
    : "grid grid-cols-1 lg:grid-cols-2 gap-6 h-full";

  const useHistoryItem = (item: any) => {
    setRequest(normalizeRequest(item.request));
    setResponse(item.response);
    setShowHistory(false);
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = requestHistory.filter(h => h.id !== id);
    setRequestHistory(newHistory);
    storage.set('reqnest-history', newHistory);
    setSelectedHistoryIds(ids => ids.filter(x => x !== id));
  };

  const deleteSelectedHistory = () => {
    const newHistory = requestHistory.filter(h => !selectedHistoryIds.includes(h.id));
    setRequestHistory(newHistory);
    storage.set('reqnest-history', newHistory);
    setSelectedHistoryIds([]);
  };

  const deleteAllHistory = () => {
    setRequestHistory([]);
    storage.set('reqnest-history', []);
    setSelectedHistoryIds([]);
  };

  // Add folder function
  const addFolderToCollection = (collectionId: string) => {
    console.log('Adding folder to collection:', collectionId);
    
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const folderCount = collection.requests.filter(r => r.method === 'FOLDER').length;
      const newFolderName = `New Folder ${folderCount + 1}`;
      const newFolder: Request = {
        id: `folder_${Date.now()}`,
        name: newFolderName,
        method: 'FOLDER',
        url: '',
        headers: [],
        body: '',
        auth: { type: 'none' },
        params: [],
        tests: []
      };
      
      console.log('Created new folder:', newFolder);
      
      const updatedCollection = {
        ...collection,
        requests: [...collection.requests, newFolder],
        updatedAt: new Date()
      };
      
      storage.saveCollection(updatedCollection);
      setCollections(prev => 
        prev.map(c => c.id === collectionId ? updatedCollection : c)
      );
      
      toast({
        title: "Folder added",
        description: `Folder "${newFolderName}" added to collection`
      });
    }
  };

  // Add request to collection or folder
  const addRequestToCollection = (collectionId: string, folderId?: string) => {
    console.log('Adding request to collection:', collectionId, 'folderId:', folderId);
    
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const requestToAdd: Request = {
        ...request,
        id: `request_${Date.now()}`,
        name: request.name || request.url || "Untitled Request",
        parentId: folderId || undefined // Set parent folder if provided
      };
      
      console.log('Adding request:', requestToAdd);
      
      const updatedCollection = {
        ...collection,
        requests: [...collection.requests, requestToAdd],
        updatedAt: new Date()
      };
      
      storage.saveCollection(updatedCollection);
      setCollections(prev => 
        prev.map(c => c.id === collectionId ? updatedCollection : c)
      );
      
      if (folderId) {
        console.log('Request added to folder:', folderId);
        toast({
          title: "Request added",
          description: `Request added to folder in "${collection.name}"`
        });
      } else {
        console.log('Request added to collection directly');
        toast({
          title: "Request added",
          description: `Request added to "${collection.name}"`
        });
      }
    }
  };

  // Move request function
  const moveRequest = (requestId: string, targetId: string, targetType: string) => {
    console.log('Moving request:', requestId, 'to target:', targetId, 'type:', targetType);
    
    // Find source collection
    const sourceCollection = collections.find(c => c.requests.some(r => r.id === requestId));
    if (!sourceCollection) {
      console.error('Source collection not found for request:', requestId);
      return;
    }

    // Find the request to move
    const requestToMove = sourceCollection.requests.find(r => r.id === requestId);
    if (!requestToMove) {
      console.error('Request to move not found:', requestId);
      return;
    }

    if (targetType === 'collection') {
      // Check if moving to a different collection or to collection level
      if (targetId !== sourceCollection.id) {
        // Moving to a different collection
        const targetCollection = collections.find(c => c.id === targetId);
        if (!targetCollection) {
          console.error('Target collection not found:', targetId);
          return;
        }

        // Remove from source collection
        const updatedSourceCollection = {
          ...sourceCollection,
          requests: sourceCollection.requests.filter(r => r.id !== requestId),
          updatedAt: new Date()
        };

        // Add to target collection (at collection level, not in a folder)
        const updatedRequest = { ...requestToMove, parentId: undefined };
        console.log('Updated request after move:', updatedRequest);
        const updatedTargetCollection = {
          ...targetCollection,
          requests: [...targetCollection.requests, updatedRequest],
          updatedAt: new Date()
        };

        // Save both collections
        storage.saveCollection(updatedSourceCollection);
        storage.saveCollection(updatedTargetCollection);

        // Debug: print both collections after move
        console.log('Source collection after move:', updatedSourceCollection.requests);
        console.log('Target collection after move:', updatedTargetCollection.requests);

        // Force reload from storage to ensure UI updates
        setCollections(storage.getCollections());

        toast({
          title: "Request moved",
          description: `Request moved to "${targetCollection.name}"`
        });
      } else {
        // Moving to collection level within the same collection
        const updatedRequest = {
          ...requestToMove,
          parentId: undefined // Remove parent folder
        };
        
        const updatedCollection = {
          ...sourceCollection,
          requests: sourceCollection.requests.map(r => r.id === requestId ? updatedRequest : r),
          updatedAt: new Date()
        };

        storage.saveCollection(updatedCollection);
        
        // Debug: print collection after move
        console.log('Collection after move (folder to collection level):', updatedCollection.requests);
        
        // Force reload from storage to ensure UI updates
        setCollections(storage.getCollections());

        toast({
          title: "Request moved",
          description: `Request moved to collection level in "${sourceCollection.name}"`
        });
      }
    } else if (targetType === 'folder') {
      // Find the target collection by folderId
      const targetCollection = collections.find(c => c.requests.some(r => r.id === targetId && r.method === 'FOLDER'));
      if (!targetCollection) {
        console.error('Target collection for folder not found:', targetId);
        return;
      }

      // Remove from source collection
      const updatedSourceCollection = {
        ...sourceCollection,
        requests: sourceCollection.requests.filter(r => r.id !== requestId),
        updatedAt: new Date()
      };

      // Add to target collection, set parentId to folder
      const updatedRequest = { ...requestToMove, parentId: targetId };
      console.log('Updated request after move:', updatedRequest);
      const updatedTargetCollection = {
        ...targetCollection,
        requests: [...targetCollection.requests, updatedRequest],
        updatedAt: new Date()
      };

      // Save both collections
      storage.saveCollection(updatedSourceCollection);
      storage.saveCollection(updatedTargetCollection);

      // Debug: print target collection's requests after move
      console.log('Target collection after move:', updatedTargetCollection.requests);

      // Force reload from storage to ensure UI updates
      setCollections(storage.getCollections());

      toast({
        title: "Request moved",
        description: `Request moved to folder in "${targetCollection.name}"`
      });
    }
  };

  const handleSaveToCollection = () => {
    if (pendingSaveCollectionId) {
      if (bulkImportRequests) {
        // Bulk save
        const collection = collections.find(c => c.id === pendingSaveCollectionId);
        if (collection) {
          const updatedCollection = {
            ...collection,
            requests: [
              ...collection.requests,
              ...bulkImportRequests.map(req => ({
                ...req,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                parentId: pendingSaveFolderId || undefined
              }))
            ],
            updatedAt: new Date()
          };
          storage.saveCollection(updatedCollection);
          setCollections(prev => prev.map(c => c.id === collection.id ? updatedCollection : c));
          setBulkImportRequests(null);
          setShowSaveToCollectionDialog(false);
          setPendingSaveCollectionId(null);
          setPendingSaveFolderId(null);
          toast({ title: 'Requests saved', description: `Saved ${bulkImportRequests.length} requests to ${collection.name}${pendingSaveFolderId ? ' (folder)' : ''}` });
        }
      } else {
        // Single save
        saveCurrentRequestToCollection(pendingSaveCollectionId, request.name || request.url);
        setShowSaveToCollectionDialog(false);
        setPendingSaveCollectionId(null);
        setPendingSaveFolderId(null);
      }
    }
  };

  return (
    <>
      {!isFullScreen && !isMaximized && (
        <>
          <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
            <div>
              <h1 className="text-xl font-semibold">ReqNest - API Request Builder</h1>
              <p className="text-sm text-muted-foreground">Build, test, and organize your API requests</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(true)}
              className="ml-2"
              title="Maximize ReqNest"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Maximize
            </Button>
          </div>
        </>
      )}
      {isMaximized && (
        <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
          <div>
            <h1 className="text-xl font-semibold">ReqNest - API Request Builder</h1>
            <p className="text-sm text-muted-foreground">Build, test, and organize your API requests</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(false)}
            className="ml-2"
            title="Minimize ReqNest"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Minimize
          </Button>
        </div>
      )}
      
      <main className={isMaximized ? "fixed inset-0 z-50 bg-background flex flex-col" : containerClass}>
        <div className="flex h-full">
          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="fixed top-4 left-4 z-50 md:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-background"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Left Sidebar for Controls */}
          <div 
            className={`
              reqnest-sidebar
              ${sidebarHovered ? 'w-80' : 'w-16'} 
              ${isMobile ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out' : 'relative'} 
              ${isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'}
              border-r bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden transition-all duration-300
            `}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            <div className="p-4 h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-4">
                {sidebarHovered && (
                  <h3 className="text-sm font-medium">Controls</h3>
                )}
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSidebar(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 space-y-4 overflow-y-auto">
                {/* Quick Actions */}
                <div className="space-y-2">
                  {sidebarHovered && (
                    <h4 className="text-xs font-medium text-muted-foreground">Quick Actions</h4>
                  )}
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowCurlImport(true)} 
                      className={`w-full ${!sidebarHovered ? 'justify-center' : 'justify-start'}`}
                      title="Import cURL"
                    >
                      <Download className="w-4 h-4" />
                      {sidebarHovered && <span className="ml-2">Import cURL</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowHistory(true)} 
                      className={`w-full ${!sidebarHovered ? 'justify-center' : 'justify-start'}`}
                      title="History"
                    >
                      <History className="w-4 h-4" />
                      {sidebarHovered && <span className="ml-2">History</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowEnvironments(true)} 
                      className={`w-full ${!sidebarHovered ? 'justify-center' : 'justify-start'}`}
                      title="Environments"
                    >
                      <Globe className="w-4 h-4" />
                      {sidebarHovered && <span className="ml-2">Environments</span>}
                    </Button>
                  </div>
                </div>

                {/* Collections */}
                {sidebarHovered ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Collections Header with Icon, now bold */}
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b bg-background sticky top-0 z-10">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      Collections
                    </div>
                    <CollectionSidebar
                      collections={collections.map(collection => {
                        // Separate folders and requests
                        const folders = collection.requests.filter(req => req.method === 'FOLDER');
                        const requests = collection.requests.filter(req => req.method !== 'FOLDER');
                        
                        // Create folder structure
                        const folderItems = folders.map(folder => {
                          const folderRequests = requests.filter(req => req.parentId === folder.id);
                          console.log('Folder:', folder.id, 'has', folderRequests.length, 'requests');
                          
                          return {
                            id: folder.id || `folder_${Date.now()}`,
                            name: folder.name || 'Untitled Folder',
                            type: 'folder' as const,
                            children: folderRequests.map(req => ({
                              id: req.id || `req_${Date.now()}`,
                              name: req.name || req.url || 'Untitled Request',
                              type: 'request' as const,
                              method: req.method,
                              url: req.url,
                            }))
                          };
                        });
                        
                        // Add requests that don't belong to any folder
                        const rootRequests = requests.filter(req => !req.parentId).map(req => ({
                          id: req.id || `req_${Date.now()}`,
                          name: req.name || req.url || 'Untitled Request',
                          type: 'request' as const,
                          method: req.method,
                          url: req.url,
                        }));
                        
                        console.log('Collection:', collection.name, 'has', folders.length, 'folders and', rootRequests.length, 'root requests');
                        
                        return {
                          id: collection.id,
                          name: collection.name,
                          type: 'collection' as const,
                          children: [...folderItems, ...rootRequests]
                        };
                      })}
                      onCollectionSelect={(item) => {
                        if (item.type === 'collection') {
                          setSelectedCollection(selectedCollection === item.id ? undefined : item.id);
                        }
                      }}
                      onRequestSelect={(item) => {
                        if (item.type === 'request') {
                          // Find the collection containing this request
                          const collection = collections.find(c => c.requests.some(r => r.id === item.id));
                          if (collection && item.id) {
                            loadFromCollection(collection.id, item.id);
                          }
                        }
                      }}
                      onAddCollection={() => setShowNewCollectionDialog(true)}
                      onAddFolder={(collectionId) => {
                        addFolderToCollection(collectionId);
                      }}
                      onAddRequest={(collectionId, folderId) => {
                        addRequestToCollection(collectionId, folderId);
                      }}
                      onDeleteItem={(itemId, type) => {
                        if (type === 'collection') {
                          deleteCollection(itemId);
                        } else if (type === 'request' || type === 'folder') {
                          // Find the collection containing this request/folder
                          const collection = collections.find(c => c.requests.some(r => r.id === itemId));
                          if (collection && itemId) {
                            deleteRequestFromCollection(collection.id, itemId);
                          }
                        }
                      }}
                      onRenameItem={(itemId, newName) => {
                        // Find if it's a collection or request
                        const collection = collections.find(c => c.id === itemId);
                        if (collection) {
                          // Rename collection - show dialog
                          setRenameDialog({
                            isOpen: true,
                            itemId,
                            currentName: collection.name,
                            itemType: 'collection'
                          });
                        } else {
                          // Find the collection containing this request
                          const collection = collections.find(c => c.requests.some(r => r.id === itemId));
                          if (collection && itemId) {
                            const request = collection.requests.find(r => r.id === itemId);
                            if (request) {
                              setRenameDialog({
                                isOpen: true,
                                itemId,
                                currentName: request.name || request.url || 'Untitled Request',
                                itemType: 'request'
                              });
                            }
                          }
                        }
                      }}
                      onDuplicateItem={duplicateItem}
                      onMoveItem={(itemId, targetId, targetType) => {
                        if (targetType === 'move') {
                          // Show move dialog
                          const collection = collections.find(c => c.requests.some(r => r.id === itemId));
                          if (collection) {
                            const request = collection.requests.find(r => r.id === itemId);
                            if (request) {
                              setMoveDialog({
                                isOpen: true,
                                itemId,
                                itemName: request.name || request.url || 'Untitled Request',
                                itemType: 'request'
                              });
                            }
                          }
                        } else {
                          // Direct move (from drag and drop)
                          moveRequest(itemId, targetId, targetType);
                        }
                      }}
                      selectedItemId={selectedCollection || undefined}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-center"
                      title="Collections"
                    >
                      <Folder className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile overlay */}
          {isMobile && showSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Main Content Area */}
          <div className={`flex-1 flex flex-col ${isMobile ? 'w-full' : ''}`}>
            {/* Maximized Header */}
            {isMaximized && (
              <div className="flex items-center justify-between p-4 border-b bg-card">
                <div>
                  <h1 className="text-xl font-semibold">ReqNest - API Request Builder</h1>
                  <p className="text-sm text-muted-foreground">Build, test, and organize your API requests</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsMaximized(false)}>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </Button>
              </div>
            )}
            
            {/* URL Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
              <Select value={request.method} onValueChange={(value) => setRequest(prev => ({ ...prev, method: value }))}>
                <SelectTrigger className={`w-full sm:w-[100px] h-10 font-semibold ${
                  request.method === 'GET' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
                  request.method === 'POST' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700' :
                  request.method === 'PUT' ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700' :
                  request.method === 'DELETE' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700' :
                  request.method === 'PATCH' ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700' :
                  'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET" className="text-green-700 dark:text-green-300">GET</SelectItem>
                  <SelectItem value="POST" className="text-blue-700 dark:text-blue-300">POST</SelectItem>
                  <SelectItem value="PUT" className="text-orange-700 dark:text-orange-300">PUT</SelectItem>
                  <SelectItem value="DELETE" className="text-red-700 dark:text-red-300">DELETE</SelectItem>
                  <SelectItem value="PATCH" className="text-purple-700 dark:text-purple-300">PATCH</SelectItem>
                  <SelectItem value="HEAD" className="text-gray-700 dark:text-gray-300">HEAD</SelectItem>
                  <SelectItem value="OPTIONS" className="text-gray-700 dark:text-gray-300">OPTIONS</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Enter request URL"
                value={request.url}
                onChange={(e) => setRequest(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1 h-10"
              />
              <Button 
                onClick={sendRequest} 
                disabled={loading || !request.url.trim()}
                className="h-10 px-6 w-full sm:w-auto bg-gradient-to-r from-orange-400 to-yellow-300 text-white font-bold shadow-lg hover:from-orange-500 hover:to-yellow-400 focus:ring-2 focus:ring-orange-300 transition-all border-none rounded-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
            
            {/* Split Pane Layout - Horizontal */}
            <div className="flex-1 min-h-0">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Request Panel */}
                <ResizablePanel defaultSize={50} minSize={25} maxSize={75}>
                  <div className="h-full p-2 sm:p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Request Configuration */}
                      <div className="bg-gradient-to-br from-peach-50 via-orange-50 to-yellow-50 dark:from-orange-900/10 dark:via-yellow-900/10 dark:to-peach-900/10 rounded-2xl border border-orange-200 dark:border-orange-700 shadow-md">
                        <div className="border-b border-orange-200 dark:border-orange-700 p-4 rounded-t-2xl bg-gradient-to-r from-orange-100 via-yellow-100 to-peach-100 dark:from-orange-900/20 dark:via-yellow-900/20 dark:to-peach-900/20">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 tracking-wide">Request</h3>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="h-8 px-3"
                                title="Settings"
                              >
                                {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                <span className="hidden lg:inline">Settings</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSaveToCollectionDialog(true)}
                                className="h-8 px-3"
                                title="Save"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                <span className="hidden lg:inline">Save</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyCurl}
                                className="h-8 px-3"
                                title="Code"
                              >
                                <Terminal className="w-4 h-4 mr-2" />
                                <span className="hidden lg:inline">Code</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="flex w-full gap-2 bg-orange-50 dark:bg-orange-900/10 rounded-full p-1 shadow-sm">
                            <TabsTrigger value="params" className="rounded-full px-5 py-2 font-semibold text-purple-900 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-yellow-100 data-[state=active]:shadow-md data-[state=active]:text-purple-900 dark:data-[state=active]:text-[#23272f] transition-all">Parameters</TabsTrigger>
                            <TabsTrigger value="headers" className="rounded-full px-5 py-2 font-semibold text-purple-900 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-yellow-100 data-[state=active]:shadow-md data-[state=active]:text-purple-900 dark:data-[state=active]:text-[#23272f] transition-all">Headers</TabsTrigger>
                            <TabsTrigger value="body" className="rounded-full px-5 py-2 font-semibold text-purple-900 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-yellow-100 data-[state=active]:shadow-md data-[state=active]:text-purple-900 dark:data-[state=active]:text-[#23272f] transition-all">Body</TabsTrigger>
                            <TabsTrigger value="auth" className="rounded-full px-5 py-2 font-semibold text-purple-900 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-yellow-100 data-[state=active]:shadow-md data-[state=active]:text-purple-900 dark:data-[state=active]:text-[#23272f] transition-all">Auth</TabsTrigger>
                            <TabsTrigger value="scripts" className="rounded-full px-5 py-2 font-semibold text-purple-900 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-yellow-100 data-[state=active]:shadow-md data-[state=active]:text-purple-900 dark:data-[state=active]:text-[#23272f] transition-all flex items-center"><Code className="inline w-4 h-4 mr-1" /> Scripts</TabsTrigger>
                          </TabsList>
                        
                          <div className="p-4">
                            <TabsContent value="params" className="space-y-4 mt-0">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-base font-semibold text-purple-900 dark:text-purple-200">Parameters</Label>
                                  <Button variant="outline" size="sm" onClick={() => openBulkEdit('params')}>
                                    Bulk Edit
                                  </Button>
                                </div>
                                {request.params.map((param, index) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Input
                                      placeholder="Key"
                                      value={param.key}
                                      onChange={(e) => updateParam(index, 'key', e.target.value)}
                                      className="flex-1 bg-background"
                                    />
                                    <Input
                                      placeholder="Value"
                                      value={param.value}
                                      onChange={(e) => updateParam(index, 'value', e.target.value)}
                                      className="flex-1 bg-background"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeParam(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="outline" onClick={addParam} className="w-full">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Parameter
                                </Button>
                              </div>
                            </TabsContent>

                            <TabsContent value="headers" className="space-y-4 mt-0">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-base font-semibold text-purple-900 dark:text-purple-200">Headers</Label>
                                  <Button variant="outline" size="sm" onClick={() => openBulkEdit('headers')}>
                                    Bulk Edit
                                  </Button>
                                </div>
                                {request.headers.map((header, index) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Input
                                      placeholder="Header Key"
                                      value={header.key}
                                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                      className="flex-1 bg-background"
                                    />
                                    <Input
                                      placeholder="Header Value"
                                      value={header.value}
                                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                      className="flex-1 bg-background"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeHeader(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="outline" onClick={addHeader} className="w-full">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Header
                                </Button>
                              </div>
                            </TabsContent>

                            <TabsContent value="body" className="space-y-4 mt-0">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Body Type:</Label>
                                    <Select value={bodyType} onValueChange={setBodyType}>
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="json">JSON</SelectItem>
                                        <SelectItem value="xml">XML</SelectItem>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="form">Form</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        try {
                                          const parsed = JSON.parse(request.body);
                                          const formatted = JSON.stringify(parsed, null, 2);
                                          setRequest(prev => ({ ...prev, body: formatted }));
                                          toast({ title: "JSON formatted successfully" });
                                        } catch (error) {
                                          toast({ title: "Invalid JSON", variant: "destructive" });
                                        }
                                      }}
                                      className="h-8 px-3"
                                      title="Beautify JSON"
                                    >
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Beautify
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRequest(prev => ({ ...prev, body: '' }))}
                                      className="h-8 px-3"
                                      title="Clear body"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Clear
                                    </Button>
                                  </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden min-h-[200px] max-h-[60vh]">
                                  <CodeMirror
                                    value={request.body}
                                    onChange={(value) => setRequest(prev => ({ ...prev, body: value }))}
                                    extensions={[json()]}
                                    theme={oneDark}
                                    height="100%"
                                    minHeight="200px"
                                    maxHeight="60vh"
                                    placeholder="Enter JSON request body..."
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="auth" className="space-y-4 mt-0">
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Authentication Type</Label>
                                  <Select value={request.auth.type} onValueChange={(value: any) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, type: value } }))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Auth</SelectItem>
                                      <SelectItem value="bearer">Bearer Token</SelectItem>
                                      <SelectItem value="basic">Basic Auth</SelectItem>
                                      <SelectItem value="api-key">API Key</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {request.auth.type === 'bearer' && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Bearer Token</Label>
                                    <Input
                                      placeholder="Enter bearer token"
                                      value={request.auth.token || ''}
                                      onChange={(e) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, token: e.target.value } }))}
                                      className="bg-background"
                                    />
                                  </div>
                                )}

                                {request.auth.type === 'basic' && (
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Username</Label>
                                      <Input
                                        placeholder="Enter username"
                                        value={request.auth.username || ''}
                                        onChange={(e) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, username: e.target.value } }))}
                                        className="bg-background"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Password</Label>
                                      <Input
                                        type="password"
                                        placeholder="Enter password"
                                        value={request.auth.password || ''}
                                        onChange={(e) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, password: e.target.value } }))}
                                        className="bg-background"
                                      />
                                    </div>
                                  </div>
                                )}

                                {request.auth.type === 'api-key' && (
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Key Name</Label>
                                      <Input
                                        placeholder="e.g., X-API-KEY"
                                        value={request.auth.keyName || ''}
                                        onChange={(e) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, keyName: e.target.value } }))}
                                        className="bg-background"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Key Value</Label>
                                      <Input
                                        placeholder="Enter API key"
                                        value={request.auth.keyValue || ''}
                                        onChange={(e) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, keyValue: e.target.value } }))}
                                        className="bg-background"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-purple-900 dark:text-purple-200">Add To</Label>
                                      <Select value={request.auth.keyLocation || 'header'} onValueChange={(value: any) => setRequest(prev => ({ ...prev, auth: { ...prev.auth, keyLocation: value } }))}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="header">Header</SelectItem>
                                          <SelectItem value="query">Query Params</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="scripts" className="space-y-6 mt-0">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-semibold mb-1 flex items-center">
                                    <Code className="w-4 h-4 mr-2" /> Pre-request Script
                                  </Label>
                                  <Textarea
                                    value={request.preRequestScript || ''}
                                    onChange={e => setRequest(prev => ({ ...prev, preRequestScript: e.target.value }))}
                                    rows={6}
                                    className="font-mono"
                                    placeholder="// Write JavaScript to run before the request is sent..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold mb-1 flex items-center">
                                    <Code className="w-4 h-4 mr-2" /> Post-response Script
                                  </Label>
                                  <Textarea
                                    value={request.postRequestScript || ''}
                                    onChange={e => setRequest(prev => ({ ...prev, postRequestScript: e.target.value }))}
                                    rows={6}
                                    className="font-mono"
                                    placeholder="// Write JavaScript to run after the response is received..."
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Scripts run in a sandboxed environment. You can use <code>context</code> to access environment variables, request, and response data.
                                </div>
                              </div>
                            </TabsContent>
                          </div>
                        </Tabs>
                        
                        {/* Proxy Settings */}
                        {showAdvanced && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                            <h4 className="text-sm font-medium mb-3">Proxy Settings</h4>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="proxy-enabled"
                                  checked={proxyEnabled}
                                  onChange={(e) => setProxyEnabled(e.target.checked)}
                                  className="rounded"
                                />
                                <Label htmlFor="proxy-enabled">Enable Proxy</Label>
                              </div>
                              {proxyEnabled && (
                                <div className="space-y-2">
                                  <Label>Proxy URL</Label>
                                  <Input
                                    placeholder="https://proxy.example.com:8080"
                                    value={proxyUrl}
                                    onChange={(e) => setProxyUrl(e.target.value)}
                                    className="bg-background"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
                
                {/* Resizable Handle */}
                <ResizableHandle />
                
                {/* Response Panel */}
                <ResizablePanel defaultSize={50} minSize={25} maxSize={75}>
                  <div className="h-full p-2 sm:p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Response Section */}
                      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-yellow-900/10 rounded-2xl border border-purple-200 dark:border-purple-700 shadow-md">
                        <div className="border-b border-purple-200 dark:border-purple-700 p-4 rounded-t-2xl bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-yellow-900/20">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 tracking-wide">Response</h3>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResponseMaximized(true)}
                                className="h-8 px-3"
                                title="Maximize editor"
                                disabled={!response}
                              >
                                <Maximize2 className="w-4 h-4 mr-2" />
                                Maximize
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  try {
                                    const formatted = JSON.stringify(JSON.parse(response?.data || '{}'), null, 2);
                                    setResponse(prev => prev ? { ...prev, data: formatted } : null);
                                    toast({ title: "Response beautified" });
                                  } catch (e) {
                                    toast({ title: "Cannot beautify", description: "Response is not valid JSON", variant: "destructive" });
                                  }
                                }}
                                className="h-8 px-3"
                                title="Beautify JSON"
                                disabled={!response}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Beautify
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(response?.data || '');
                                  toast({ title: "Response copied to clipboard" });
                                }}
                                className="h-8 px-3"
                                title="Copy response"
                                disabled={!response}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={downloadResponse}
                                className="h-8 px-3"
                                title="Download response"
                                disabled={!response}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {!response ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                                  <Play className="w-8 h-8" />
                                </div>
                                <p>Click Send to get a response</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <Badge variant={response.status === 0 ? "secondary" : response.status < 400 ? "default" : "destructive"}>
                                    {response.status === 0 ? "FAILED" : response.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {response.time}ms • {response.size} bytes
                                  </span>
                                </div>
                              </div>
                              {response && (
                                <div className="space-y-3">
                                  <h4 className="text-base font-semibold">Response Headers</h4>
                                  <div className="max-h-32 overflow-y-auto grid grid-cols-1 gap-2">
                                    {Object.entries(response.headers || {}).map(([key, value]) => (
                                      <div key={key} className="flex gap-2 text-xs bg-muted/30 rounded p-2">
                                        <span className="font-mono font-semibold w-40 flex-shrink-0">{key}</span>
                                        <span className="font-mono break-all">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="border rounded-lg overflow-hidden min-h-[200px] max-h-[60vh]">
                                <CodeMirror
                                  value={response.data}
                                  extensions={[json()]}
                                  theme={oneDark}
                                  height="100%"
                                  minHeight="200px"
                                  maxHeight="60vh"
                                  editable={false}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
            </div></div>
        </main>

        {/* Import cURL Dialog */}
        <Dialog open={showCurlImport} onOpenChange={setShowCurlImport}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import from cURL</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Paste a cURL command from Swagger, Postman, or any other tool. We'll extract the method, URL, headers, body, and query parameters.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">cURL Command</Label>
                <Textarea
                  placeholder={`curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer your-token' \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`}
                  value={curlCommand}
                  onChange={(e) => setCurlCommand(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Supported Features:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• HTTP methods: GET, POST, PUT, DELETE, PATCH, etc.</li>
                  <li>• Headers: -H or --header flags</li>
                  <li>• Request body: -d, --data, --data-raw flags</li>
                  <li>• Query parameters: automatically extracted from URL</li>
                  <li>• Multi-line commands with line continuations (\)</li>
                  <li>• Quoted values with proper escaping</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={importFromCurl} disabled={!curlCommand.trim()}>
                  <Download className="w-4 h-4 mr-2" />
                  Import Request
                </Button>
                <Button variant="outline" onClick={() => setShowCurlImport(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <HistoryDialog
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={requestHistory.map(item => ({
            id: item.id,
            method: item.request.method,
            url: item.request.url,
            timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : new Date(item.timestamp).toISOString(),
            status: item.response.status,
            duration: item.response.time,
          }))}
          onReRunRequest={(historyItem) => {
            const originalItem = requestHistory.find(h => h.id === historyItem.id);
            if (originalItem) {
              useHistoryItem(originalItem);
            }
          }}
          onDeleteHistoryItem={deleteHistoryItem}
          onDeleteMultipleHistoryItems={deleteSelectedHistory}
          onClearAllHistory={deleteAllHistory}
        />

        {/* Environments Dialog */}
        <Dialog open={showEnvironments} onOpenChange={setShowEnvironments}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Environments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {environments.map((env) => (
                <div key={env.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${env.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium">{env.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveEnvironment(env.id)}
                      disabled={env.isActive}
                    >
                      {env.isActive ? 'Active' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEnvironment(env.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Import from SpecCraft Dialog */}
        <Dialog open={showImportFromSpecDialog} onOpenChange={(open) => {
          setShowImportFromSpecDialog(open);
          // Clean up import state when dialog is closed
          if (!open) {
            setPendingImportRequest(null);
            setBulkImportRequests(null);
            setSelectedFolder(undefined);
            setNewFolderName("");
            setShowNewFolderInput(false);
          }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {bulkImportRequests ? `Save ${bulkImportRequests.length} Requests` : "Save Imported Request"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {bulkImportRequests 
                  ? `Choose where to save ${bulkImportRequests.length} imported requests`
                  : "Choose where to save this imported request"
                }
              </p>
            </DialogHeader>
            <div className="space-y-4">
              {pendingImportRequest && !bulkImportRequests && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{pendingImportRequest.method}</Badge>
                    <span className="text-sm font-medium">{pendingImportRequest.url}</span>
                  </div>
                  {pendingImportRequest.body && (
                    <div className="text-xs text-muted-foreground">
                      Has request body: {pendingImportRequest.body.length > 100 ? `${pendingImportRequest.body.substring(0, 100)}...` : pendingImportRequest.body}
                    </div>
                  )}
                </div>
              )}
              
              {bulkImportRequests && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{bulkImportRequests.length} requests</Badge>
                    <span className="text-sm font-medium">Ready to import</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bulkImportRequests.slice(0, 3).map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-xs">{req.method}</span>
                        <span className="truncate">{req.url}</span>
                      </div>
                    ))}
                    {bulkImportRequests.length > 3 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ... and {bulkImportRequests.length - 3} more requests
                      </div>
                    )}
                    <div className="text-xs text-blue-600 mt-2 font-medium">
                      📁 Organized by resource folders
                    </div>
                  </div>
                </div>
              )}
              
              {/* Default Collection Option */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Save Options</Label>
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer bg-blue-50 dark:bg-blue-900/20"
                    onClick={saveToDefaultCollection}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Imported Requests (Default)</p>
                        <p className="text-xs text-muted-foreground">
                          Save to default collection
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-3">
                      Quick Save
                    </Button>
                  </div>
                </div>
              </div>

              {/* Existing Collections */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Existing Collections</Label>
                {collections.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="border rounded-lg p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Folder className="w-4 h-4 text-violet-600" />
                            <div>
                              <p className="text-sm font-medium">{collection.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {collection.requests.length} request{collection.requests.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3"
                            onClick={() => saveToCollection(collection.id)}
                          >
                            Save to Collection
                          </Button>
                        </div>
                        
                        {/* Folder Options */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Save to folder:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                            >
                              {showNewFolderInput ? 'Cancel' : 'New Folder'}
                            </Button>
                          </div>
                          
                          {/* Existing Folders */}
                          {(() => {
                            const folders = collection.requests.filter(r => r.method === 'FOLDER');
                            return folders.length > 0 ? (
                              <div className="space-y-1">
                                {folders.map(folder => (
                                  <div
                                    key={folder.id}
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                  >
                                    <span className="flex items-center gap-1">
                                      <Folder className="w-3 h-3" />
                                      {folder.name}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => saveToCollection(collection.id, folder.id)}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : null;
                          })()}
                          
                          {/* New Folder Input */}
                          {showNewFolderInput && (
                            <div className="flex items-center gap-2">
                              <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="h-8 text-xs"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => createFolderAndSave(collection.id)}
                                disabled={!newFolderName.trim()}
                              >
                                Create & Save
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No collections yet</p>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportFromSpecDialog(false);
                      setShowNewCollectionDialog(true);
                    }}
                    className="w-full"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create New Collection
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportFromSpecDialog(false);
                  setShowNewCollectionDialog(true);
                }}
                className="flex-1"
              >
                Skip
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Request Maximize Dialog */}
        <Dialog open={requestMaximized} onOpenChange={setRequestMaximized}>
          <DialogContent className="max-w-7xl w-full h-[95vh] max-h-[95vh] p-0">
            <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
              <DialogTitle className="text-emerald-800 dark:text-emerald-300">Request Editor - Fullscreen</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-6 overflow-y-auto">
                <div className="border rounded-lg overflow-hidden min-h-[400px] max-h-[80vh]">
                  <CodeMirror
                    value={request.body}
                    onChange={(value) => setRequest(prev => ({ ...prev, body: value }))}
                    extensions={[json()]}
                    theme={oneDark}
                    height="100%"
                    minHeight="400px"
                    maxHeight="80vh"
                    className="text-base"
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Response Maximize Dialog */}
        <Dialog open={responseMaximized} onOpenChange={setResponseMaximized}>
          <DialogContent className="max-w-7xl w-full h-[95vh] max-h-[95vh] p-0">
            <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <DialogTitle className="text-purple-800 dark:text-purple-300">Response Viewer - Fullscreen</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-6 overflow-y-auto">
                <div className="border rounded-lg overflow-hidden min-h-[400px] max-h-[80vh]">
                  <CodeMirror
                    value={response?.data || ''}
                    extensions={[json()]}
                    theme={oneDark}
                    height="100%"
                    minHeight="400px"
                    maxHeight="80vh"
                    editable={false}
                    className="text-base"
                  />
                </div>
                {response && (
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold">Response Headers</h4>
                    <div className="max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                      {Object.entries(response.headers || {}).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs bg-muted/30 rounded p-2">
                          <span className="font-mono font-semibold w-40 flex-shrink-0">{key}</span>
                          <span className="font-mono break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Collection Dialog */}
        <Dialog open={showNewCollectionDialog} onOpenChange={(open) => {
          setShowNewCollectionDialog(open);
          // Clean up collection name when dialog is closed
          if (!open) {
            setNewCollectionName("");
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-semibold">Create New Collection</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create a new collection to organize your API requests
              </p>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-collection-name" className="text-sm font-medium">
                  Collection Name
                </Label>
                <Input
                  id="new-collection-name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g., User Management, Payment APIs"
                  autoFocus
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name for your collection
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    if (newCollectionName.trim()) {
                      createCollection();
                      setShowNewCollectionDialog(false);
                    } else {
                      toast({
                        title: "Collection name required",
                        description: "Please enter a name for your collection",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="flex-1"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewCollectionDialog(false);
                    setNewCollectionName("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save to Collection Dialog */}
        <Dialog open={showSaveToCollectionDialog} onOpenChange={(open) => {
          setShowSaveToCollectionDialog(open);
          // Clean up bulk import state when dialog is closed
          if (!open) {
            setBulkImportRequests(null);
            setPendingSaveCollectionId(null);
            setPendingSaveFolderId(null);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-semibold">
                {bulkImportRequests ? `Save ${bulkImportRequests.length} Requests` : "Save Request to Collection"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {bulkImportRequests 
                  ? `Save ${bulkImportRequests.length} imported requests to an existing collection or create a new one`
                  : "Save your current request to an existing collection or create a new one"
                }
              </p>
            </DialogHeader>
            <div className="space-y-6 py-2">
              {!bulkImportRequests && (
                <div className="space-y-2">
                  <Label htmlFor="request-name" className="text-sm font-medium">
                    Request Name
                  </Label>
                  <Input
                    id="request-name"
                    value={request.name || request.url || ""}
                    onChange={(e) => setRequest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a name for this request"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Give your request a descriptive name
                  </p>
                </div>
              )}
              
              {bulkImportRequests && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{bulkImportRequests.length} requests</Badge>
                    <span className="text-sm font-medium">Ready to import</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bulkImportRequests.slice(0, 3).map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-xs">{req.method}</span>
                        <span className="truncate">{req.url}</span>
                      </div>
                    ))}
                    {bulkImportRequests.length > 3 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ... and {bulkImportRequests.length - 3} more requests
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Collection</Label>
                {collections.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                        onClick={() => {
                          if (bulkImportRequests) {
                            // Set pending save collection and show folder options
                            setPendingSaveCollectionId(collection.id);
                            setPendingSaveFolderId(null);
                            setShowSaveToCollectionDialog(false);
                            // Show the import dialog with folder options
                            setShowImportFromSpecDialog(true);
                          } else {
                            saveCurrentRequestToCollection(collection.id, request.name || request.url);
                            setShowSaveToCollectionDialog(false);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="w-4 h-4 text-violet-600" />
                          <div>
                            <p className="text-sm font-medium">{collection.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {collection.requests.length} request{collection.requests.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-3">
                          {bulkImportRequests ? "Select Collection" : "Save to Collection"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No collections yet</p>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveToCollectionDialog(false);
                      setShowNewCollectionDialog(true);
                    }}
                    className="w-full"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create New Collection
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Request Name Dialog */}
        <Dialog open={showEditRequestDialog} onOpenChange={setShowEditRequestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-semibold">Edit Request Name</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Update the name of your request in the collection
              </p>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-request-name" className="text-sm font-medium">
                  Request Name
                </Label>
                <Input
                  id="edit-request-name"
                  value={editingRequest?.currentName || ""}
                  onChange={(e) => setEditingRequest(prev => prev ? { ...prev, currentName: e.target.value } : null)}
                  placeholder="Enter a new name for this request"
                  autoFocus
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name for your request
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    if (editingRequest) {
                      updateRequestName(editingRequest.collectionId, editingRequest.requestId, editingRequest.currentName);
                      setShowEditRequestDialog(false);
                      setEditingRequest(null);
                    }
                  }}
                  disabled={!editingRequest?.currentName.trim()}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Name
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditRequestDialog(false);
                    setEditingRequest(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog - Simplified */}
        <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-semibold">Delete {deleteDialog.type}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete "{deleteDialog.itemName}"? This action cannot be undone.
              </p>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteDialog.type === 'collection') {
                    confirmDeleteCollection();
                  }
                  setDeleteDialog({ isOpen: false, type: 'collection', itemId: '', itemName: '' });
                }}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialog({ isOpen: false, type: 'collection', itemId: '', itemName: '' })}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={renameDialog.isOpen} onOpenChange={(open) => setRenameDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-semibold">Rename Item</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Enter a new name for this item
              </p>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <Label htmlFor="rename-item-name" className="text-sm font-medium">
                  New Name
                </Label>
                <Input
                  id="rename-item-name"
                  value={renameDialog.currentName}
                  onChange={(e) => setRenameDialog(prev => ({ ...prev, currentName: e.target.value }))}
                  placeholder="Enter new name"
                  autoFocus
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    if (renameDialog.currentName.trim()) {
                      // Find if it's a collection or request
                      const collection = collections.find(c => c.id === renameDialog.itemId);
                      if (collection) {
                        // Rename collection
                        const updatedCollection = { ...collection, name: renameDialog.currentName };
                        storage.saveCollection(updatedCollection);
                        setCollections(prev => prev.map(c => c.id === renameDialog.itemId ? updatedCollection : c));
                        toast({
                          title: "Collection renamed",
                          description: `Collection renamed to "${renameDialog.currentName}"`
                        });
                      } else {
                        // Find the collection containing this request
                        const collection = collections.find(c => c.requests.some(r => r.id === renameDialog.itemId));
                        if (collection && renameDialog.itemId) {
                          updateRequestName(collection.id, renameDialog.itemId, renameDialog.currentName);
                        }
                      }
                      setRenameDialog({ isOpen: false, itemId: '', currentName: '', itemType: '' });
                    }
                  }}
                  disabled={!renameDialog.currentName.trim()}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Rename
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setRenameDialog({ isOpen: false, itemId: '', currentName: '', itemType: '' })}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Move Dialog */}
        <Dialog open={moveDialog.isOpen} onOpenChange={(open) => setMoveDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-semibold">Move Request</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select a collection to move "{moveDialog.itemName}" to
              </p>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Target Collection</Label>
                {collections.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                        onClick={() => {
                          moveRequest(moveDialog.itemId, collection.id, 'collection');
                          setMoveDialog({ isOpen: false, itemId: '', itemName: '', itemType: '' });
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="w-4 h-4 text-violet-600" />
                          <div>
                            <p className="text-sm font-medium">{collection.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {collection.requests.length} request{collection.requests.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-3">
                          Move Here
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No collections available</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMoveDialog({ isOpen: false, itemId: '', itemName: '', itemType: '' })}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <BulkEditDialog
          isOpen={bulkEditDialog.isOpen}
          onClose={() => setBulkEditDialog(prev => ({ ...prev, isOpen: false }))}
          type={bulkEditDialog.type}
          initialText={bulkEditDialog.initialText}
          onApply={handleBulkEditApply}
        />
      </>
    );
}
