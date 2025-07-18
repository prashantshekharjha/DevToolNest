import { StateCreator } from 'zustand';
import create from 'zustand';
import { ToolTab } from '@/components/ui/ToolTabs';

const DEFAULT_TAB_STATE = {
  input: '',
  output: '',
  language: 'json',
  mode: 'beautify',
  error: '',
  validation: { valid: false, message: '' },
  isProcessing: false,
  showTemplates: false,
  fontSize: 16,
  maximized: 'none' as 'none' | 'input' | 'output',
};

interface CodeBeautifierTabsState {
  tabs: ToolTab<typeof DEFAULT_TAB_STATE>[];
  activeTabId: string;
  setTabs: (tabs: ToolTab<typeof DEFAULT_TAB_STATE>[]) => void;
  setActiveTabId: (id: string) => void;
  resetTabs: () => void;
}

export type { CodeBeautifierTabsState };

const initialTab = (): ToolTab<typeof DEFAULT_TAB_STATE>[] => [
  { id: 'tab-1', title: 'Tab 1', state: { ...DEFAULT_TAB_STATE } },
];

const CODE_BEAUTIFIER_TABS_LOCAL_STORAGE_KEY = "devtoolnest-code-beautifier-tabs";
const CODE_BEAUTIFIER_ACTIVE_TAB_LOCAL_STORAGE_KEY = "devtoolnest-code-beautifier-active-tab";

function getInitialCodeBeautifierTabsState(): { tabs: ToolTab<typeof DEFAULT_TAB_STATE>[]; activeTabId: string } {
  if (typeof window !== 'undefined') {
    try {
      const savedTabs = localStorage.getItem(CODE_BEAUTIFIER_TABS_LOCAL_STORAGE_KEY);
      const savedActiveTabId = localStorage.getItem(CODE_BEAUTIFIER_ACTIVE_TAB_LOCAL_STORAGE_KEY);
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          return {
            tabs: parsedTabs,
            activeTabId: (savedActiveTabId && parsedTabs.some((t: any) => t.id === savedActiveTabId)) ? savedActiveTabId : parsedTabs[0].id,
          };
        }
      }
    } catch {}
  }
  return { tabs: initialTab(), activeTabId: 'tab-1' };
}

export const useCodeBeautifierTabsStore = create<CodeBeautifierTabsState>(((set: (fn: (state: CodeBeautifierTabsState) => Partial<CodeBeautifierTabsState> | CodeBeautifierTabsState) => void) => {
  const initial = getInitialCodeBeautifierTabsState();
  return {
    tabs: initial.tabs,
    activeTabId: initial.activeTabId,
    setTabs: (tabs: ToolTab<typeof DEFAULT_TAB_STATE>[]) => set(() => ({ tabs })),
    setActiveTabId: (id: string) => set(() => ({ activeTabId: id })),
    resetTabs: () => set(() => ({ tabs: initialTab(), activeTabId: 'tab-1' })),
  };
}));

const DEFAULT_TOKENPEEK_TAB_STATE = {
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

interface TokenPeekTabsState {
  tabs: ToolTab<typeof DEFAULT_TOKENPEEK_TAB_STATE>[];
  activeTabId: string;
  setTabs: (tabs: ToolTab<typeof DEFAULT_TOKENPEEK_TAB_STATE>[]) => void;
  setActiveTabId: (id: string) => void;
  resetTabs: () => void;
}

const initialTokenPeekTab = (): ToolTab<typeof DEFAULT_TOKENPEEK_TAB_STATE>[] => [
  { id: 'tab-1', title: 'Tab 1', state: { ...DEFAULT_TOKENPEEK_TAB_STATE } },
];

const TABS_LOCAL_STORAGE_KEY = "devtoolnest-jwt-token-tabs";
const ACTIVE_TAB_LOCAL_STORAGE_KEY = "devtoolnest-jwt-token-active-tab";

function getInitialTokenPeekTabsState(): { tabs: ToolTab<typeof DEFAULT_TOKENPEEK_TAB_STATE>[]; activeTabId: string } {
  if (typeof window !== 'undefined') {
    try {
      const savedTabs = localStorage.getItem(TABS_LOCAL_STORAGE_KEY);
      const savedActiveTabId = localStorage.getItem(ACTIVE_TAB_LOCAL_STORAGE_KEY);
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          return {
            tabs: parsedTabs,
            activeTabId: (savedActiveTabId && parsedTabs.some((t: any) => t.id === savedActiveTabId)) ? savedActiveTabId : parsedTabs[0].id,
          };
        }
      }
    } catch {}
  }
  return { tabs: initialTokenPeekTab(), activeTabId: 'tab-1' };
}

