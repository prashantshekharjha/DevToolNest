import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, RefreshCw, Eye, EyeOff, Lock, Unlock, Hash, FileText, Code, Globe, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import { ToolTabs, ToolTab } from "@/components/ui/ToolTabs";
import { v4 as uuidv4 } from "uuid";
import { useEncoderDecoderTabsStore, EncoderDecoderTabsState } from '@/lib/toolTabsStore';

const LOCAL_STORAGE_KEY = "devtoolnest-encoder-decoder";
const TABS_LOCAL_STORAGE_KEY = "devtoolnest-encoder-tabs";
const ACTIVE_TAB_LOCAL_STORAGE_KEY = "devtoolnest-encoder-active-tab";

interface EncryptionMethod {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'basic' | 'hash' | 'symmetric' | 'asymmetric' | 'encoding';
}

const ENCRYPTION_METHODS: EncryptionMethod[] = [
  // Basic Encoding
  {
    id: 'base64',
    name: 'Base64',
    description: 'Encode/decode Base64 strings',
    icon: Code,
    category: 'basic'
  },
  {
    id: 'url-encoding',
    name: 'URL Encoding',
    description: 'Encode/decode URL-safe strings',
    icon: Globe,
    category: 'basic'
  },
  {
    id: 'hex',
    name: 'Hexadecimal',
    description: 'Convert to/from hexadecimal',
    icon: Hash,
    category: 'basic'
  },
  {
    id: 'binary',
    name: 'Binary',
    description: 'Convert to/from binary',
    icon: FileText,
    category: 'basic'
  },
  
  // Hash Functions
  {
    id: 'md5',
    name: 'MD5',
    description: 'MD5 hash function',
    icon: Hash,
    category: 'hash'
  },
  {
    id: 'sha1',
    name: 'SHA-1',
    description: 'SHA-1 hash function',
    icon: Hash,
    category: 'hash'
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    description: 'SHA-256 hash function',
    icon: Hash,
    category: 'hash'
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    description: 'SHA-512 hash function',
    icon: Hash,
    category: 'hash'
  },
  
  // Symmetric Encryption
  {
    id: 'aes',
    name: 'AES',
    description: 'Advanced Encryption Standard',
    icon: Lock,
    category: 'symmetric'
  },
  {
    id: 'des',
    name: 'DES',
    description: 'Data Encryption Standard (legacy)',
    icon: Lock,
    category: 'symmetric'
  },
  {
    id: '3des',
    name: '3DES',
    description: 'Triple DES (legacy)',
    icon: Lock,
    category: 'symmetric'
  },
  
  // Asymmetric Encryption
  {
    id: 'rsa',
    name: 'RSA',
    description: 'RSA public/private key encryption',
    icon: Key,
    category: 'asymmetric'
  },
  {
    id: 'blowfish',
    name: 'Blowfish',
    description: 'Blowfish symmetric encryption',
    icon: Lock,
    category: 'symmetric'
  },
  {
    id: 'rc4',
    name: 'RC4',
    description: 'RC4 stream cipher (legacy)',
    icon: Lock,
    category: 'symmetric'
  },
  {
    id: 'sha3-256',
    name: 'SHA3-256',
    description: 'SHA3-256 hash function',
    icon: Hash,
    category: 'hash'
  },
  {
    id: 'sha3-512',
    name: 'SHA3-512',
    description: 'SHA3-512 hash function',
    icon: Hash,
    category: 'hash'
  },
  {
    id: 'ripemd160',
    name: 'RIPEMD-160',
    description: 'RIPEMD-160 hash function',
    icon: Hash,
    category: 'hash'
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool',
    description: 'Whirlpool hash function',
    icon: Hash,
    category: 'hash'
  }
];

const AES_MODES = [
  { value: 'AES', label: 'AES' },
  { value: 'AES-128', label: 'AES-128' },
  { value: 'AES-192', label: 'AES-192' },
  { value: 'AES-256', label: 'AES-256' }
];

const AES_PADDING = [
  { value: 'Pkcs7', label: 'PKCS7' },
  { value: 'Iso97971', label: 'ISO97971' },
  { value: 'AnsiX923', label: 'ANSI X923' },
  { value: 'Iso10126', label: 'ISO10126' },
  { value: 'ZeroPadding', label: 'Zero Padding' },
  { value: 'NoPadding', label: 'No Padding' }
];

