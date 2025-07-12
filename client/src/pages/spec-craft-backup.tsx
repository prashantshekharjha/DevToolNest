import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Download, Code, Eye, Play, FileText, Zap, Maximize, Minimize } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { storage } from '@/lib/storage';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import * as yaml from 'js-yaml';

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
}

export default function SpecCraft() {
  const [spec, setSpec] = useState(`openapi: 3.0.3
info:
  title: Sample API
  version: 1.0.0
  description: A sample API to demonstrate OpenAPI specifications
  contact:
    name: API Support
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
paths:
  /auth/signup:
    post:
      tags:
        - Authentication
      summary: Create new user account
      description: Register a new user account with email and password
      operationId: signup
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserSignup'
            examples:
              valid_signup:
                summary: Valid signup request
                value:
                  email: "john.doe@example.com"
                  password: "securePassword123"
                  firstName: "John"
                  lastName: "Doe"
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              examples:
                user_created:
                  summary: Successfully created user
                  value:
                    id: 1
                    email: "john.doe@example.com"
                    firstName: "John"
                    lastName: "Doe"
                    createdAt: "2024-01-15T10:30:00Z"
        '400':
          description: Invalid request data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Email already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /auth/login:
    post:
      tags:
        - Authentication
      summary: Authenticate user
      description: Login with email and password to get access token
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserLogin'
            examples:
              valid_login:
                summary: Valid login request
                value:
                  email: "john.doe@example.com"
                  password: "securePassword123"
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
              examples:
                login_success:
                  summary: Successful login
                  value:
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    user:
                      id: 1
                      email: "john.doe@example.com"
                      firstName: "John"
                      lastName: "Doe"
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /users:
    get:
      tags:
        - Users
      summary: Get all users
      description: Retrieve a list of all users with pagination support
      operationId: getUsers
      parameters:
        - name: page
          in: query
          description: Page number for pagination
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Number of users per page
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
              examples:
                users_list:
                  summary: List of users
                  value:
                    users:
                      - id: 1
                        email: "john.doe@example.com"
                        firstName: "John"
                        lastName: "Doe"
                        createdAt: "2024-01-15T10:30:00Z"
                      - id: 2
                        email: "jane.smith@example.com"
                        firstName: "Jane"
                        lastName: "Smith"
                        createdAt: "2024-01-16T14:20:00Z"
                    pagination:
                      page: 1
                      limit: 10
                      total: 2
                      totalPages: 1
  /users/{id}:
    get:
      tags:
        - Users
      summary: Get user by ID
      description: Retrieve a specific user by their ID
      operationId: getUserById
      parameters:
        - name: id
          in: path
          description: User ID
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: User details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              examples:
                user_details:
                  summary: User details
                  value:
                    id: 1
                    email: "john.doe@example.com"
                    firstName: "John"
                    lastName: "Doe"
                    createdAt: "2024-01-15T10:30:00Z"
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    put:
      tags:
        - Users
      summary: Update user
      description: Update user information
      operationId: updateUser
      parameters:
        - name: id
          in: path
          description: User ID
          required: true
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
            examples:
              update_user:
                summary: Update user example
                value:
                  firstName: "Johnny"
                  lastName: "Doe"
      responses:
        '200':
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    UserSignup:
      type: object
      required:
        - email
        - password
        - firstName
        - lastName
      properties:
        email:
          type: string
          format: email
          description: User's email address
          example: "john.doe@example.com"
        password:
          type: string
          minLength: 8
          description: User's password (minimum 8 characters)
          example: "securePassword123"
        firstName:
          type: string
          description: User's first name
          example: "John"
        lastName:
          type: string
          description: User's last name
          example: "Doe"
    UserLogin:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          description: User's email address
          example: "john.doe@example.com"
        password:
          type: string
          description: User's password
          example: "securePassword123"
    UserUpdate:
      type: object
      properties:
        firstName:
          type: string
          description: User's first name
          example: "Johnny"
        lastName:
          type: string
          description: User's last name
          example: "Doe"
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
          description: Unique user identifier
          example: 1
        email:
          type: string
          format: email
          description: User's email address
          example: "john.doe@example.com"
        firstName:
          type: string
          description: User's first name
          example: "John"
        lastName:
          type: string
          description: User's last name
          example: "Doe"
        createdAt:
          type: string
          format: date-time
          description: User creation timestamp
          example: "2024-01-15T10:30:00Z"
      required:
        - id
        - email
        - firstName
        - lastName
        - createdAt
    AuthResponse:
      type: object
      properties:
        token:
          type: string
          description: JWT access token
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        user:
          $ref: '#/components/schemas/User'
      required:
        - token
        - user
    Pagination:
      type: object
      properties:
        page:
          type: integer
          description: Current page number
          example: 1
        limit:
          type: integer
          description: Number of items per page
          example: 10
        total:
          type: integer
          description: Total number of items
          example: 100
        totalPages:
          type: integer
          description: Total number of pages
          example: 10
      required:
        - page
        - limit
        - total
        - totalPages
    Error:
      type: object
      properties:
        error:
          type: string
          description: Error message
          example: "Invalid request data"
        message:
          type: string
          description: Detailed error description
          example: "The email field is required"
        code:
          type: integer
          description: Error code
          example: 400
      required:
        - error
        - message
        - code`);

  const [parsedSpec, setParsedSpec] = useState<any>(null);
  const [isValidSpec, setIsValidSpec] = useState(true);
  const [parseError, setParseError] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [showCurlDialog, setShowCurlDialog] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [theme, setTheme] = useState('github');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBulkCurlDialog, setShowBulkCurlDialog] = useState(false);
  const [bulkCurlCommands, setBulkCurlCommands] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [showSingleCurlDialog, setShowSingleCurlDialog] = useState(false);
  const [singleCurlCommand, setSingleCurlCommand] = useState('');
  const [currentEndpoint, setCurrentEndpoint] = useState<ParsedEndpoint | null>(null);

  // Load collections from storage
  useEffect(() => {
    const loadedCollections = storage.getCollections();
    setCollections(loadedCollections);
  }, []);

  // Load saved spec from storage
  useEffect(() => {
    const savedSpec = storage.getToolData('spec-craft');
    if (savedSpec?.spec) {
      setSpec(savedSpec.spec);
    }
  }, []);

  // Parse spec when it changes
  useEffect(() => {
    try {
      const parsed = yaml.load(spec) as any;
      setParsedSpec(parsed);
      setIsValidSpec(true);
      setParseError('');
    } catch (error) {
      setIsValidSpec(false);
      setParseError(error.message);
      setParsedSpec(null);
    }
  }, [spec]);

  // Save spec to storage when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      storage.saveToolData('spec-craft', { spec });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [spec]);

  const handleSpecChange = useCallback((newSpec: string) => {
    setSpec(newSpec);
  }, []);

  // Generate detailed cURL command with all headers and parameters
  const generateDetailedCurl = useCallback((endpoint: ParsedEndpoint, serverUrl?: string, token?: string, headers?: string) => {
    const baseUrl = serverUrl || parsedSpec?.servers?.[0]?.url || 'https://api.example.com';
    const method = endpoint.method;
    let path = endpoint.path;
    
    // Replace path parameters with example values
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        if (param.in === 'path') {
          const example = param.example || param.schema?.example || `{${param.name}}`;
          path = path.replace(`{${param.name}}`, example);
        }
      });
    }
    
    let curl = `curl -X ${method} "${baseUrl}${path}"`;
    
    // Add authentication header
    if (token) {
      curl += ` \\\n  -H "Authorization: Bearer ${token}"`;
    }
    
    // Add standard headers
    curl += ` \\\n  -H "Content-Type: application/json"`;
    curl += ` \\\n  -H "Accept: application/json"`;
    
    // Add custom headers
    if (headers) {
      headers.split('\n').forEach(header => {
        const [key, value] = header.split(':').map(h => h.trim());
        if (key && value) {
          curl += ` \\\n  -H "${key}: ${value}"`;
        }
      });
    }
    
    // Add query parameters
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    if (queryParams.length > 0) {
      const queryString = queryParams.map(param => {
        const example = param.example || param.schema?.example || `{${param.name}}`;
        return `${param.name}=${encodeURIComponent(example)}`;
      }).join('&');
      curl = curl.replace(`"${baseUrl}${path}"`, `"${baseUrl}${path}?${queryString}"`);
    }
    
    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
      const content = endpoint.requestBody.content?.['application/json'];
      let example = content?.examples ? Object.values(content.examples)[0]?.value : content?.example;
      
      // Generate example from schema if no example exists
      if (!example && content?.schema) {
        example = generateExampleFromSchema(content.schema);
      }
      
      if (example) {
        curl += ` \\\n  -d '${JSON.stringify(example, null, 2)}'`;
      }
    }
    
    return curl;
  }, [parsedSpec]);

  // Generate example data from schema
  const generateExampleFromSchema = useCallback((schema: any): any => {
    if (schema.type === 'object' && schema.properties) {
      const example: any = {};
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.example !== undefined) {
          example[key] = prop.example;
        } else if (prop.type === 'string') {
          example[key] = prop.format === 'email' ? 'user@example.com' : 'string';
        } else if (prop.type === 'integer') {
          example[key] = 123;
        } else if (prop.type === 'number') {
          example[key] = 12.34;
        } else if (prop.type === 'boolean') {
          example[key] = true;
        } else if (prop.type === 'array') {
          example[key] = [];
        } else if (prop.type === 'object') {
          example[key] = generateExampleFromSchema(prop);
        }
      });
      return example;
    }
    return null;
  }, []);

  const handleGenerateCurl = useCallback((endpoint: ParsedEndpoint) => {
    const curl = generateDetailedCurl(endpoint, selectedServer, authToken, customHeaders);
    setSingleCurlCommand(curl);
    setCurrentEndpoint(endpoint);
    setShowSingleCurlDialog(true);
  }, [generateDetailedCurl, selectedServer, authToken, customHeaders]);

  // Generate bulk cURL commands for all endpoints
  const handleGenerateBulkCurl = useCallback(() => {
    if (!parsedSpec?.paths) return;
    
    const endpoints = extractEndpointsFromSpec(parsedSpec);
    const commands = endpoints.map(endpoint => ({
      endpoint,
      curl: generateDetailedCurl(endpoint, selectedServer, authToken, customHeaders)
    }));
    
    setBulkCurlCommands(commands.map(c => c.curl));
    setShowBulkCurlDialog(true);
  }, [parsedSpec, generateDetailedCurl, selectedServer, authToken, customHeaders, extractEndpointsFromSpec]);

  // Convert to ReqNest format
  const convertToReqNestFormat = useCallback((endpoint: ParsedEndpoint, serverUrl?: string) => {
    const baseUrl = serverUrl || parsedSpec?.servers?.[0]?.url || 'https://api.example.com';
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
    
    let headers = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Accept', value: 'application/json' }
    ];
    
    if (authToken) {
      headers = [...headers, { key: 'Authorization', value: `Bearer ${authToken}` }];
    }
    
    if (customHeaders) {
      customHeaders.split('\n').forEach(header => {
        const [key, value] = header.split(':').map(h => h.trim());
        if (key && value) {
          headers = [...headers, { key, value }];
        }
      });
    }
    
    let body = '';
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
      const content = endpoint.requestBody.content?.['application/json'];
      let example = content?.examples ? Object.values(content.examples)[0]?.value : content?.example;
      
      if (!example && content?.schema) {
        example = generateExampleFromSchema(content.schema);
      }
      
      if (example) {
        body = JSON.stringify(example, null, 2);
      }
    }
    
    return {
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
      description: endpoint.description || endpoint.summary || ''
    };
  }, [parsedSpec, authToken, customHeaders, generateExampleFromSchema]);

  // Handle ReqNest integration
  const handleOpenInReqNest = useCallback((endpoint?: ParsedEndpoint) => {
    if (endpoint) {
      const reqNestData = convertToReqNestFormat(endpoint, selectedServer);
      const reqNestUrl = `/reqnest?import=${encodeURIComponent(JSON.stringify(reqNestData))}`;
      window.open(reqNestUrl, '_blank');
    }
  }, [convertToReqNestFormat, selectedServer]);

  const handleOpenBulkInReqNest = useCallback(() => {
    if (!parsedSpec?.paths) return;
    
    const endpoints = extractEndpointsFromSpec(parsedSpec);
    const collection = {
      id: `collection-${Date.now()}`,
      name: parsedSpec.info?.title || 'API Collection',
      requests: endpoints.map(endpoint => convertToReqNestFormat(endpoint, selectedServer)),
      createdAt: new Date(),
      updatedAt: new Date(),
      description: parsedSpec.info?.description || 'Generated from OpenAPI specification'
    };
    
    const reqNestUrl = `/reqnest?collection=${encodeURIComponent(JSON.stringify(collection))}`;
    window.open(reqNestUrl, '_blank');
  }, [parsedSpec, extractEndpointsFromSpec, convertToReqNestFormat, selectedServer]);

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

  // Initialize server selection
  useEffect(() => {
    if (parsedSpec?.servers?.[0]?.url) {
      setSelectedServer(parsedSpec.servers[0].url);
    }
  }, [parsedSpec]);

  const handleCreateCollection = useCallback(() => {
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
    setNewCollectionName('');
    setShowNewCollectionDialog(false);
    
    toast({
      title: "Success",
      description: `Collection "${newCollectionName}" created successfully`,
    });
  }, [newCollectionName]);

  const handleExportSpec = useCallback(() => {
    const blob = new Blob([spec], { type: 'application/yaml' });
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
  }, [spec]);

  const handleCopyCurl = useCallback(() => {
    navigator.clipboard.writeText(curlCommand);
    toast({
      title: "Success",
      description: "cURL command copied to clipboard",
    });
  }, [curlCommand]);

  const handleOpenInReqNest = useCallback(() => {
    if (!selectedEndpoint) return;
    
    const content = selectedEndpoint.requestBody?.content?.['application/json'];
    const example = content?.examples ? Object.values(content.examples)[0]?.value : content?.example;
    
    const requestData = {
      method: selectedEndpoint.method,
      url: selectedEndpoint.path,
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Accept', value: 'application/json' }
      ],
      body: example ? JSON.stringify(example, null, 2) : ''
    };
    
    // Store the request data temporarily
    storage.saveToolData('reqnest-import', requestData);
    
    // Navigate to ReqNest
    window.location.href = '/reqnest';
  }, [selectedEndpoint]);

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
              responses: details.responses || {}
            }];
          }
        });
      });
    }
    
    return endpoints;
  }, []);

  const swaggerUiPlugins = [
    {
      statePlugins: {
        spec: {
          wrapActions: {
            updateSpec: (oriAction: any) => (spec: string) => {
              // Custom action to handle spec updates
              return oriAction(spec);
            }
          }
        }
      }
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {!isFullscreen && (
        <Header 
          title="SpecCraft" 
          subtitle="OpenAPI Specification Editor & Documentation Generator"
        />
      )}
      
      <main className={`${isFullscreen ? 'px-2 py-2' : 'container mx-auto px-4 py-4'}`}>
        {/* Compact Controls */}
        <div className={`flex items-center justify-between ${isFullscreen ? 'mb-2' : 'mb-4'} bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 shadow-sm`}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Theme:</span>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">Light</SelectItem>
                <SelectItem value="monokai">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        <div className={`flex flex-col lg:flex-row ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-200px)]'} bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden`}>
          {/* Left Panel - Editor */}
          <div className="w-full lg:w-1/2 flex flex-col border-r-0 lg:border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-900">
              <Code className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">YAML Editor</span>
            </div>
            <div className="flex-1 relative">
              <AceEditor
                mode="yaml"
                theme={theme}
                onChange={handleSpecChange}
                value={spec}
                width="100%"
                height="100%"
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                  showLineNumbers: true,
                  tabSize: 2,
                  useWorker: false
                }}
              />
            </div>
            {!isValidSpec && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-300">{parseError}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-900">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Preview</span>
            </div>
            <div className="flex-1 overflow-auto">
              {isValidSpec && parsedSpec ? (
                <div className="swagger-ui-container h-full">
                  <SwaggerUI
                    spec={parsedSpec}
                    plugins={swaggerUiPlugins}
                    displayRequestDuration={true}
                    supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
                    onComplete={(swaggerApi: any) => {
                      console.log('Swagger UI loaded', swaggerApi);
                    }}
                    requestInterceptor={(req: any) => {
                      console.log('Request:', req);
                      return req;
                    }}
                    responseInterceptor={(res: any) => {
                      console.log('Response:', res);
                      return res;
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Invalid Specification</p>
                    <p className="text-xs">Fix YAML syntax to see preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {isValidSpec && parsedSpec && (
          <div className="mt-4 bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {extractEndpointsFromSpec(parsedSpec).map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`${
                        endpoint.method === 'GET' ? 'bg-green-500' :
                        endpoint.method === 'POST' ? 'bg-blue-500' :
                        endpoint.method === 'PUT' ? 'bg-yellow-500' :
                        endpoint.method === 'PATCH' ? 'bg-orange-500' :
                        endpoint.method === 'DELETE' ? 'bg-red-500' :
                        'bg-gray-500'
                      } text-white text-xs`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      {endpoint.summary}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateCurl(endpoint)}
                    className="h-8"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    cURL
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* cURL Generation Dialog */}
      <Dialog open={showCurlDialog} onOpenChange={setShowCurlDialog}>
        <DialogContent className="max-w-4xl bg-background">
          <DialogHeader>
            <DialogTitle>Generate cURL Command</DialogTitle>
          </DialogHeader>
          {selectedEndpoint && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${
                  selectedEndpoint.method === 'GET' ? 'bg-green-500' :
                  selectedEndpoint.method === 'POST' ? 'bg-blue-500' :
                  selectedEndpoint.method === 'PUT' ? 'bg-yellow-500' :
                  selectedEndpoint.method === 'PATCH' ? 'bg-orange-500' :
                  selectedEndpoint.method === 'DELETE' ? 'bg-red-500' :
                  'bg-gray-500'
                } text-white`}>
                  {selectedEndpoint.method}
                </Badge>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {selectedEndpoint.path}
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Generated cURL Command:</h4>
                <div className="relative">
                  <pre className="text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                    {curlCommand}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleCopyCurl}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOpenInReqNest}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test in ReqNest
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewCollectionDialog(true)}
                >
                  Save to Collection
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Collection Dialog */}
      <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection Name</label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </div>
            {collections.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Or select existing collection</label>
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map(collection => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCollectionDialog(false)}>
              Cancel
            </Button>
            {selectedCollection ? (
              <Button onClick={handleSaveToCollection}>
                Save to Collection
              </Button>
            ) : (
              <Button onClick={handleCreateCollection}>
                Create Collection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}