import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Download, Code, Eye, Play, FileText, Zap, Maximize, Minimize, Folder, FolderPlus } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { storage } from '@/lib/storage';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import * as yaml from 'js-yaml';
import { Label } from '@/components/ui/label';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useSpecCraftTabsStore } from '@/lib/toolTabsStore';
import { ToolTabs } from '@/components/ui/ToolTabs';

interface Collection {
  id: string;
  name: string;
  requests: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface ParsedEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: any[];
  requestBody?: any;
  responses: any;
  security?: any;
}

export default function SpecCraft() {
  // Multi-tab state
  const { tabs, activeTabId, setTabs, setActiveTabId } = useSpecCraftTabsStore();
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Migrate old single spec to first tab if present
  useEffect(() => {
    const savedSpec = storage.getToolData('spec-craft');
    if (savedSpec?.spec && tabs.length === 1 && !tabs[0].state.specYaml) {
      const newTabs = [...tabs];
      newTabs[0].state.specYaml = savedSpec.spec;
      setTabs(newTabs);
    }
  }, []);

  // Persist tabs and active tab
  useEffect(() => {
    localStorage.setItem('devtoolnest-speccraft-tabs', JSON.stringify(tabs));
    localStorage.setItem('devtoolnest-speccraft-active-tab', activeTabId);
  }, [tabs, activeTabId]);

  // All state is now per-tab
  const [specObj, setSpecObj] = useState<any>(null);
  useEffect(() => {
    try {
      const obj = yaml.load(activeTab.state.specYaml);
      setSpecObj(obj);
    } catch (e) {
      setSpecObj(null);
    }
  }, [activeTab.state.specYaml]);

  const [isValidSpec, setIsValidSpec] = useState(true);
  const [parseError, setParseError] = useState<string>('');
  useEffect(() => {
    try {
      const parsed = yaml.load(activeTab.state.specYaml) as any;
      setSpecObj(parsed);
      setIsValidSpec(true);
      setParseError('');
    } catch (error) {
      setIsValidSpec(false);
      setParseError((error as Error).message);
      setSpecObj(null);
    }
  }, [activeTab.state.specYaml]);

  // Theme per tab
  const theme = activeTab.state.theme;
  const setTheme = (newTheme: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, state: { ...tab.state, theme: newTheme } } : tab
    );
    setTabs(newTabs);
  };

  // Split position per tab
  const splitPosition = activeTab.state.splitPosition;
  const setSplitPosition = (pos: number) => {
    const newTabs = tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, state: { ...tab.state, splitPosition: pos } } : tab
    );
    setTabs(newTabs);
  };

  // YAML per tab
  const setSpecYaml = (yaml: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, state: { ...tab.state, specYaml: yaml } } : tab
    );
    setTabs(newTabs);
  };

  // Tab management handlers
  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    setTabs([
      ...tabs,
      { id: newId, title: `Tab ${tabs.length + 1}`, state: { specYaml: '', theme: 'github', splitPosition: 50 } },
    ]);
    setActiveTabId(newId);
  };
  const closeTab = (id: string) => {
    let idx = tabs.findIndex(t => t.id === id);
    let newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      newTabs = [{ id: 'tab-1', title: 'Tab 1', state: { specYaml: '', theme: 'github', splitPosition: 50 } }];
    }
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[Math.max(0, idx - 1)].id);
    }
  };
  const renameTab = (id: string, title: string) => {
    setTabs(tabs.map(tab => tab.id === id ? { ...tab, title } : tab));
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSingleCurlDialog, setShowSingleCurlDialog] = useState(false);
  const [showBulkCurlDialog, setShowBulkCurlDialog] = useState(false);
  const [singleCurlCommand, setSingleCurlCommand] = useState('');
  const [bulkCurlCommands, setBulkCurlCommands] = useState<string[]>([]);
  const [currentEndpoint, setCurrentEndpoint] = useState<ParsedEndpoint | null>(null);
  const [selectedServer, setSelectedServer] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // 1. Add state for the dialog and imported request
  const [showSaveToCollectionDialog, setShowSaveToCollectionDialog] = useState(false);
  const [importedRequest, setImportedRequest] = useState(null);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkImportCollection, setBulkImportCollection] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  // Font size state for YAML editor and API preview
  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem('spec-craft-font-size');
    return stored ? parseInt(stored) : 14;
  });
  useEffect(() => {
    localStorage.setItem('spec-craft-font-size', String(fontSize));
  }, [fontSize]);
  const handleFontSizeChange = (delta: number) => {
    setFontSize(f => Math.max(10, Math.min(32, f + delta)));
  };

  // Universal font size from CSS variable
  const getUniversalFontSize = () => {
    if (typeof window !== 'undefined') {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--app-font-size');
      return val ? parseInt(val) : 16;
    }
    return 16;
  };
  const [universalFontSize, setUniversalFontSize] = useState(getUniversalFontSize());
  useEffect(() => {
    const handleFontSizeChange = () => {
      setUniversalFontSize(getUniversalFontSize());
    };
    window.addEventListener('storage', handleFontSizeChange);
    // Also listen for direct changes (e.g., via setProperty)
    const observer = new MutationObserver(handleFontSizeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => {
      window.removeEventListener('storage', handleFontSizeChange);
      observer.disconnect();
    };
  }, []);

  // Local font size state for YAML editor and API preview
  const [localFontSize, setLocalFontSize] = useState(() => {
    const stored = localStorage.getItem('spec-craft-local-font-size');
    return stored ? parseInt(stored) : 14;
  });
  useEffect(() => {
    localStorage.setItem('spec-craft-local-font-size', String(localFontSize));
  }, [localFontSize]);
  const handleLocalFontSizeChange = (delta: number) => {
    setLocalFontSize(f => Math.max(10, Math.min(32, f + delta)));
  };

  // Handle drag for resizable split
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.split-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Limit between 20% and 80%
    const clampedPosition = Math.max(20, Math.min(80, newPosition));
    setSplitPosition(clampedPosition);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768; // Changed from 1024 to 768
      setIsMobile(newIsMobile);
      
      // Force re-render of AceEditor on resize
      if ((window as any).aceEditor) {
        setTimeout(() => {
          (window as any).aceEditor.resize();
        }, 100);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parse spec when it changes
  useEffect(() => {
    try {
      const parsed = yaml.load(activeTab.state.specYaml) as any;
      setSpecObj(parsed);
      setIsValidSpec(true);
      setParseError('');
    } catch (error) {
      setIsValidSpec(false);
      setParseError((error as Error).message);
      setSpecObj(null);
    }
  }, [activeTab.state.specYaml]);

  // Initialize server selection
  useEffect(() => {
    if (specObj?.servers?.[0]?.url) {
      setSelectedServer(specObj.servers[0].url);
    }
  }, [specObj]);

  // Save spec to storage when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      storage.saveToolData('spec-craft', { spec: activeTab.state.specYaml });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [activeTab.state.specYaml]);

  // Load saved spec from storage
  useEffect(() => {
    const savedSpec = storage.getToolData('spec-craft');
    if (savedSpec?.spec) {
      setSpecYaml(savedSpec.spec);
    }
  }, []);

  const handleSpecChange = useCallback((newSpec: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, state: { ...tab.state, specYaml: newSpec } } : tab
    );
    setTabs(newTabs);
  }, [tabs, activeTabId, setTabs]);

  // Extract endpoints from spec
  const extractEndpointsFromSpec = useCallback((specObj: any): ParsedEndpoint[] => {
    let endpoints: ParsedEndpoint[] = [];
    
    if (specObj?.paths) {
      Object.entries(specObj.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          if (typeof details === 'object' && details !== null && method !== 'parameters') {
            endpoints = [...endpoints, {
              method: method.toUpperCase(),
              path,
              summary: details.summary || '',
              description: details.description || '',
              tags: details.tags || [],
              parameters: details.parameters || [],
              requestBody: details.requestBody,
              responses: details.responses || {},
              security: details.security
            }];
          }
        });
      });
    }
    
    return endpoints;
  }, []);

  // Generate example from schema
  const generateExampleFromSchema = useCallback((schema: any): any => {
    // Handle $ref references
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/');
      let refSchema = specObj;
      for (const segment of refPath) {
        refSchema = refSchema?.[segment];
      }
      if (refSchema) {
        return generateExampleFromSchema(refSchema);
      }
    }

    // Handle direct examples
    if (schema.example !== undefined) {
      return schema.example;
    }

    // Handle default values
    if (schema.default !== undefined) {
      return schema.default;
    }

    // Handle different schema types
    if (schema.type === 'object' && schema.properties) {
      const example: any = {};
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        const value = generateExampleFromSchema(prop);
        if (value !== null) {
          example[key] = value;
        }
      });
      return example;
    } else if (schema.type === 'array') {
      if (schema.items) {
        const itemExample = generateExampleFromSchema(schema.items);
        return itemExample !== null ? [itemExample] : [];
      }
      return [];
    } else if (schema.type === 'string') {
      if (schema.enum) {
        return schema.enum[0];
      }
      switch (schema.format) {
        case 'email':
          return 'user@example.com';
        case 'uri':
          return 'https://example.com';
        case 'date':
          return '2023-01-01';
        case 'date-time':
          return '2023-01-01T00:00:00Z';
        case 'uuid':
          return '550e8400-e29b-41d4-a716-446655440000';
        case 'password':
          return 'password123';
        default:
          return 'string_value';
      }
    } else if (schema.type === 'integer') {
      return schema.minimum || 0;
    } else if (schema.type === 'number') {
      return schema.minimum || 0.0;
    } else if (schema.type === 'boolean') {
      return true;
    }

    // Handle oneOf/anyOf/allOf
    if (schema.oneOf && schema.oneOf.length > 0) {
      return generateExampleFromSchema(schema.oneOf[0]);
    }
    if (schema.anyOf && schema.anyOf.length > 0) {
      return generateExampleFromSchema(schema.anyOf[0]);
    }
    if (schema.allOf && schema.allOf.length > 0) {
      // For allOf, merge all schemas
      const merged = schema.allOf.reduce((acc: any, subSchema: any) => {
        const example = generateExampleFromSchema(subSchema);
        return { ...acc, ...example };
      }, {});
      return merged;
    }

    return null;
  }, [specObj]);

  // Generate detailed cURL command
  const generateDetailedCurl = useCallback((endpoint: ParsedEndpoint, serverUrl?: string, token?: string, headers?: string) => {
    console.log('Generating cURL for endpoint:', endpoint);
    const baseUrl = serverUrl || specObj?.servers?.[0]?.url || 'https://api.example.com';
    const method = endpoint.method;
    let path = endpoint.path;
    
    // Replace path parameters with example values (resolve references)
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        let resolvedParam = param;
        
        // Resolve parameter reference
        if (param.$ref) {
          const refPath = param.$ref.replace('#/', '').split('/');
          let refParam = specObj;
          for (const segment of refPath) {
            refParam = refParam?.[segment];
          }
          if (refParam) {
            resolvedParam = refParam;
          }
        }
        
        if (resolvedParam.in === 'path') {
          const example = resolvedParam.example || resolvedParam.schema?.example || resolvedParam.schema?.default || `{${resolvedParam.name}}`;
          path = path.replace(`{${resolvedParam.name}}`, example);
        }
      });
    }
    
    let curl = `curl -X ${method} "${baseUrl}${path}"`;
    
    // Add authentication header from security requirements
    const globalSecurity = specObj?.security;
    const operationSecurity = endpoint.security || globalSecurity;
    
    if (operationSecurity && operationSecurity.length > 0) {
      const securityScheme = operationSecurity[0];
      const schemeName = Object.keys(securityScheme)[0];
      const scheme = specObj?.components?.securitySchemes?.[schemeName];
      
      if (scheme?.type === 'http' && scheme?.scheme === 'bearer') {
        curl += ` \\\n  -H "Authorization: Bearer ${token || '{your-token}'}"`;
      } else if (scheme?.type === 'apiKey') {
        const headerName = scheme.name || 'X-API-Key';
        if (scheme.in === 'header') {
          curl += ` \\\n  -H "${headerName}: ${token || '{your-api-key}'}"`;
        }
      }
    } else if (token) {
      curl += ` \\\n  -H "Authorization: Bearer ${token}"`;
    }
    
    // Add headers from parameters (resolve references)
    let headerParams: any[] = [];
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        let resolvedParam = param;
        
        // Resolve parameter reference
        if (param.$ref) {
          const refPath = param.$ref.replace('#/', '').split('/');
          let refParam = specObj;
          for (const segment of refPath) {
            refParam = refParam?.[segment];
          }
          if (refParam) {
            resolvedParam = refParam;
          }
        }
        
        if (resolvedParam.in === 'header') {
          headerParams = [...headerParams, resolvedParam];
        }
      });
    }
    
    console.log('Header parameters found:', headerParams);
    headerParams.forEach(param => {
      const example = param.example || param.schema?.example || `{${param.name}}`;
      console.log(`Adding header: ${param.name}: ${example}`);
      curl += ` \\\n  -H "${param.name}: ${example}"`;
    });
    
    // Add standard headers based on request body
    if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
      const contentTypes = Object.keys(endpoint.requestBody.content || {});
      const contentType = contentTypes[0] || 'application/json';
      console.log(`Adding Content-Type header: ${contentType}`);
      curl += ` \\\n  -H "Content-Type: ${contentType}"`;
    }
    
    // Add Accept header
    if (endpoint.responses) {
      const responseTypes = Object.values(endpoint.responses).flatMap(response => 
        response.content ? Object.keys(response.content) : []
      );
      const acceptType = responseTypes[0] || 'application/json';
      curl += ` \\\n  -H "Accept: ${acceptType}"`;
    } else {
      curl += ` \\\n  -H "Accept: application/json"`;
    }
    
    // Add custom headers
    if (headers) {
      headers.split('\n').forEach(header => {
        const [key, value] = header.split(':').map(h => h.trim());
        if (key && value) {
          curl += ` \\\n  -H "${key}: ${value}"`;
        }
      });
    }
    
    // Add query parameters (resolve references)
    let queryParams: any[] = [];
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        let resolvedParam = param;
        
        // Resolve parameter reference
        if (param.$ref) {
          const refPath = param.$ref.replace('#/', '').split('/');
          let refParam = specObj;
          for (const segment of refPath) {
            refParam = refParam?.[segment];
          }
          if (refParam) {
            resolvedParam = refParam;
          }
        }
        
        if (resolvedParam.in === 'query') {
          queryParams = [...queryParams, resolvedParam];
        }
      });
    }
    
    console.log('Query parameters found:', queryParams);
    if (queryParams.length > 0) {
      const queryString = queryParams.map(param => {
        const example = param.example || param.schema?.example || param.schema?.default || `{${param.name}}`;
        console.log(`Adding query param: ${param.name}=${example}`);
        return `${param.name}=${encodeURIComponent(example)}`;
      }).join('&');
      curl = curl.replace(`"${baseUrl}${path}"`, `"${baseUrl}${path}?${queryString}"`);
    }
    
    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
      console.log('Processing request body for:', method, endpoint.path);
      console.log('Request body content:', endpoint.requestBody.content);
      
      // Try different content types
      const contentTypes = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'];
      let bodyContent = null;
      let selectedContentType = null;
      
      for (const contentType of contentTypes) {
        const content = endpoint.requestBody.content?.[contentType];
        if (content) {
          bodyContent = content;
          selectedContentType = contentType;
          console.log(`Found content type: ${contentType}`);
          break;
        }
      }
      
      if (bodyContent) {
        let example = bodyContent.examples ? Object.values(bodyContent.examples)[0]?.value : bodyContent.example;
        console.log('Direct example found:', example);
        
        // Generate example from schema if no example exists
        if (!example && bodyContent.schema) {
          console.log('Generating example from schema:', bodyContent.schema);
          example = generateExampleFromSchema(bodyContent.schema);
          console.log('Generated example:', example);
        }
        
        if (example) {
          if (selectedContentType === 'application/json') {
            const jsonData = JSON.stringify(example, null, 2);
            console.log('Adding JSON body:', jsonData);
            // Format JSON with proper indentation for cURL
            const indentedJson = jsonData.split('\n').map(line => `  ${line}`).join('\n');
            curl += ` \\\n  -d '${jsonData}'`;
          } else if (selectedContentType === 'application/x-www-form-urlencoded') {
            // Convert to form data
            const formData = Object.entries(example).map(([key, value]) => 
              `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
            ).join('&');
            console.log('Adding form data:', formData);
            curl += ` \\\n  -d '${formData}'`;
          } else {
            curl += ` \\\n  -d '${JSON.stringify(example, null, 2)}'`;
          }
        } else {
          console.log('No example generated for request body');
        }
      } else {
        console.log('No body content found for any supported content type');
      }
    }
    
    return curl;
  }, [specObj, generateExampleFromSchema]);

  // Handle single cURL generation
  const handleGenerateCurl = useCallback((endpoint: ParsedEndpoint) => {
    const curl = generateDetailedCurl(endpoint, selectedServer, authToken, customHeaders);
    setSingleCurlCommand(curl);
    setCurrentEndpoint(endpoint);
    setShowSingleCurlDialog(true);
  }, [generateDetailedCurl, selectedServer, authToken, customHeaders]);

  // Handle bulk cURL generation
  const handleGenerateBulkCurl = useCallback(() => {
    if (!specObj?.paths) return;
    
    const endpoints = extractEndpointsFromSpec(specObj);
    // Group endpoints by first tag (or 'Untagged')
    const grouped: Record<string, ParsedEndpoint[]> = {};
    endpoints.forEach(endpoint => {
      const tag = endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags[0] : 'Untagged';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag] = [...grouped[tag], endpoint];
    });
    // Generate cURL commands grouped by tag
    let commands: string[] = [];
    Object.entries(grouped).forEach(([tag, endpoints]) => {
      commands = [...commands, `# --- ${tag} ---`];
      endpoints.forEach(endpoint => {
        commands = [...commands, generateDetailedCurl(endpoint, selectedServer, authToken, customHeaders)];
      });
      commands = [...commands, ''];
    });
    setBulkCurlCommands(commands);
    setShowBulkCurlDialog(true);
  }, [specObj, extractEndpointsFromSpec, generateDetailedCurl, selectedServer, authToken, customHeaders]);

  // Convert to ReqNest format
  const convertToReqNestFormat = useCallback((endpoint: ParsedEndpoint, serverUrl?: string) => {
    const baseUrl = serverUrl || specObj?.servers?.[0]?.url || 'https://api.example.com';
    let path = endpoint.path;
    
    // Replace path parameters
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        if (param.in === 'path') {
          const example = param.example || param.schema?.example || `{${param.name}}`;
          path = path.replace(`{${param.name}}`, example);
        }
      });
    }
    
    // Start with empty headers array - we'll populate from spec
    let headers: { key: string; value: string }[] = [];
    
    // Add headers from endpoint parameters (this includes Authorization, etc.)
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        let resolvedParam = param;
        
        // Resolve parameter reference
        if (param.$ref) {
          const refPath = param.$ref.replace('#/', '').split('/');
          let refParam = specObj;
          for (const segment of refPath) {
            refParam = refParam?.[segment];
          }
          if (refParam) {
            resolvedParam = refParam;
          }
        }
        
        if (resolvedParam.in === 'header') {
          const example = resolvedParam.example || resolvedParam.schema?.example || `{${resolvedParam.name}}`;
          // Replace placeholder with actual auth token if it's Authorization header
          let value = example;
          if (resolvedParam.name.toLowerCase() === 'authorization' && authToken) {
            value = `Bearer ${authToken}`;
          }
          headers = [...headers, { key: resolvedParam.name, value }];
        }
      });
    }
    
    // Add Content-Type header based on request body if not already present
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
      const contentTypes = Object.keys(endpoint.requestBody.content || {});
      const contentType = contentTypes[0] || 'application/json';
      const existingContentType = headers.find(h => h.key.toLowerCase() === 'content-type');
      if (!existingContentType) {
        headers = [...headers, { key: 'Content-Type', value: contentType }];
      }
    }
    
    // Add Accept header if not already present
    const existingAccept = headers.find(h => h.key.toLowerCase() === 'accept');
    if (!existingAccept) {
      if (endpoint.responses) {
        const responseTypes = Object.values(endpoint.responses).flatMap(response => 
          response.content ? Object.keys(response.content) : []
        );
        const acceptType = responseTypes[0] || 'application/json';
        headers = [...headers, { key: 'Accept', value: acceptType }];
      } else {
        headers = [...headers, { key: 'Accept', value: 'application/json' }];
      }
    }
    
    // Add custom headers from user input
    if (customHeaders) {
      customHeaders.split('\n').forEach(header => {
        const [key, value] = header.split(':').map(h => h.trim());
        if (key && value) {
          // Check if header already exists, if so, update it
          const existingHeader = headers.find(h => h.key.toLowerCase() === key.toLowerCase());
          if (existingHeader) {
            existingHeader.value = value;
          } else {
            headers = [...headers, { key, value }];
          }
        }
      });
    }
    
    let body = '';
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
      // Try different content types
      const contentTypes = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'];
      let bodyContent = null;
      let selectedContentType = null;
      
      for (const contentType of contentTypes) {
        const content = endpoint.requestBody.content?.[contentType];
        if (content) {
          bodyContent = content;
          selectedContentType = contentType;
          break;
        }
      }
      
      if (bodyContent) {
        let example = bodyContent.examples ? Object.values(bodyContent.examples)[0]?.value : bodyContent.example;
        
        // Generate example from schema if no example exists
        if (!example && bodyContent.schema) {
          example = generateExampleFromSchema(bodyContent.schema);
        }
        
        if (example) {
          if (selectedContentType === 'application/json') {
            body = JSON.stringify(example, null, 2);
          } else if (selectedContentType === 'application/x-www-form-urlencoded') {
            // Convert to form data
            body = Object.entries(example).map(([key, value]) => 
              `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
            ).join('&');
          } else if (selectedContentType === 'multipart/form-data') {
            // For multipart/form-data, we'll use JSON format for ReqNest
            // The actual multipart handling will be done by ReqNest when sending
            body = JSON.stringify(example, null, 2);
          } else {
            body = JSON.stringify(example, null, 2);
          }
        }
      }
    }
    
    const reqNestData = {
      id: `${endpoint.method.toLowerCase()}-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: `${endpoint.method} ${path}`,
      method: endpoint.method,
      url: `${baseUrl}${path}`,
      headers,
      body,
      auth: { type: 'none' },
      params: endpoint.parameters?.filter(p => p.in === 'query').map(p => ({
        key: p.name,
        value: p.example || p.schema?.example || `{${p.name}}`
      })) || [],
      tests: [],
      description: endpoint.description || endpoint.summary || ''
    };
    
    return reqNestData;
  }, [specObj, authToken, customHeaders, generateExampleFromSchema]);

  // Handle ReqNest integration
  const handleOpenInReqNest = useCallback((endpoint?: ParsedEndpoint) => {
    setShowSingleCurlDialog(false); // Close cURL dialog if open
    if (endpoint) {
      const reqNestData = convertToReqNestFormat(endpoint, selectedServer);
      setImportedRequest(reqNestData);
      // Load collections from localStorage
      const stored = JSON.parse(localStorage.getItem('devtoolnest-collections') || '[]');
      setCollections(stored);
      setShowSaveToCollectionDialog(true);
    }
  }, [convertToReqNestFormat, selectedServer]);

  const handleOpenBulkInReqNest = useCallback(() => {
    setShowBulkCurlDialog(false); // Close bulk cURL dialog if open
    if (!specObj?.paths) return;
    
    const endpoints = extractEndpointsFromSpec(specObj);
    
    // Group endpoints by resource (first path segment)
    const resourceGroups = new Map<string, ParsedEndpoint[]>();
    
    endpoints.forEach(endpoint => {
      // Extract resource from path (e.g., "/users" from "/users/{id}")
      const pathSegments = endpoint.path.split('/').filter(segment => segment.length > 0);
      const resource = pathSegments.length > 0 ? `/${pathSegments[0]}` : '/root';
      
      if (!resourceGroups.has(resource)) {
        resourceGroups.set(resource, []);
      }
      const currentEndpoints = resourceGroups.get(resource) || [];
      resourceGroups.set(resource, [...currentEndpoints, endpoint]);
    });
    
    // Create collection with folder structure
    let requests: any[] = [];
    
    resourceGroups.forEach((endpoints, resource) => {
      // Create folder for this resource
      const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const folderName = resource === '/root' ? 'Other Endpoints' : resource.substring(1).charAt(0).toUpperCase() + resource.substring(2);
      
      const folder = {
        id: folderId,
        name: folderName,
        method: 'FOLDER',
        url: '',
        headers: [],
        body: '',
        auth: { type: 'none' },
        params: [],
        tests: []
      };
      
      requests = [...requests, folder];
      
      // Add all endpoints for this resource as children of the folder
      endpoints.forEach(endpoint => {
        const request = convertToReqNestFormat(endpoint, selectedServer);
        request.parentId = folderId; // Set parent folder
        requests = [...requests, request];
      });
    });
    
    const collection = {
      id: `collection-${Date.now()}`,
      name: specObj.info?.title || 'API Collection',
      requests: requests,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: specObj.info?.description || 'Generated from OpenAPI specification'
    };
    
    // Set bulk import state and show the save to collection dialog in SpecCraft first
    setIsBulkImport(true);
    setBulkImportCollection(collection);
    setShowSaveToCollectionDialog(true);
  }, [specObj, extractEndpointsFromSpec, convertToReqNestFormat, selectedServer]);

  const handleCopyCurl = useCallback((curlCommand: string) => {
    navigator.clipboard.writeText(curlCommand);
    toast({
      title: "Copied to clipboard",
      description: "cURL command copied successfully",
    });
  }, []);

  const handleCopyBulkCurl = useCallback(() => {
    const allCommands = bulkCurlCommands.join('\n\n');
    navigator.clipboard.writeText(allCommands);
    toast({
      title: "Copied to clipboard",
      description: "All cURL commands copied successfully",
    });
  }, [bulkCurlCommands]);

  const handleExportSpec = useCallback(() => {
    const blob = new Blob([activeTab.state.specYaml], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-spec.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "API specification exported successfully",
    });
  }, [activeTab.state.specYaml]);

  // Replace "Try it out" buttons with cURL buttons using CSS injection
  useEffect(() => {
    if (!specObj || !specObj.paths) return;

    const addCurlButtons = () => {
      // Find all operation blocks
      const operationBlocks = document.querySelectorAll('.opblock');
      console.log('Found operation blocks:', operationBlocks.length);
      
      operationBlocks.forEach((block, index) => {
        // Skip if cURL button already exists
        if (block.querySelector('.custom-curl-btn')) return;
        
        // Get method from operation block
        const methodClass = Array.from(block.classList).find(cls => cls.startsWith('opblock-'));
        const method = methodClass ? methodClass.replace('opblock-', '').toUpperCase() : 'GET';
        
        // Try to extract path from various elements
        let apiPath = '';
        let operationInfo = null;
        
        // Try to get path from the actual path element
        const pathElement = block.querySelector('.opblock-summary-path');
        if (pathElement) {
          const pathText = pathElement.textContent?.trim();
          if (pathText && pathText.startsWith('/')) {
            apiPath = pathText;
          }
        }
        
        // If we couldn't get path from UI, try from operation ID
        if (!apiPath) {
          const summaryDesc = block.querySelector('.opblock-summary-description');
          const operationId = summaryDesc ? summaryDesc.textContent?.trim() : '';
          
          if (operationId) {
            // Find the matching path and operation in the spec
            for (const [specPath, pathItem] of Object.entries(specObj.paths)) {
              const operation = pathItem[method.toLowerCase()];
              if (operation && operation.operationId === operationId) {
                apiPath = specPath;
                operationInfo = operation;
                break;
              }
            }
          }
        }
        
        // If we still don't have a path, try to get it from the spec using the first available path for this method
        if (!apiPath) {
          for (const [specPath, pathItem] of Object.entries(specObj.paths)) {
            if (pathItem[method.toLowerCase()]) {
              apiPath = specPath;
              operationInfo = pathItem[method.toLowerCase()];
              break;
            }
          }
        }
        
        if (!apiPath) return;
        
        // Get operation info if we don't have it already
        if (!operationInfo && specObj.paths[apiPath]) {
          operationInfo = specObj.paths[apiPath][method.toLowerCase()];
        }
        
        // Create cURL button
        const curlButton = document.createElement('button');
        curlButton.className = 'custom-curl-btn';
        curlButton.textContent = 'cURL';
        curlButton.style.cssText = `
          background: #4CAF50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          font-weight: bold;
          margin-left: 10px;
          z-index: 10;
          position: relative;
        `;
        
        // Add click handler
        curlButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const endpoint: ParsedEndpoint = {
            method,
            path: apiPath,
            summary: operationInfo?.summary || '',
            description: operationInfo?.description || '',
            tags: operationInfo?.tags || [],
            parameters: operationInfo?.parameters || [],
            requestBody: operationInfo?.requestBody,
            responses: operationInfo?.responses || {},
            security: operationInfo?.security || specObj.security
          };
          
          handleGenerateCurl(endpoint);
        });
        
        // Add button to operation summary
        const summarySection = block.querySelector('.opblock-summary');
        if (summarySection) {
          summarySection.appendChild(curlButton);
          console.log(`Added cURL button for ${method} ${apiPath}`);
        }
      });
    };
    
    // Add buttons after SwaggerUI renders with multiple attempts
    const timer1 = setTimeout(addCurlButtons, 1000);
    const timer2 = setTimeout(addCurlButtons, 2000);
    const timer3 = setTimeout(addCurlButtons, 3000);
    
    // Also add buttons when DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(addCurlButtons, 500);
    });
    
    const swaggerContainer = document.querySelector('.swagger-ui');
    if (swaggerContainer) {
      observer.observe(swaggerContainer, { childList: true, subtree: true });
    }
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, [specObj, handleGenerateCurl]);

  // Initialize BroadcastChannel for ReqNest integration
  useEffect(() => {
    let reqnestChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      reqnestChannel = new BroadcastChannel('reqnest-import');
    }

    // Cleanup function for BroadcastChannel
    return () => {
      if (reqnestChannel) {
        reqnestChannel.close();
      }
    };
  }, []);

  // 3. Save to collection logic
  const saveToCollection = (collectionId, folderId = null) => {
    if (!importedRequest) return;
    const collections = storage.getCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const requestToSave = {
        ...importedRequest,
        id: Date.now().toString(),
        name: importedRequest.url || "Untitled Request",
        parentId: folderId // Set parent folder if provided
      };
      collection.requests = [...collection.requests, requestToSave];
      collection.updatedAt = new Date();
      storage.saveCollection(collection);
      setShowSaveToCollectionDialog(false);
      setImportedRequest(null);
      setSelectedFolder(null);
      setShowNewFolderInput(false);
      setNewFolderName("");
      
      const folderName = folderId ? collection.requests.find(r => r.id === folderId)?.name : '';
      const message = folderId ? 
        `Request saved to "${collection.name}" in folder "${folderName}"` :
        `Request saved to "${collection.name}"`;
      
      toast({
        title: 'Request added to ReqNest',
        description: message
      });
    }
  };

  const createFolderAndSave = (collectionId) => {
    if (!newFolderName.trim()) return;
    
    const collections = storage.getCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const newFolder = {
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
      collection.requests = [...collection.requests, newFolder];
      collection.updatedAt = new Date();
      storage.saveCollection(collection);
      
      // Save request to the new folder
      const requestToSave = {
        ...importedRequest,
        id: Date.now().toString(),
        name: importedRequest.url || "Untitled Request",
        parentId: newFolder.id
      };
      
      collection.requests = [...collection.requests, requestToSave];
      collection.updatedAt = new Date();
      storage.saveCollection(collection);
      setShowSaveToCollectionDialog(false);
      setImportedRequest(null);
      setSelectedFolder(null);
      setShowNewFolderInput(false);
      setNewFolderName("");
      
      toast({
        title: 'Request added to ReqNest',
        description: `Request saved to "${collection.name}" in new folder "${newFolderName}"`
      });
    }
  };

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    let collections = storage.getCollections();
    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      requests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    collections = [...collections, newCollection];
    storage.saveCollection(newCollection);
    setCollections(collections);
    setNewCollectionName("");
  };

  useEffect(() => {
    // Load collections initially
    const collections = storage.getCollections();
    setCollections(collections);

    // Listen for changes to collections in localStorage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'devtoolnest-collections') {
        const updated = storage.getCollections();
        setCollections(updated);
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Cleanup function to clear any leftover import state
    return () => {
      window.removeEventListener('storage', handleStorage);
      // Clear any leftover import state when component unmounts
      setIsBulkImport(false);
      setBulkImportCollection(null);
      setImportedRequest(null);
      setSelectedFolder(null);
      setShowNewFolderInput(false);
      setNewFolderName("");
      // Also clear any localStorage data that might be leftover
      localStorage.removeItem('reqnest_bulk_import_collection');
      localStorage.removeItem('reqnest_import_request');
    };
  }, []);

  // Make Swagger UI font size follow localFontSize, even after re-renders
  useEffect(() => {
    const applySwaggerFontSize = () => {
      const swaggerRoot = document.querySelector('.swagger-ui');
      if (swaggerRoot) {
        (swaggerRoot as HTMLElement).style.setProperty('font-size', `${localFontSize}px`, 'important');
        swaggerRoot.querySelectorAll('*').forEach(el => {
          (el as HTMLElement).style.setProperty('font-size', `${localFontSize}px`, 'important');
        });
      }
    };
    applySwaggerFontSize();
    // MutationObserver to re-apply font size on DOM changes
    const swaggerRoot = document.querySelector('.swagger-ui');
    let observer: MutationObserver | null = null;
    if (swaggerRoot) {
      observer = new MutationObserver(() => {
        applySwaggerFontSize();
      });
      observer.observe(swaggerRoot, { childList: true, subtree: true });
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [localFontSize, isValidSpec, specObj]);

  // Aggressively force font size for Swagger UI textareas, code, etc.
  useEffect(() => {
    const updateFontSize = () => {
      document.querySelectorAll('.swagger-ui textarea, .swagger-ui pre, .swagger-ui code, .swagger-ui input, .swagger-ui select')
        .forEach(el => {
          (el as HTMLElement).style.fontSize = localFontSize + 'px';
          (el as HTMLElement).style.fontFamily = 'inherit';
        });
    };
    updateFontSize();
    // MutationObserver to re-apply on DOM changes
    const root = document.querySelector('.swagger-ui');
    let observer: MutationObserver | null = null;
    if (root) {
      observer = new MutationObserver(updateFontSize);
      observer.observe(root, { childList: true, subtree: true });
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [localFontSize]);

  return (
    <ToolTabs
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      onTabAdd={addTab}
      onTabClose={closeTab}
      onTabRename={renameTab}
      renderTabContent={(tab) => (
        <div className={isFullscreen
          ? "fixed inset-0 z-[9999] bg-white w-screen h-screen font-sans"
          : "min-h-screen w-full bg-[#fafafa] flex flex-col items-center font-sans"
        }>
          {/* SpecCraft Heading, left-aligned, matching Code Beautifier */}
          <div className="w-full text-left pl-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SpecCraft</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">OpenAPI Specification Editor & Documentation Generator</p>
          </div>
          <main className={`${isFullscreen ? 'px-2 py-2' : 'w-full h-full py-4'}`}>
            {/* Compact Controls */}
            <div className={`flex items-center justify-between ${isFullscreen ? 'mb-2' : 'mb-4'} bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 shadow-sm`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Theme:</span>
                <Select value={tab.state.theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">Light</SelectItem>
                    <SelectItem value="monokai">Dark</SelectItem>
                  </SelectContent>
                </Select>
                {/* Moved Bulk cURL and font size controls here */}
                <Button onClick={() => setShowBulkCurlDialog(true)} variant="outline" className="font-semibold">
                  Bulk cURL
                </Button>
                <button
                  className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-lg font-bold"
                  onClick={() => handleLocalFontSizeChange(-2)}
                  title="Decrease YAML/API font size"
                >A-</button>
                <button
                  className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-lg font-bold"
                  onClick={() => handleLocalFontSizeChange(2)}
                  title="Increase YAML/API font size"
                >A+</button>
              </div>
              {/* Right group remains unchanged */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSpec}
                  className="h-8"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                {isValidSpec ? (
                  <Badge className="bg-green-500 text-white text-xs">Valid</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Invalid</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-8"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            {/* Split Screen Layout */}
            <div className="split-container flex w-full min-h-0" style={{ height: 'calc(100vh - 64px)' }}>
              {/* YAML Editor */}
              <div
                className="flex flex-col min-w-0 bg-white border-r border-[#e5e7eb] h-full overflow-auto"
                style={{ width: isMobile ? '100%' : `${tab.state.splitPosition}%` }}
              >
                <AceEditor
                  mode="yaml"
                  theme={tab.state.theme}
                  value={tab.state.specYaml}
                  onChange={handleSpecChange}
                  name="spec-yaml-editor"
                  fontSize={localFontSize}
                  width="100%"
                  height="100%"
                  setOptions={{
                    useWorker: false,
                    showLineNumbers: true,
                    tabSize: 2,
                    wrap: true,
                    showPrintMargin: false,
                  }}
                  editorProps={{ $blockScrolling: true }}
                  style={{ fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace', fontSize: localFontSize, height: '100%' }}
                />
              </div>
              {/* Draggable Divider */}
              <div
                className="cursor-col-resize w-2 bg-[#f3f3f3] hover:bg-[#e0e0e0] transition-colors duration-150 h-full z-10"
                style={{ minWidth: 8, maxWidth: 12 }}
                onMouseDown={handleMouseDown}
              />
              {/* API Preview */}
              <div
                className="flex-1 min-w-0 bg-white overflow-auto h-full"
                style={{ width: isMobile ? '100%' : `calc(100% - ${tab.state.splitPosition}%)`, fontSize: localFontSize }}
              >
                {/* Only override font size for Swagger UI textareas and code blocks, not all elements */}
                <style>{`
                  .swagger-ui textarea,
                  .swagger-ui pre,
                  .swagger-ui code,
                  .swagger-ui input,
                  .swagger-ui select {
                    font-size: ${localFontSize}px !important;
                    font-family: inherit !important;
                  }
                `}</style>
                {specObj && isValidSpec ? (
                  <SwaggerUI spec={specObj} docExpansion="none" style={{ fontSize: localFontSize, height: '100%' }} />
                ) : (
                  <div className="p-8 text-red-600 font-semibold">Invalid OpenAPI/Swagger YAML</div>
                )}
              </div>
            </div>
          </main>
          {/* Single cURL Dialog */}
          <Dialog open={showSingleCurlDialog} onOpenChange={(open) => {
            setShowSingleCurlDialog(open);
            // Clean up import state when dialog is closed
            if (!open) {
              setImportedRequest(null);
              setCurrentEndpoint(null);
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto z-[9999]">
              <DialogHeader>
                <DialogTitle>
                  cURL Command - {currentEndpoint?.method} {currentEndpoint?.path}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Server URL:</label>
                    <Select value={selectedServer} onValueChange={setSelectedServer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select server" />
                      </SelectTrigger>
                      <SelectContent>
                        {specObj?.servers?.map((server, index) => (
                          <SelectItem key={index} value={server.url}>
                            {server.url} - {server.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Auth Token:</label>
                    <Input
                      placeholder="Bearer token (optional)"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Custom Headers:</label>
                  <Textarea
                    placeholder="X-Custom-Header: value&#10;Another-Header: value"
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Generated cURL:</label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all max-h-96">
                      {singleCurlCommand}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyCurl(singleCurlCommand)}
                      className="absolute top-2 right-2"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSingleCurlDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => handleOpenInReqNest(currentEndpoint)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in ReqNest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk cURL Dialog */}
          <Dialog open={showBulkCurlDialog} onOpenChange={(open) => {
            setShowBulkCurlDialog(open);
            // Clean up bulk import state when dialog is closed
            if (!open) {
              setIsBulkImport(false);
              setBulkImportCollection(null);
            }
          }}>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto z-[9999]">
              <DialogHeader>
                <DialogTitle>Bulk cURL Commands</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Server URL:</label>
                    <Select value={selectedServer} onValueChange={setSelectedServer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select server" />
                      </SelectTrigger>
                      <SelectContent>
                        {specObj?.servers?.map((server, index) => (
                          <SelectItem key={index} value={server.url}>
                            {server.url} - {server.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Auth Token:</label>
                    <Input
                      placeholder="Bearer token (optional)"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Custom Headers:</label>
                  <Textarea
                    placeholder="X-Custom-Header: value&#10;Another-Header: value"
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateBulkCurl()}
                    className="mr-2"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyBulkCurl}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy All
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm whitespace-pre-wrap break-all">
                    {bulkCurlCommands.join('\n\n')}
                  </pre>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkCurlDialog(false)}>
                  Close
                </Button>
                <Button onClick={handleOpenBulkInReqNest}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Collection in ReqNest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Save to Collection Dialog */}
          <Dialog open={showSaveToCollectionDialog} onOpenChange={(open) => {
            setShowSaveToCollectionDialog(open);
            // Clean up bulk import state when dialog is closed
            if (!open) {
              setIsBulkImport(false);
              setBulkImportCollection(null);
              setImportedRequest(null);
              setSelectedFolder(null);
              setShowNewFolderInput(false);
              setNewFolderName("");
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-lg font-semibold">
                  {isBulkImport ? `Save ${bulkImportCollection?.requests?.length || 0} Requests` : "Save Request to Collection"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isBulkImport 
                    ? `Save ${bulkImportCollection?.requests?.length || 0} imported requests to an existing collection or create a new one`
                    : "Save your imported request to an existing collection or create a new one"
                  }
                </p>
              </DialogHeader>
              <div className="space-y-6 py-2">
                {!isBulkImport && (
                  <div className="space-y-2">
                    <Label htmlFor="request-name" className="text-sm font-medium">
                      Request Name
                    </Label>
                    <Input
                      id="request-name"
                      value={importedRequest?.name || importedRequest?.url || ""}
                      readOnly
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      The request will be saved with this name
                    </p>
                  </div>
                )}
                
                {isBulkImport && bulkImportCollection && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{bulkImportCollection.requests.length} requests</Badge>
                      <span className="text-sm font-medium">Ready to import</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bulkImportCollection.requests.slice(0, 3).map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-xs">{req.method}</span>
                          <span className="truncate">{req.url}</span>
                        </div>
                      ))}
                      {bulkImportCollection.requests.length > 3 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ... and {bulkImportCollection.requests.length - 3} more requests
                        </div>
                      )}
                      <div className="text-xs text-blue-600 mt-2 font-medium">
                        📁 Organized by resource folders
                      </div>
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
                          className="border rounded-lg p-3 space-y-3"
                        >
                          <div 
                            className="flex items-center justify-between hover:bg-accent/50 cursor-pointer"
                            onClick={() => {
                              if (isBulkImport) {
                                // For bulk import, save the collection to the selected collection
                                const collections = storage.getCollections();
                                const targetCollection = collections.find(c => c.id === collection.id);
                                if (targetCollection && bulkImportCollection) {
                                  // Create a mapping of old folder IDs to new folder IDs
                                  const folderIdMapping = new Map();
                                  let requestsToAdd: any[] = [];
                                  
                                  // First, add folders and create ID mapping
                                  bulkImportCollection.requests.forEach(req => {
                                    if (req.method === 'FOLDER') {
                                      const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                                      folderIdMapping.set(req.id, newFolderId);
                                      
                                      requestsToAdd = [...requestsToAdd, {
                                        ...req,
                                        id: newFolderId
                                      }];
                                    }
                                  });
                                  
                                  // Then, add requests with updated parentId references
                                  bulkImportCollection.requests.forEach(req => {
                                    if (req.method !== 'FOLDER') {
                                      const newParentId = req.parentId ? folderIdMapping.get(req.parentId) : undefined;
                                      
                                      requestsToAdd = [...requestsToAdd, {
                                        ...req,
                                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                        parentId: newParentId
                                      }];
                                    }
                                  });
                                  
                                  // targetCollection.requests.push(...requestsToAdd);
                                  targetCollection.requests = [...(targetCollection.requests || []), ...requestsToAdd];
                                  targetCollection.updatedAt = new Date();
                                  storage.saveCollection(targetCollection);
                                  
                                  toast({
                                    title: "Collection Updated",
                                    description: `${bulkImportCollection.requests.length} items added to "${targetCollection.name}"`,
                                  });
                                  setShowSaveToCollectionDialog(false);
                                  setIsBulkImport(false);
                                  setBulkImportCollection(null);
                                }
                              } else {
                                saveToCollection(collection.id);
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
                              {isBulkImport ? "Select Collection" : "Save to Collection"}
                            </Button>
                          </div>
                          
                          {/* Folder Options for Single Import */}
                          {!isBulkImport && (
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
                          )}
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
                        if (isBulkImport) {
                          // For bulk import, create new collection and add all requests with proper folder structure
                          const folderIdMapping = new Map();
                          let requests: any[] = [];
                          
                          // First, add folders and create ID mapping
                          bulkImportCollection.requests.forEach(req => {
                            if (req.method === 'FOLDER') {
                              const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                              folderIdMapping.set(req.id, newFolderId);
                              
                              requests = [...requests, {
                                ...req,
                                id: newFolderId
                              }];
                            }
                          });
                          
                          // Then, add requests with updated parentId references
                          bulkImportCollection.requests.forEach(req => {
                            if (req.method !== 'FOLDER') {
                              const newParentId = req.parentId ? folderIdMapping.get(req.parentId) : undefined;
                              
                              requests = [...requests, {
                                ...req,
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                parentId: newParentId
                              }];
                            }
                          });
                          
                          const newCollection = {
                            id: `collection-${Date.now()}`,
                            name: newCollectionName || bulkImportCollection.name,
                            requests: requests,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          };
                          storage.saveCollection(newCollection);
                          setCollections(prev => [...prev, newCollection]);
                          setNewCollectionName("");
                          
                          toast({
                            title: "Collection Created",
                            description: `Collection "${newCollection.name}" created with ${bulkImportCollection.requests.length} requests`,
                          });
                          setShowSaveToCollectionDialog(false);
                          setIsBulkImport(false);
                          setBulkImportCollection(null);
                        } else {
                          // For single import, validate collection name
                          if (newCollectionName.trim()) {
                            createCollection();
                          } else {
                            toast({
                              title: "Collection name required",
                              description: "Please enter a name for your collection",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                      className="w-full"
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      {isBulkImport ? "Create New Collection" : "Create New Collection"}
                    </Button>
                    {!isBulkImport && (
                      <Input
                        value={newCollectionName}
                        onChange={e => setNewCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="h-8 mt-2"
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSaveToCollectionDialog(false);
                      setIsBulkImport(false);
                      setBulkImportCollection(null);
                      setSelectedFolder(null);
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    />
  );
}