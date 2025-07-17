import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JWTTabs, JWTTabsList, JWTTabsTrigger, JWTTabsContent } from "@/components/ui/JWTTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Copy, Eye, Edit2, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtVerify, SignJWT, importPKCS8, importSPKI } from 'jose';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { Decoration, DecorationSet } from '@codemirror/view';
import ReactJson from 'react-json-view';
import { ToolTabs, ToolTab } from "@/components/ui/ToolTabs";
import { v4 as uuidv4 } from "uuid";
import { useTokenPeekTabsStore, TokenPeekTabsState } from '@/lib/toolTabsStore';

const ALGORITHMS = [
  { label: 'HS256 (HMAC)', value: 'HS256' },
  { label: 'RS256 (RSA)', value: 'RS256' },
];

const CLAIM_TOOLTIPS: Record<string, string> = {
  iss: 'Issuer: Identifies principal that issued the JWT',
  sub: 'Subject: Identifies principal that is the subject of the JWT',
  aud: 'Audience: Identifies recipients that the JWT is intended for',
  exp: 'Expiration Time: Identifies expiration time on or after which the JWT must not be accepted',
  nbf: 'Not Before: Identifies time before which the JWT must not be accepted',
  iat: 'Issued At: Identifies time at which the JWT was issued',
  jti: 'JWT ID: Unique identifier for the JWT',
};

