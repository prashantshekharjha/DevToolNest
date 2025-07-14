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

// Crypto libraries
import CryptoJS from 'crypto-js';
import forge from 'node-forge';

const LOCAL_STORAGE_KEY = "devtoolnest-encoder-decoder";

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

export default function EncoderDecoder() {
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('');
  const [iv, setIv] = useState('');
  const [aesMode, setAesMode] = useState('AES');
  const [aesPadding, setAesPadding] = useState('Pkcs7');
  const [showKey, setShowKey] = useState(false);
  const [showIv, setShowIv] = useState(false);
  const [operation, setOperation] = useState<'encode' | 'decode'>('encode');
  const [activeCategory, setActiveCategory] = useState('basic');
  // RSA state
  const [rsaPublicKey, setRsaPublicKey] = useState('');
  const [rsaPrivateKey, setRsaPrivateKey] = useState('');
  const [rsaKeySize, setRsaKeySize] = useState(2048);
  const [rsaGenerating, setRsaGenerating] = useState(false);

  // Reset fields when encryption method changes (except on initial mount)
  useEffect(() => {
    setInput('');
    setOutput('');
    setKey('');
    setIv('');
    if (activeMethod !== 'rsa') {
      setRsaPublicKey('');
      setRsaPrivateKey('');
    }
  }, [activeMethod]);

  // Persist last input
  useEffect(() => {
    const last = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (last) {
      try {
        const data = JSON.parse(last);
        setInput(data.input || '');
        setActiveMethod(data.method || 'base64');
        setOperation(data.operation || 'encode');
        // Set the category based on the method
        const method = ENCRYPTION_METHODS.find(m => m.id === data.method);
        setActiveCategory(method?.category || 'basic');
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const data = { input, method: activeMethod, operation };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [input, activeMethod, operation]);

  const processInput = () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to process",
        variant: "destructive"
      });
      return;
    }

    try {
      let result = '';
      const method = ENCRYPTION_METHODS.find(m => m.id === activeMethod);

      switch (activeMethod) {
        case 'base64':
          if (operation === 'encode') {
            result = btoa(input);
          } else {
            result = atob(input);
          }
          break;

        case 'url-encoding':
          if (operation === 'encode') {
            result = encodeURIComponent(input);
          } else {
            result = decodeURIComponent(input);
          }
          break;

        case 'hex':
          if (operation === 'encode') {
            result = Array.from(input).map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
          } else {
            result = input.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
          }
          break;

        case 'binary':
          if (operation === 'encode') {
            result = Array.from(input).map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
          } else {
            result = input.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
          }
          break;

        case 'md5':
          result = CryptoJS.MD5(input).toString();
          break;
        case 'sha1':
          result = CryptoJS.SHA1(input).toString();
          break;
        case 'sha256':
          result = CryptoJS.SHA256(input).toString();
          break;
        case 'sha512':
          result = CryptoJS.SHA512(input).toString();
          break;

        case 'aes':
          if (!key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (operation === 'encode') {
            const encrypted = CryptoJS.AES.encrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.AES.decrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'des':
          if (!key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (operation === 'encode') {
            const encrypted = CryptoJS.DES.encrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.DES.decrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case '3des':
          if (!key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (operation === 'encode') {
            const encrypted = CryptoJS.TripleDES.encrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.TripleDES.decrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'blowfish':
          if (!key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (operation === 'encode') {
            const encrypted = CryptoJS.Blowfish.encrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.Blowfish.decrypt(input, key, {
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
              iv: iv ? CryptoJS.enc.Hex.parse(iv) : undefined
            });
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'rc4':
          if (!key.trim()) {
            toast({
              title: "Key required",
              description: "Please enter an encryption key",
              variant: "destructive"
            });
            return;
          }
          
          if (operation === 'encode') {
            const encrypted = CryptoJS.RC4.encrypt(input, key);
            result = encrypted.toString();
          } else {
            const decrypted = CryptoJS.RC4.decrypt(input, key);
            result = decrypted.toString(CryptoJS.enc.Utf8);
          }
          break;

        case 'sha3-256':
          result = CryptoJS.SHA3(input, { outputLength: 256 }).toString();
          break;

        case 'sha3-512':
          result = CryptoJS.SHA3(input, { outputLength: 512 }).toString();
          break;

        case 'ripemd160':
          result = CryptoJS.RIPEMD160(input).toString();
          break;

        case 'whirlpool':
          // Whirlpool not available in CryptoJS, using SHA-512 as alternative
          result = CryptoJS.SHA512(input).toString();
          break;

        case 'rsa':
          if (operation === 'encode') {
            if (!rsaPublicKey.trim()) {
              toast({
                title: 'Public key required',
                description: 'Please enter a valid RSA public key (PEM format)',
                variant: 'destructive',
              });
              return;
            }
            try {
              const pub = forge.pki.publicKeyFromPem(rsaPublicKey);
              const encrypted = pub.encrypt(forge.util.encodeUtf8(input), 'RSA-OAEP');
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
            if (!rsaPrivateKey.trim()) {
              toast({
                title: 'Private key required',
                description: 'Please enter a valid RSA private key (PEM format)',
                variant: 'destructive',
              });
              return;
            }
            try {
              const priv = forge.pki.privateKeyFromPem(rsaPrivateKey);
              const decoded = forge.util.decode64(input);
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

      setOutput(result);
      toast({
        title: "Success",
        description: `${operation === 'encode' ? 'Encoded' : 'Decoded'} successfully`
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
    setInput('');
    setOutput('');
    setKey('');
    setIv('');
  };

  const swapInputs = () => {
    setInput(output);
    setOutput(input);
    setOperation(operation === 'encode' ? 'decode' : 'encode');
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let keyLength = 8; // default
    
    switch (activeMethod) {
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
    setKey(randomKey);
  };

  const generateRandomIv = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIv = Array.from({ length: 16 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    setIv(randomIv);
  };

  const currentMethod = ENCRYPTION_METHODS.find(m => m.id === activeMethod);
  const needsKey = ["aes", "des", "3des", "blowfish", "rc4"].includes(activeMethod);

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
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
                      variant={activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setActiveMethod(method.id);
                        setActiveCategory(method.category);
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
                      variant={activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setActiveMethod(method.id);
                        setActiveCategory(method.category);
                        if (method.category === 'hash') {
                          setOperation('encode');
                        }
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
                      variant={activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setActiveMethod(method.id);
                        setActiveCategory(method.category);
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
                      variant={activeMethod === method.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        activeMethod === method.id 
                          ? "bg-gray-600 text-white hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setActiveMethod(method.id);
                        setActiveCategory(method.category);
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
                variant={operation === 'encode' ? "default" : "outline"}
                onClick={() => setOperation('encode')}
                disabled={['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(activeMethod)}
                className={operation === 'encode' ? "bg-[#2d1c0f] text-white hover:bg-[#444]" : ""}
                style={{ pointerEvents: ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(activeMethod) ? 'none' : 'auto' }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Encode
              </Button>
              <Button
                variant={operation === 'decode' ? "default" : "outline"}
                onClick={() => setOperation('decode')}
                disabled={['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(activeMethod)}
                className={operation === 'decode' ? "bg-[#2d1c0f] text-white hover:bg-[#444]" : ""}
                style={{ pointerEvents: ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'whirlpool'].includes(activeMethod) ? 'none' : 'auto' }}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Decode
              </Button>
            </div>
          </div>

          {/* RSA Key Fields */}
          {activeMethod === 'rsa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="rsa-public">Public Key (PEM)</Label>
                <Textarea
                  id="rsa-public"
                  value={rsaPublicKey}
                  onChange={e => setRsaPublicKey(e.target.value)}
                  placeholder="Paste or generate a public key (PEM)"
                  rows={6}
                  className="font-mono"
                />
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(rsaPublicKey)} disabled={!rsaPublicKey}>Copy</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-private">Private Key (PEM)</Label>
                <Textarea
                  id="rsa-private"
                  value={rsaPrivateKey}
                  onChange={e => setRsaPrivateKey(e.target.value)}
                  placeholder="Paste or generate a private key (PEM)"
                  rows={6}
                  className="font-mono"
                />
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(rsaPrivateKey)} disabled={!rsaPrivateKey}>Copy</Button>
                </div>
              </div>
            </div>
          )}

          {/* RSA Key Generation */}
          {activeMethod === 'rsa' && (
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="rsa-keysize">Key Size:</Label>
              <Select value={String(rsaKeySize)} onValueChange={v => setRsaKeySize(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="2048">2048</SelectItem>
                  <SelectItem value="4096">4096</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={async () => {
                setRsaGenerating(true);
                try {
                  await new Promise(resolve => setTimeout(resolve, 100)); // allow UI update
                  forge.pki.rsa.generateKeyPair({bits: rsaKeySize, workers: -1}, (err, keypair) => {
                    setRsaGenerating(false);
                    if (err) {
                      toast({ title: 'Key generation error', description: String(err), variant: 'destructive' });
                      return;
                    }
                    setRsaPublicKey(forge.pki.publicKeyToPem(keypair.publicKey));
                    setRsaPrivateKey(forge.pki.privateKeyToPem(keypair.privateKey));
                    toast({ title: 'Key pair generated', description: 'RSA key pair generated successfully' });
                  });
                } catch (e) {
                  setRsaGenerating(false);
                  toast({ title: 'Key generation error', description: String(e), variant: 'destructive' });
                }
              }} disabled={rsaGenerating}>
                {rsaGenerating ? 'Generating...' : 'Generate Key Pair'}
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
                        type={showKey ? "text" : "password"}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter encryption key"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        type={showIv ? "text" : "password"}
                        value={iv}
                        onChange={(e) => setIv(e.target.value)}
                        placeholder={activeMethod === 'rc4' ? "Not used for RC4" : "Enter IV (optional)"}
                        disabled={activeMethod === 'rc4'}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowIv(!showIv)}
                        disabled={activeMethod === 'rc4'}
                      >
                        {showIv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" onClick={generateRandomIv} disabled={activeMethod === 'rc4'}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* AES Specific Options */}
              {activeMethod === 'aes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="aes-mode">AES Mode</Label>
                    <Select value={aesMode} onValueChange={setAesMode}>
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
                  <div className="space-y-2">
                    <Label htmlFor="aes-padding">Padding</Label>
                    <Select value={aesPadding} onValueChange={setAesPadding}>
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardContent className="p-6">
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
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Enter text to ${operation}...`}
                className="min-h-[200px] font-mono"
              />
              
              <div className="flex gap-2">
                <Button onClick={processInput} className="flex-1 bg-[#2d1c0f] text-white hover:bg-[#444] px-8 py-2 rounded">
                  {operation === 'encode' ? 'Encode' : 'Decode'}
                </Button>
                <Button variant="outline" onClick={swapInputs}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Output</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(output)}
                disabled={!output}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="min-h-[200px] p-3 border rounded-md bg-muted/30 font-mono text-sm whitespace-pre-wrap overflow-auto">
                {output || 'Output will appear here...'}
              </div>
              
              {output && (
                <div className="text-xs text-muted-foreground">
                  Length: {output.length} characters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 