export const useTokenPeekTabsStore = create<TokenPeekTabsState>(((set: (fn: (state: TokenPeekTabsState) => Partial<TokenPeekTabsState> | TokenPeekTabsState) => void) => {
  const initial = getInitialTokenPeekTabsState();
  return {
    tabs: initial.tabs,
    activeTabId: initial.activeTabId,
    setTabs: (tabs: ToolTab<typeof DEFAULT_TOKENPEEK_TAB_STATE>[]) => set(() => ({ tabs })),
    setActiveTabId: (id: string) => set(() => ({ activeTabId: id })),
    resetTabs: () => set(() => ({ tabs: initialTokenPeekTab(), activeTabId: 'tab-1' })),
  };
}));

export type { TokenPeekTabsState };

const DEFAULT_ENCODER_TAB_STATE = {
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

interface EncoderDecoderTabsState {
  tabs: ToolTab<typeof DEFAULT_ENCODER_TAB_STATE>[];
  activeTabId: string;
  setTabs: (tabs: ToolTab<typeof DEFAULT_ENCODER_TAB_STATE>[]) => void;
  setActiveTabId: (id: string) => void;
  resetTabs: () => void;
}

const initialEncoderTab = (): ToolTab<typeof DEFAULT_ENCODER_TAB_STATE>[] => [
  { id: 'tab-1', title: 'Tab 1', state: { ...DEFAULT_ENCODER_TAB_STATE } },
];

const ENCODER_TABS_LOCAL_STORAGE_KEY = "devtoolnest-encoder-tabs";
const ENCODER_ACTIVE_TAB_LOCAL_STORAGE_KEY = "devtoolnest-encoder-active-tab";

function getInitialEncoderTabsState(): { tabs: ToolTab<typeof DEFAULT_ENCODER_TAB_STATE>[]; activeTabId: string } {
  if (typeof window !== 'undefined') {
    try {
      const savedTabs = localStorage.getItem(ENCODER_TABS_LOCAL_STORAGE_KEY);
      const savedActiveTabId = localStorage.getItem(ENCODER_ACTIVE_TAB_LOCAL_STORAGE_KEY);
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          return {
            tabs: parsedTabs,
            activeTabId: (savedActiveTabId && parsedTabs.some((t: any) => t.id === savedActiveTabId)) ? savedActiveTabId : parsedTabs[0].id,
          };
        }
      }
    } catch {}
  }
  return { tabs: initialEncoderTab(), activeTabId: 'tab-1' };
}

export const useEncoderDecoderTabsStore = create<EncoderDecoderTabsState>(((set: (fn: (state: EncoderDecoderTabsState) => Partial<EncoderDecoderTabsState> | EncoderDecoderTabsState) => void) => {
  const initial = getInitialEncoderTabsState();
  return {
    tabs: initial.tabs,
    activeTabId: initial.activeTabId,
    setTabs: (tabs: ToolTab<typeof DEFAULT_ENCODER_TAB_STATE>[]) => set(() => ({ tabs })),
    setActiveTabId: (id: string) => set(() => ({ activeTabId: id })),
    resetTabs: () => set(() => ({ tabs: initialEncoderTab(), activeTabId: 'tab-1' })),
  };
}));

export type { EncoderDecoderTabsState }; 