function decodeBase64Url(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function prettyJSON(obj: any) {
  return JSON.stringify(obj, null, 2);
}

const LOCAL_STORAGE_KEY = "devtoolnest-jwt-token";

// Helper to safely parse JSON for ClaimsTable and handlers
function safeParseJSON(str: string) {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// 3. Create a custom extension to color JWT parts:
// Color palette for JWT parts (cycle through if more parts)
const JWT_PART_COLORS = [
  '#2563eb', // blue
  '#059669', // green
  '#b85c38', // brown
  '#f59e42', // orange
  '#a21caf', // purple
  '#eab308', // yellow
  '#dc2626', // red
  '#0e7490', // teal
  '#7c3aed', // violet
  '#f472b6', // pink
];
function jwtColorExtension() {
  return EditorView.decorations.compute([], state => {
    const widgets: any[] = [];
    const value = state.doc.toString();
    const parts = value.split('.');
    let pos = 0;
    for (let i = 0; i < parts.length; i++) {
      const colorClass = `cm-jwt-part-${i % JWT_PART_COLORS.length}`;
      if (parts[i]) {
        widgets.push(Decoration.mark({ class: colorClass }).range(pos, pos + parts[i].length));
        pos += parts[i].length;
      }
      if (i < parts.length - 1) pos += 1; // skip dot
    }
    return Decoration.set(widgets);
  });
}

// Add CSS for the custom classes (in a global CSS or style tag):
// .cm-jwt-part-0 { color: #2563eb !important; }
// .cm-jwt-part-1 { color: #059669 !important; }
// .cm-jwt-part-2 { color: #b85c38 !important; }
// .cm-jwt-part-3 { color: #f59e42 !important; }
// .cm-jwt-part-4 { color: #a21caf !important; }
// .cm-jwt-part-5 { color: #eab308 !important; }
// .cm-jwt-part-6 { color: #dc2626 !important; }
// .cm-jwt-part-7 { color: #0e7490 !important; }
// .cm-jwt-part-8 { color: #7c3aed !important; }
// .cm-jwt-part-9 { color: #f472b6 !important; }

// Helper to format Unix timestamp to readable date/time
function formatTimestamp(ts: number) {
  if (!ts || isNaN(ts)) return '';
  const date = new Date(ts * 1000);
  return `${date.toLocaleString()} (local)\n${date.toUTCString()} (UTC)`;
}

// Claims Table component
function ClaimsTable({ data, editable, onEdit }: { data: Record<string, any>, editable?: boolean, onEdit?: (key: string, value: any) => void }) {
  return (
    <table className="w-full text-left border-collapse">
      <tbody>
        {Object.entries(data).map(([key, value]) => {
          const isTimestamp = ['iat', 'exp', 'nbf'].includes(key) && typeof value === 'number' && value > 1000000000 && value < 9999999999;
          const valueTooltip = isTimestamp ? formatTimestamp(value) : undefined;
          const keyColorClass = key === 'alg' ? 'text-[#2563eb] font-bold' : key === 'typ' ? 'text-[#a21caf] font-bold' : key === 'exp' ? 'text-[#dc2626] font-bold' : key === 'iat' ? 'text-[#059669] font-bold' : key === 'nbf' ? 'text-[#f59e42] font-bold' : 'text-[#444]';
          return (
            <tr key={key} className="border-b border-[#f3f3f3]">
              <td className={`py-1 pr-4 font-mono text-sm align-top ${keyColorClass}`}>
                <span title={CLAIM_TOOLTIPS[key] || ''} className={CLAIM_TOOLTIPS[key] ? 'underline decoration-dotted cursor-help' : ''}>{key}</span>
              </td>
              <td className="py-1 text-sm text-[#222] align-top">
                {isTimestamp ? (
                  <span title={valueTooltip} className="underline decoration-dotted cursor-help">{value}</span>
                ) : (
                  typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
                )}
                {/* If editable and timestamp, show quick conversion tool */}
                {editable && isTimestamp && onEdit && (
                  <span className="ml-2 text-xs text-[#888]">
                    <button
                      className="underline decoration-dotted cursor-pointer hover:text-[#2563eb]"
                      title="Set to now"
                      onClick={() => onEdit(key, Math.floor(Date.now() / 1000))}
                    >now</button>
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const DEFAULT_TAB_STATE = {
  tab: "decode",
  headerTab: "json",
  payloadTab: "json",
  decodeToken: "",
  encodeToken: "",
  decoded: null as any,
  error: "",
  headerEdit: "",
  payloadEdit: "",
  algorithm: 'HS256',
  secret: "",
  publicKey: "",
  privateKey: "",
  validationResult: null as string | null,
};

export default function TokenPeek() {
  const { toast } = useToast();
  const tabs = useTokenPeekTabsStore((s: TokenPeekTabsState) => s.tabs);
  const setTabs = useTokenPeekTabsStore((s: TokenPeekTabsState) => s.setTabs);
  const activeTabId = useTokenPeekTabsStore((s: TokenPeekTabsState) => s.activeTabId);
  const setActiveTabId = useTokenPeekTabsStore((s: TokenPeekTabsState) => s.setActiveTabId);

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
  const {
    tab,
    headerTab,
    payloadTab,
    decodeToken,
    encodeToken,
    decoded,
    error,
    headerEdit,
    payloadEdit,
    algorithm,
    secret,
    publicKey,
    privateKey,
    validationResult,
  } = activeTab.state;

  // Auto-decode when switching to the decode tab
  useEffect(() => {
    if (tab === 'decode') {
      handleDecodeToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Always restore token from localStorage on mount
  useEffect(() => {
    const last = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (last && !decodeToken) updateTabState(activeTabId, (state) => ({ ...state, decodeToken: last }));
  }, [activeTabId, decodeToken]);
  useEffect(() => {
    // Always save token to localStorage when changed
    if (decodeToken) localStorage.setItem(LOCAL_STORAGE_KEY, decodeToken);
  }, [decodeToken]);

  // Decode JWT
  const handleDecodeToken = () => {
    updateTabState(activeTabId, (state) => {
      const newState = { ...state };
      newState.error = "";
      newState.decoded = null;
      newState.validationResult = null;
      if (!decodeToken.trim()) {
        newState.error = "Please enter a JWT token";
        return newState;
      }
      try {
        const parts = decodeToken.split(".");
        if (parts.length !== 3) throw new Error("Invalid JWT format");
        const header = JSON.parse(decodeBase64Url(parts[0]));
        const payload = JSON.parse(decodeBase64Url(parts[1]));
        const signature = parts[2];
        newState.decoded = { header, payload, signature };
        newState.headerEdit = prettyJSON(header);
        newState.payloadEdit = prettyJSON(payload);
        return newState;
      } catch (err) {
        newState.error = err instanceof Error ? err.message : "Failed to decode token";
        return newState;
      }
    });
  };

  // Edit and update JWT (unsigned)
  const handleEdit = () => {
    updateTabState(activeTabId, (state) => {
      const newState = { ...state };
      try {
        const header = safeParseJSON(headerEdit);
        const payload = safeParseJSON(payloadEdit);
        const base64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        // Preserve signature if present
        const parts = decodeToken.split('.');
        const signature = parts.length === 3 ? parts[2] : '';
        const newToken = `${base64(header)}.${base64(payload)}.${signature}`;
        newState.encodeToken = newToken;
        newState.decoded = { header, payload, signature };
        toast({ title: "Token updated (unsigned)" });
        return newState;
      } catch (e) {
        toast({ title: "Invalid JSON", description: (e as Error).message, variant: "destructive" });
        return newState;
      }
    });
  };

  // Edit and re-sign JWT (if key provided)
  const handleEditAndSign = async () => {
    try {
      const header = safeParseJSON(headerEdit);
      const payload = safeParseJSON(payloadEdit);
      let newToken = '';
      if (algorithm === 'HS256') {
        if (!secret) throw new Error('Secret required for HS256');
        const enc = new TextEncoder();
        const key = enc.encode(secret);
        newToken = await new SignJWT(payload)
          .setProtectedHeader({ alg: 'HS256' })
          .sign(key);
      } else if (algorithm === 'RS256') {
        if (!privateKey) throw new Error('Private key required for RS256');
        const key = await importPKCS8(privateKey, 'RS256');
        newToken = await new SignJWT(payload)
          .setProtectedHeader({ alg: 'RS256' })
          .sign(key);
      } else {
        throw new Error('Unsupported algorithm');
      }
      updateTabState(activeTabId, (state) => {
        const newState = { ...state };
        newState.encodeToken = newToken;
        newState.decoded = null;
        return newState;
      });
      toast({ title: "Token updated and signed!" });
    } catch (e) {
      toast({ title: "Invalid JSON or signing error", description: (e as Error).message, variant: "destructive" });
    }
  };

  // Validate JWT signature
  const handleValidate = async () => {
    try {
      let key;
      if (!decodeToken.trim()) {
        updateTabState(activeTabId, (state) => ({ ...state, validationResult: "No token to validate" }));
        return;
      }
      if (algorithm === 'HS256') {
        if (!secret) throw new Error('Secret required for HS256');
        key = new TextEncoder().encode(secret);
      } else if (algorithm === 'RS256') {
        if (!publicKey) throw new Error('Public key required for RS256');
        key = await importSPKI(publicKey, 'RS256');
      } else {
        throw new Error('Unsupported algorithm');
      }
      await jwtVerify(decodeToken, key);
      updateTabState(activeTabId, (state) => ({ ...state, validationResult: 'Signature is valid!' }));
    } catch (e) {
      updateTabState(activeTabId, (state) => ({ ...state, validationResult: (e as Error).message || 'Signature validation failed' }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Content copied to clipboard" });
  };

  const clearAll = () => {
    updateTabState(activeTabId, (state) => {
      const newState = { ...state };
      newState.decodeToken = "";
      newState.encodeToken = "";
      newState.decoded = null;
      newState.error = "";
      newState.headerEdit = "";
      newState.payloadEdit = "";
      newState.secret = "";
      newState.publicKey = "";
      newState.privateKey = "";
      newState.validationResult = null;
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return newState;
    });
  };

  const jwtParts = decodeToken.split('.')
  const headerPart = jwtParts[0] || ''
  const payloadPart = jwtParts[1] || ''
  const signaturePart = jwtParts[2] || ''

  // Inject CodeMirror JWT part color CSS if not present
  if (typeof window !== 'undefined' && !document.getElementById('jwt-part-colors')) {
    const style = document.createElement('style');
    style.id = 'jwt-part-colors';
    style.innerHTML = `
      .cm-jwt-part-0 { color: #2563eb !important; }
      .cm-jwt-part-1 { color: #059669 !important; }
      .cm-jwt-part-2 { color: #b85c38 !important; }
      .cm-jwt-part-3 { color: #f59e42 !important; }
      .cm-jwt-part-4 { color: #a21caf !important; }
      .cm-jwt-part-5 { color: #eab308 !important; }
      .cm-jwt-part-6 { color: #dc2626 !important; }
      .cm-jwt-part-7 { color: #0e7490 !important; }
      .cm-jwt-part-8 { color: #7c3aed !important; }
      .cm-jwt-part-9 { color: #f472b6 !important; }
    `;
    document.head.appendChild(style);
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col items-center font-sans">
      <ToolTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        onTabAdd={addTab}
        onTabClose={closeTab}
        onTabRename={renameTab}
        renderTabContent={(tab) => {
          const {
            tab: currentTab,
            headerTab: currentHeaderTab,
            payloadTab: currentPayloadTab,
            decodeToken,
            encodeToken,
            decoded,
            error,
            headerEdit,
            payloadEdit,
            algorithm,
            secret,
            publicKey,
            privateKey,
            validationResult,
          } = tab.state;

          return (
            <div className="w-[98vw] max-w-[1500px] mx-auto flex flex-col gap-8 py-8 px-0">
              <JWTTabs value={currentTab} onValueChange={(val) => updateTabState(tab.id, (state) => ({ ...state, tab: val }))} className="w-full">
                <JWTTabsList>
                  <JWTTabsTrigger value="decode">JWT Decoder</JWTTabsTrigger>
                  <JWTTabsTrigger value="edit">JWT Encoder</JWTTabsTrigger>
                </JWTTabsList>
                <JWTTabsContent value="decode" className="flex flex-row gap-8 w-full">
                  {/* Left: JWT Input */}
                  <div className="flex-1">
                    <div className="bg-white border border-[#e5e7eb] rounded-lg p-0 shadow-none flex flex-col">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">JSON WEB TOKEN (JWT)</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decodeToken)}>COPY</Button>
                          <Button size="sm" variant="ghost" onClick={clearAll}>CLEAR</Button>
                        </div>
                      </div>
                      {decoded && <div className="bg-[#eafaf1] text-[#217a3c] px-6 py-2 text-sm border-b border-[#e5e7eb]">Valid JWT</div>}
                      {validationResult && <div className={`px-6 py-2 text-sm border-b border-[#e5e7eb] ${validationResult.includes('valid') ? 'bg-[#eafaf1] text-[#217a3c]' : 'bg-[#fbeaea] text-[#b94a48]'}`}>{validationResult}</div>}
                      {error && <div className="bg-[#fbeaea] text-[#b94a48] px-6 py-2 text-sm border-b border-[#e5e7eb]">{error}</div>}
                      <div className="px-6 py-4 flex flex-col gap-4">
                        <CodeMirror
                          value={decodeToken}
                          onChange={val => updateTabState(tab.id, (state) => ({ ...state, decodeToken: val }))}
                          extensions={[jwtColorExtension(), EditorView.lineWrapping]}
                          basicSetup={{ lineNumbers: false, highlightActiveLine: false }}
                          className="w-full font-mono text-base border-none min-h-[120px] bg-white text-[#2d1c0f]"
                        />
                        <div className="flex justify-end">
                          <Button size="lg" className="bg-[#2d1c0f] text-white hover:bg-[#444] px-8 py-2 rounded" onClick={handleDecodeToken}>Decode</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right: Decoded Info */}
                  <div className="flex-1 flex flex-col gap-6">
                    {/* Header Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">DECODED HEADER</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(prettyJSON(decoded?.header || {}))}>COPY</Button>
                      </div>
                      <div className="px-6 py-4">
                        <Tabs value={currentHeaderTab} onValueChange={(val) => updateTabState(tab.id, (state) => ({ ...state, headerTab: val }))} className="w-full">
                          <TabsList className="mb-2 flex gap-2 bg-transparent border-b border-[#e5e7eb] rounded-none">
                            <TabsTrigger value="json" className="px-2 py-1 text-base font-medium border-b-2 border-transparent data-[state=active]:border-[#2d1c0f] data-[state=active]:text-[#2d1c0f]">JSON</TabsTrigger>
                            <TabsTrigger value="claims" className="px-2 py-1 text-base font-medium border-b-2 border-transparent data-[state=active]:border-[#2d1c0f] data-[state=active]:text-[#2d1c0f]">CLAIMS TABLE</TabsTrigger>
                          </TabsList>
                          <TabsContent value="json">
                            <ReactJson src={decoded?.header || {}} theme="rjv-default" style={{ background: '#fff', borderRadius: 8, padding: 8, fontSize: '1rem' }} displayDataTypes={false} collapsed={false} enableClipboard={false} />
                          </TabsContent>
                          <TabsContent value="claims">
                            {decoded?.header ? <ClaimsTable data={decoded.header} /> : <div className="text-[#a67c52] italic">No claims</div>}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                    {/* Payload Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">DECODED PAYLOAD</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(prettyJSON(decoded?.payload || {}))}>COPY</Button>
                      </div>
                      <div className="px-6 py-4">
                        <Tabs value={currentPayloadTab} onValueChange={(val) => updateTabState(tab.id, (state) => ({ ...state, payloadTab: val }))} className="w-full">
                          <TabsList className="mb-2 flex gap-2 bg-transparent border-b border-[#e5e7eb] rounded-none">
                            <TabsTrigger value="json" className="px-2 py-1 text-base font-medium border-b-2 border-transparent data-[state=active]:border-[#2d1c0f] data-[state=active]:text-[#2d1c0f]">JSON</TabsTrigger>
                            <TabsTrigger value="claims" className="px-2 py-1 text-base font-medium border-b-2 border-transparent data-[state=active]:border-[#2d1c0f] data-[state=active]:text-[#2d1c0f]">CLAIMS TABLE</TabsTrigger>
                          </TabsList>
                          <TabsContent value="json">
                            <ReactJson src={decoded?.payload || {}} theme="rjv-default" style={{ background: '#fff', borderRadius: 8, padding: 8, fontSize: '1rem' }} displayDataTypes={false} collapsed={false} enableClipboard={false} />
                          </TabsContent>
                          <TabsContent value="claims">
                            {decoded?.payload ? <ClaimsTable data={decoded.payload} /> : <div className="text-[#a67c52] italic">No claims</div>}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                    {/* Signature Validation Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">JWT SIGNATURE VERIFICATION <span className="text-[#888] text-base font-normal">(OPTIONAL)</span></span>
                      </div>
                      <div className="px-6 py-4 flex flex-col gap-2">
                        <label className="text-base font-semibold mb-1">SECRET</label>
                        <div className="flex items-center gap-2 mb-2">
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(secret)}>COPY</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateTabState(tab.id, (state) => ({ ...state, secret: "" }))}>CLEAR</Button>
                        </div>
                        <Textarea placeholder="Secret" value={secret} onChange={e => updateTabState(tab.id, (state) => ({ ...state, secret: e.target.value }))} className="font-mono text-base bg-[#f8f8f8] border border-[#e5e7eb] text-[#2d1c0f] rounded" rows={2} />
                        <Button onClick={handleValidate} variant="default" className="bg-[#2d1c0f] hover:bg-[#444] w-fit mt-2">Validate</Button>
                      </div>
                    </div>
                  </div>
                </JWTTabsContent>
                <JWTTabsContent value="edit" className="flex flex-row gap-8 w-full">
                  {/* Left: Edit Header/Payload */}
                  <div className="flex-1 flex flex-col gap-6">
                    {/* Header Edit Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">HEADER: ALGORITHM & TOKEN TYPE</span>
                        <Button size="sm" variant="ghost" onClick={() => updateTabState(tab.id, (state) => ({ ...state, headerEdit: '{}' }))}>CLEAR</Button>
                      </div>
                      <div className="px-6 py-4">
                        <Textarea value={headerEdit} onChange={e => updateTabState(tab.id, (state) => ({ ...state, headerEdit: e.target.value }))} className="font-mono text-base bg-[#f8f8f8] border border-[#e5e7eb] text-[#2d1c0f] rounded min-h-[80px]" />
                        <ClaimsTable data={safeParseJSON(headerEdit)} editable onEdit={(key, value) => updateTabState(tab.id, (state) => ({ ...state, headerEdit: JSON.stringify({ ...safeParseJSON(headerEdit), [key]: value }, null, 2) }))} />
                      </div>
                    </div>
                    {/* Payload Edit Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">PAYLOAD: DATA</span>
                        <Button size="sm" variant="ghost" onClick={() => updateTabState(tab.id, (state) => ({ ...state, payloadEdit: '{}' }))}>CLEAR</Button>
                      </div>
                      <div className="px-6 py-4">
                        <Textarea value={payloadEdit} onChange={e => updateTabState(tab.id, (state) => ({ ...state, payloadEdit: e.target.value }))} className="font-mono text-base bg-[#f8f8f8] border border-[#e5e7eb] text-[#2d1c0f] rounded min-h-[120px]" />
                        <ClaimsTable data={safeParseJSON(payloadEdit)} editable onEdit={(key, value) => updateTabState(tab.id, (state) => ({ ...state, payloadEdit: JSON.stringify({ ...safeParseJSON(payloadEdit), [key]: value }, null, 2) }))} />
                      </div>
                    </div>
                    {/* Secret Edit Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">SIGN JWT: SECRET</span>
                        <Button size="sm" variant="ghost" onClick={() => updateTabState(tab.id, (state) => ({ ...state, secret: "" }))}>CLEAR</Button>
                      </div>
                      <div className="px-6 py-4">
                        <Textarea placeholder="Secret" value={secret} onChange={e => updateTabState(tab.id, (state) => ({ ...state, secret: e.target.value }))} className="font-mono text-base bg-[#f8f8f8] border border-[#e5e7eb] text-[#2d1c0f] rounded" rows={2} />
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleEdit} className="bg-[#2d1c0f] hover:bg-[#444] text-white">Re-encode (unsigned)</Button>
                          <Button onClick={handleEditAndSign} className="bg-[#2d1c0f] hover:bg-[#444] text-white">Re-encode & Sign</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right: Encoded JWT Card */}
                  <div className="flex-1">
                    <div className="bg-white border border-[#e5e7eb] rounded-lg p-0 shadow-none flex flex-col h-full">
                      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e5e7eb]">
                        <span className="text-lg font-semibold tracking-wide text-[#222]">JSON WEB TOKEN</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(encodeToken)}>COPY</Button>
                      </div>
                      <div className="px-6 py-4 flex-1">
                        <CodeMirror
                          value={encodeToken}
                          readOnly
                          extensions={[jwtColorExtension(), EditorView.lineWrapping]}
                          basicSetup={{ lineNumbers: false, highlightActiveLine: false }}
                          className="w-full font-mono text-base border-none min-h-[120px] bg-white text-[#2d1c0f]"
                        />
                      </div>
                    </div>
                  </div>
                </JWTTabsContent>
              </JWTTabs>
            </div>
          );
        }}
      />
    </div>
  );
}