const DEFAULT_TAB_STATE = {
  activeMethod: 'base64',
  input: '',
  output: '',
  key: '',
  iv: '',
  aesMode: 'AES',
  aesPadding: 'Pkcs7',
  showKey: false,
  showIv: false,
  operation: 'encode' as 'encode' | 'decode',
  activeCategory: 'basic',
  rsaPublicKey: '',
  rsaPrivateKey: '',
  rsaKeySize: 2048,
  rsaGenerating: false,
};

export default function EncoderDecoder() {
  const { toast } = useToast();
  const tabs = useEncoderDecoderTabsStore((s: EncoderDecoderTabsState) => s.tabs);
  const setTabs = useEncoderDecoderTabsStore((s: EncoderDecoderTabsState) => s.setTabs);
  const activeTabId = useEncoderDecoderTabsStore((s: EncoderDecoderTabsState) => s.activeTabId);
  const setActiveTabId = useEncoderDecoderTabsStore((s: EncoderDecoderTabsState) => s.setActiveTabId);

  // Tab actions
  const addTab = () => {
    const newTab: ToolTab<typeof DEFAULT_TAB_STATE> = { id: uuidv4(), title: `Tab ${tabs.length + 1}`, state: { ...DEFAULT_TAB_STATE } };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };
  const closeTab = (id: string) => {
    let idx = tabs.findIndex((t: ToolTab<typeof DEFAULT_TAB_STATE>) => t.id === id);
    if (tabs.length === 1) return; // Don't close last tab
    const newTabs = tabs.filter((t: ToolTab<typeof DEFAULT_TAB_STATE>) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[Math.max(0, idx - 1)].id);
    }
  };
  const renameTab = (id: string, title: string) => {
    setTabs(tabs.map((t: ToolTab<typeof DEFAULT_TAB_STATE>) => (t.id === id ? { ...t, title } : t)));
  };
  const updateTabState = (id: string, updater: (state: typeof DEFAULT_TAB_STATE) => typeof DEFAULT_TAB_STATE) => {
    setTabs(tabs.map((t: ToolTab<typeof DEFAULT_TAB_STATE>) => (t.id === id ? { ...t, state: updater(t.state) } : t)));
  };

  const activeTab = tabs.find((t) => t.id === activeTabId)!;

  // Persist last input
  useEffect(() => {
    const last = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (last) {
      try {
        const data = JSON.parse(last);
        const tabToUpdate = tabs.find(t => t.id === data.tabId);
        if (tabToUpdate) {
          updateTabState(tabToUpdate.id, (state) => ({
            ...state,
            input: data.input || '',
            activeMethod: data.method || 'base64',
            operation: data.operation || 'encode',
            activeCategory: ENCRYPTION_METHODS.find(m => m.id === data.method)?.category || 'basic',
          }));
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []); // <-- Only run on mount

  useEffect(() => {
    const data = { tabId: activeTabId, input: activeTab.state.input, method: activeTab.state.activeMethod, operation: activeTab.state.operation };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [activeTabId, activeTab.state.input, activeTab.state.activeMethod, activeTab.state.operation]);

  // Persist tabs and activeTabId to localStorage on every change
  useEffect(() => {
    localStorage.setItem(TABS_LOCAL_STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);
  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_LOCAL_STORAGE_KEY, activeTabId);
  }, [activeTabId]);

  // Restore tabs and activeTabId from localStorage on mount
  useEffect(() => {
    const savedTabs = localStorage.getItem(TABS_LOCAL_STORAGE_KEY);
    const savedActiveTabId = localStorage.getItem(ACTIVE_TAB_LOCAL_STORAGE_KEY);
    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs);
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          setTabs(parsedTabs);
          if (savedActiveTabId && parsedTabs.some((t: any) => t.id === savedActiveTabId)) {
            setActiveTabId(savedActiveTabId);
          } else {
            setActiveTabId(parsedTabs[0].id);
          }
        }
      } catch {}
    }
  }, []);

  // Context menu handlers
  const closeTabsToLeft = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx > 0) {
      const keep = tabs.slice(idx);
      setTabs(keep);
      if (!keep.some(t => t.id === activeTabId)) setActiveTabId(keep[0].id);
    }
  };
  const closeTabsToRight = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx >= 0 && idx < tabs.length - 1) {
      const keep = tabs.slice(0, idx + 1);
      setTabs(keep);
      if (!keep.some(t => t.id === activeTabId)) setActiveTabId(keep[keep.length - 1].id);
    }
  };
  const closeTabsOthers = (id: string) => {
    const keep = tabs.filter(t => t.id === id);
    setTabs(keep);
    setActiveTabId(id);
  };

  const processInput = () => {
    if (!activeTab.state.input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to process",
        variant: "destructive"
      });
      return;
    }

    try {
      let result = '';
      const method = ENCRYPTION_METHODS.find(m => m.id === activeTab.state.activeMethod);

      switch (activeTab.state.activeMethod) {
        case 'base64':
          if (activeTab.state.operation === 'encode') {
            result = btoa(activeTab.state.input);
          } else {
            result = atob(activeTab.state.input);
          }
          break;

        case 'url-encoding':
          if (activeTab.state.operation === 'encode') {
            result = encodeURIComponent(activeTab.state.input);
          } else {
            result = decodeURIComponent(activeTab.state.input);
          }
          break;

        case 'hex':
          if (activeTab.state.operation === 'encode') {
            result = Array.from(activeTab.state.input).map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
          } else {
            result = activeTab.state.input.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
          }
          break;

        case 'binary':
          if (activeTab.state.operation === 'encode') {
            result = Array.from(activeTab.state.input).map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
          } else {
            result = activeTab.state.input.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
          }
          break;

        case 'md5':
          result = CryptoJS.MD5(activeTab.state.input).toString();
          break;
        case 'sha1':
          result = CryptoJS.SHA1(activeTab.state.input).toString();
          break;
        case 'sha256':
          result = CryptoJS.SHA256(activeTab.state.input).toString();
          break;
        case 'sha512':
          result = CryptoJS.SHA512(activeTab.state.input).toString();
          break;

        case 'aes':
          if (!activeTab.state.key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (activeTab.state.operation === 'encode') {
            const encrypted = CryptoJS.AES.encrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.AES.decrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'des':
          if (!activeTab.state.key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (activeTab.state.operation === 'encode') {
            const encrypted = CryptoJS.DES.encrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.DES.decrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case '3des':
          if (!activeTab.state.key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (activeTab.state.operation === 'encode') {
            const encrypted = CryptoJS.TripleDES.encrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.TripleDES.decrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'blowfish':
          if (!activeTab.state.key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (activeTab.state.operation === 'encode') {
            const encrypted = CryptoJS.Blowfish.encrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.Blowfish.decrypt(activeTab.state.input, activeTab.state.key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: activeTab.state.iv ? CryptoJS.enc.Hex.parse(activeTab.state.iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'rc4':
          if (!activeTab.state.key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (activeTab.state.operation === 'encode') {
            const encrypted = CryptoJS.RC4.encrypt(activeTab.state.input, activeTab.state.key);
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.RC4.decrypt(activeTab.state.input, activeTab.state.key);
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'sha3-256':
          result = CryptoJS.SHA3(activeTab.state.input, { outputLength: 256 }).toString();
          break;

        case 'sha3-512':
          result = CryptoJS.SHA3(activeTab.state.input, { outputLength: 512 }).toString();
          break;

        case 'ripemd160':
          result = CryptoJS.RIPEMD160(activeTab.state.input).toString();
          break;

        case 'whirlpool':
          // Whirlpool not available in CryptoJS, using SHA-512 as alternative
          result = CryptoJS.SHA512(activeTab.state.input).toString();
          break;

        case 'rsa':
          if (activeTab.state.operation === 'encode') {
            if (!activeTab.state.rsaPublicKey.trim()) {
              toast({
                title: 'Public key required',
                description: 'Please enter a valid RSA public key (PEM format)',
                variant: 'destructive',
              });
              return;
            }
            try {
              const pub = forge.pki.publicKeyFromPem(activeTab.state.rsaPublicKey);
              const encrypted = pub.encrypt(forge.util.encodeUtf8(activeTab.state.input), 'RSA-OAEP');
              result = forge.util.encode64(encrypted);
            } catch (e) {
              toast({
                title: 'Encryption error',
                description: 'Invalid public key or encryption failed',
                variant: 'destructive',
              });
              return;
            }
          } else {
            if (!activeTab.state.rsaPrivateKey.trim()) {
              toast({
                title: 'Private key required',
                description: 'Please enter a valid RSA private key (PEM format)',
                variant: 'destructive',
              });
              return;
            }
            try {
              const priv = forge.pki.privateKeyFromPem(activeTab.state.rsaPrivateKey);
              const decoded = forge.util.decode64(activeTab.state.input);
              const decrypted = priv.decrypt(decoded, 'RSA-OAEP');
              result = forge.util.decodeUtf8(decrypted);
            } catch (e) {
              toast({
                title: 'Decryption error',
                description: 'Invalid private key or decryption failed',
                variant: 'destructive',
              });
              return;
            }
          }
          break;

        default:
          result = 'Method not implemented yet';
      }

      updateTabState(activeTabId, (state) => ({ ...state, output: result }));
      toast({
        title: "Success",
        description: `${activeTab.state.operation === 'encode' ? 'Encoded' : 'Decoded'} successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    });
  };

  const clearAll = () => {
    updateTabState(activeTabId, (state) => ({ ...state, input: '', output: '', key: '', iv: '' }));
  };

  const swapInputs = () => {
    updateTabState(activeTabId, (state) => ({
      ...state,
      input: state.output,
      output: state.input,
      operation: state.operation === 'encode' ? 'decode' : 'encode',
    }));
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let keyLength = 8; // default
    
    switch (activeTab.state.activeMethod) {
      case 'aes':
        keyLength = 32;
        break;
      case 'blowfish':
        keyLength = 16;
        break;
      case 'rc4':
        keyLength = 16;
        break;
      case 'des':
        keyLength = 8;
        break;
      case '3des':
        keyLength = 24;
        break;
    }
    
    const randomKey = Array.from({ length: keyLength }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    updateTabState(activeTabId, (state) => ({ ...state, key: randomKey }));
  };

  const generateRandomIv = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIv = Array.from({ length: 16 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    updateTabState(activeTabId, (state) => ({ ...state, iv: randomIv }));
  };

  const currentMethod = ENCRYPTION_METHODS.find(m => m.id === activeTab.state.activeMethod);
  const needsKey = ["aes", "des", "3des", "blowfish", "rc4"].includes(activeTab.state.activeMethod);

  return (
    <div className="flex flex-col h-screen min-h-0 bg-background">
      <ToolTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        onTabAdd={addTab}
        onTabClose={closeTab}
        onTabRename={renameTab}
        onTabCloseToLeft={closeTabsToLeft}
        onTabCloseToRight={closeTabsToRight}
        onTabCloseOthers={closeTabsOthers}
        renderTabContent={(tab) => {
          const method = ENCRYPTION_METHODS.find(m => m.id === tab.state.activeMethod);
          const needsKey = ["aes", "des", "3des", "blowfish", "rc4"].includes(tab.state.activeMethod);

          return (
            <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Encoder/Decoder
        </h1>
        <p className="text-muted-foreground">
          Comprehensive encryption toolkit for encoding, decoding, hashing, and encrypting data
        </p>
      </div>

      {/* Method Selection - Always Visible */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Encryption Method</h2>
            </div>
            
            {/* Category Tabs */}
                    <Tabs value={tab.state.activeCategory} onValueChange={setActiveCategory => updateTabState(tab.id, (state) => ({ ...state, activeCategory: setActiveCategory }))} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="text-base font-semibold">Basic</TabsTrigger>
                <TabsTrigger value="hash" className="text-base font-semibold">Hash</TabsTrigger>
                <TabsTrigger value="symmetric" className="text-base font-semibold">Symmetric</TabsTrigger>
                <TabsTrigger value="asymmetric" className="text-base font-semibold">Asymmetric</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ENCRYPTION_METHODS.filter(m => m.category === 'basic').map(method => (
                    <Button
                      key={method.id}
                              variant={tab.state.activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                                tab.state.activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                                updateTabState(tab.id, (state) => ({
                                  ...state,
                                  activeMethod: method.id,
                                  activeCategory: method.category,
                                  ...(method.category === 'hash' ? { operation: 'encode' } : {})
                                }));
                      }}
                    >
                      <method.icon className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{method.name}</div>
                        <div className="text-xs text-[color:#bfae6a]">{method.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="hash" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ENCRYPTION_METHODS.filter(m => m.category === 'hash').map(method => (
                    <Button
                      key={method.id}
                              variant={tab.state.activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                                tab.state.activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                                updateTabState(tab.id, (state) => ({
                                  ...state,
                                  activeMethod: method.id,
                                  activeCategory: method.category,
                                  ...(method.category === 'hash' ? { operation: 'encode' } : {})
                                }));
                      }}
                    >
                      <method.icon className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{method.name}</div>
                        <div className="text-xs text-[color:#bfae6a]">{method.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="symmetric" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ENCRYPTION_METHODS.filter(m => m.category === 'symmetric').map(method => (
                    <Button
                      key={method.id}
                              variant={tab.state.activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                                tab.state.activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                                updateTabState(tab.id, (state) => ({
                                  ...state,
                                  activeMethod: method.id,
                                  activeCategory: method.category,
                                  ...(method.category === 'hash' ? { operation: 'encode' } : {})
                                }));
                      }}
                    >
                      <method.icon className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{method.name}</div>
                        <div className="text-xs text-[color:#bfae6a]">{method.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="asymmetric" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ENCRYPTION_METHODS.filter(m => m.category === 'asymmetric').map(method => (
                    <Button
                      key={method.id}
                              variant={tab.state.activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                                tab.state.activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                                updateTabState(tab.id, (state) => ({
                                  ...state,
                                  activeMethod: method.id,
                                  activeCategory: method.category,
                                  ...(method.category === 'hash' ? { operation: 'encode' } : {})
                                }));
                      }}
                    >
                      <method.icon className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{method.name}</div>
                        <div className="text-xs text-[color:#bfae6a]">{method.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Operation Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Operation</h2>
            </div>
            <div className="flex gap-2">
              <Button
                        variant={tab.state.operation === 'encode' ? "default" : "outline"}
                        onClick={() => updateTabState(tab.id, (state) => ({ ...state, operation: 'encode' }))}
                        disabled={['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(tab.state.activeMethod)}
                        className={tab.state.operation === 'encode' ? "bg-[#2d1c0f] text-white hover:bg-[#444]" : ""}
                        style={{ pointerEvents: ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(tab.state.activeMethod) ? 'none' : 'auto' }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Encode
              </Button>
              <Button
                        variant={tab.state.operation === 'decode' ? "default" : "outline"}
                        onClick={() => updateTabState(tab.id, (state) => ({ ...state, operation: 'decode' }))}
                        disabled={['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(tab.state.activeMethod)}
                        className={tab.state.operation === 'decode' ? "bg-[#2d1c0f] text-white hover:bg-[#444]" : ""}
                        style={{ pointerEvents: ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(tab.state.activeMethod) ? 'none' : 'auto' }}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Decode
              </Button>
            </div>
          </div>

          {/* RSA Key Fields */}
                  {tab.state.activeMethod === 'rsa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="rsa-public">Public Key (PEM)</Label>
                <Textarea
                  id="rsa-public"
                          value={tab.state.rsaPublicKey}
                          onChange={e => updateTabState(tab.id, (state) => ({ ...state, rsaPublicKey: e.target.value }))}
                  placeholder="Paste or generate a public key (PEM)"
                  rows={6}
                          className="font-mono max-h-40"
                />
                <div className="flex gap-2 mt-1">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(tab.state.rsaPublicKey)} disabled={!tab.state.rsaPublicKey}>Copy</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-private">Private Key (PEM)</Label>
                <Textarea
                  id="rsa-private"
                          value={tab.state.rsaPrivateKey}
                          onChange={e => updateTabState(tab.id, (state) => ({ ...state, rsaPrivateKey: e.target.value }))}
                  placeholder="Paste or generate a private key (PEM)"
                  rows={6}
                          className="font-mono max-h-40"
                />
                <div className="flex gap-2 mt-1">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(tab.state.rsaPrivateKey)} disabled={!tab.state.rsaPrivateKey}>Copy</Button>
                </div>
              </div>
            </div>
          )}

          {/* RSA Key Generation */}
                  {tab.state.activeMethod === 'rsa' && (
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="rsa-keysize">Key Size:</Label>
                      <div className="w-32">
                        <Select value={String(tab.state.rsaKeySize)} onValueChange={v => updateTabState(tab.id, (state) => ({ ...state, rsaKeySize: Number(v) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="2048">2048</SelectItem>
                  <SelectItem value="4096">4096</SelectItem>
                </SelectContent>
              </Select>
                      </div>
              <Button onClick={async () => {
                        updateTabState(tab.id, (state) => ({ ...state, rsaGenerating: true }));
                try {
                  await new Promise(resolve => setTimeout(resolve, 100)); // allow UI update
                          forge.pki.rsa.generateKeyPair({bits: tab.state.rsaKeySize, workers: -1}, (err, keypair) => {
                            updateTabState(tab.id, (state) => {
                    if (err) {
                      toast({ title: 'Key generation error', description: String(err), variant: 'destructive' });
                                return { ...state, rsaGenerating: false };
                    }
                    toast({ title: 'Key pair generated', description: 'RSA key pair generated successfully' });
                              return {
                                ...state,
                                rsaGenerating: false,
                                rsaPublicKey: forge.pki.publicKeyToPem(keypair.publicKey),
                                rsaPrivateKey: forge.pki.privateKeyToPem(keypair.privateKey),
                              };
                            });
                  });
                } catch (e) {
                          updateTabState(tab.id, (state) => ({ ...state, rsaGenerating: false }));
                  toast({ title: 'Key generation error', description: String(e), variant: 'destructive' });
                }
                      }} disabled={tab.state.rsaGenerating}>
                        {tab.state.rsaGenerating ? 'Generating...' : 'Generate Key Pair'}
              </Button>
            </div>
          )}

          {needsKey && (
            <>
              {/* Encryption Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Encryption Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="key"
                                type={tab.state.showKey ? "text" : "password"}
                                value={tab.state.key}
                                onChange={(e) => updateTabState(tab.id, (state) => ({ ...state, key: e.target.value }))}
                        placeholder="Enter encryption key"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                                onClick={() => updateTabState(tab.id, (state) => ({ ...state, showKey: !state.showKey }))}
                      >
                                {tab.state.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" onClick={generateRandomKey}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iv">Initialization Vector (IV)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="iv"
                                type={tab.state.showIv ? "text" : "password"}
                                value={tab.state.iv}
                                onChange={(e) => updateTabState(tab.id, (state) => ({ ...state, iv: e.target.value }))}
                                placeholder={tab.state.activeMethod === 'rc4' ? "Not used for RC4" : "Enter IV (optional)"}
                                disabled={tab.state.activeMethod === 'rc4'}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                                onClick={() => updateTabState(tab.id, (state) => ({ ...state, showIv: !state.showIv }))}
                                disabled={tab.state.activeMethod === 'rc4'}
                      >
                                {tab.state.showIv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                            <Button variant="outline" onClick={generateRandomIv} disabled={tab.state.activeMethod === 'rc4'}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* AES Specific Options */}
                      {tab.state.activeMethod === 'aes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2 w-full">
                    <Label htmlFor="aes-mode">AES Mode</Label>
                            <div className="w-full">
                              <Select value={tab.state.aesMode} onValueChange={val => updateTabState(tab.id, (state) => ({ ...state, aesMode: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AES_MODES.map(mode => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                          </div>
                          <div className="space-y-2 w-full">
                    <Label htmlFor="aes-padding">Padding</Label>
                            <div className="w-full">
                              <Select value={tab.state.aesPadding} onValueChange={val => updateTabState(tab.id, (state) => ({ ...state, aesPadding: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AES_PADDING.map(padding => (
                          <SelectItem key={padding.value} value={padding.value}>
                            {padding.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                            </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Input/Output */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0 flex-1 overflow-hidden">
        {/* Input */}
                <Card className="h-full min-h-0 flex-1 flex flex-col overflow-hidden">
                  <CardContent className="p-6 h-full min-h-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold">Input</h2>
              </div>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
            
            <div className="space-y-4">
              <Textarea
                        value={tab.state.input}
                        onChange={(e) => updateTabState(tab.id, (state) => ({ ...state, input: e.target.value }))}
                        placeholder={`Enter text to ${tab.state.operation}...`}
                        className="min-h-[200px] font-mono h-full min-h-0 flex-1 overflow-auto"
              />
              
              <div className="flex gap-2">
                <Button onClick={processInput} className="flex-1 bg-[#2d1c0f] text-white hover:bg-[#444] px-8 py-2 rounded">
                          {tab.state.operation === 'encode' ? 'Encode' : 'Decode'}
                </Button>
                <Button variant="outline" onClick={swapInputs}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
                <Card className="h-full min-h-0 flex-1 flex flex-col overflow-hidden">
                  <CardContent className="p-6 h-full min-h-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Output</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                        onClick={() => copyToClipboard(tab.state.output)}
                        disabled={!tab.state.output}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            
            <div className="space-y-4">
                      <div className="min-h-[200px] p-3 border rounded-md bg-muted/30 font-mono text-sm whitespace-pre-wrap overflow-auto h-full min-h-0 flex-1 break-all">
                        {tab.state.output || 'Output will appear here...'}
              </div>
              
                      {tab.state.output && (
                <div className="text-xs text-muted-foreground">
                          Length: {tab.state.output.length} characters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
            </div>
          );
        }}
      />
    </div>
  );
} 