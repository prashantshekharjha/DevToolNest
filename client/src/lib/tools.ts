import { 
  Globe, 
  Upload, 
  Edit3, 
  Key, 
  FileText, 
  Code, 
  RefreshCw, 
  Clock, 
  Wand2, 
  Gauge, 
  GitBranch 
} from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  route: string;
  color: string;
  status: 'ready' | 'beta' | 'coming-soon';
}

export const tools: Tool[] = [
  {
    id: 'reqnest',
    name: 'ReqNest',
    description: 'Build, send, and save HTTP API requests with collections and environment variables.',
    icon: Globe,
    route: '/reqnest',
    color: 'bg-blue-500',
    status: 'ready'
  },
  {
    id: 'spec-craft',
    name: 'SpecCraft',
    description: 'OpenAPI editor with live preview, validation, and cURL generation for all endpoints.',
    icon: Edit3,
    route: '/spec-craft',
    color: 'bg-emerald-500',
    status: 'ready'
  },
  {
    id: 'token-peek',
    name: 'TokenPeek',
    description: 'Decode and analyze JWT tokens with expiration info and validity checks.',
    icon: Key,
    route: '/token-peek',
    color: 'bg-amber-500',
    status: 'ready'
  },

  {
    id: 'pretty-json',
    name: 'PrettyJSON',
    description: 'Format, validate, and beautify JSON with syntax error detection.',
    icon: Code,
    route: '/pretty-json',
    color: 'bg-cyan-500',
    status: 'ready'
  },
  {
    id: 'data-morph',
    name: 'DataMorph',
    description: 'Convert between CSV and JSON formats with side-by-side preview.',
    icon: RefreshCw,
    route: '/data-morph',
    color: 'bg-orange-500',
    status: 'ready'
  },
  {
    id: 'time-flip',
    name: 'TimeFlip',
    description: 'Convert Unix timestamps to human-readable dates and vice versa.',
    icon: Clock,
    route: '/time-flip',
    color: 'bg-teal-500',
    status: 'ready'
  },
  {
    id: 'mock-wizard',
    name: 'MockWizard',
    description: 'Generate realistic mock data from JSON schemas using Faker.js.',
    icon: Wand2,
    route: '/mock-wizard',
    color: 'bg-violet-500',
    status: 'ready'
  },
  {
    id: 'throttle-viz',
    name: 'ThrottleViz',
    description: 'Visualize API rate limiting strategies with real-time simulations.',
    icon: Gauge,
    route: '/throttle-viz',
    color: 'bg-red-500',
    status: 'ready'
  },
  {
    id: 'flow-trace',
    name: 'FlowTrace',
    description: 'Generate PlantUML sequence diagrams from Java method call chains.',
    icon: GitBranch,
    route: '/flow-trace',
    color: 'bg-pink-500',
    status: 'ready'
  }
];
