import { 
  Globe, 
  Upload, 
  Edit3, 
  Key, 
  FileText, 
  Code, 
  Wand2,
  Lock
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
    name: 'Token Peek',
    description: 'JWT toolkit: decode, edit, and validate JWT tokens. Supports editing header/payload, signature validation, and developer-friendly features.',
    icon: Key,
    route: '/token-peek',
    color: 'bg-amber-500',
    status: 'ready'
  },
  {
    id: 'code-beautifier',
    name: 'Code Beautifier',
    description: 'Beautify or minify JSON, YAML, XML, or plain text. Upload, download, and copy with ease.',
    icon: Wand2,
    route: '/code-beautifier',
    color: 'bg-cyan-500',
    status: 'ready'
  },
  {
    id: 'encoder-decoder',
    name: 'Encoder/Decoder',
    description: 'Comprehensive encryption toolkit: Base64, URL encoding, hash functions, symmetric/asymmetric encryption, and more.',
    icon: Lock,
    route: '/encoder-decoder',
    color: 'bg-purple-500',
    status: 'ready'
  }
];
