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

export const useCodeBeautifierTabsStore = create<CodeBeautifierTabsState>(((set: (fn: (state: CodeBeautifierTabsState) => Partial<CodeBeautifierTabsState> | CodeBeautifierTabsState) => void) => ({
  tabs: initialTab(),
  activeTabId: 'tab-1',
  setTabs: (tabs: ToolTab<typeof DEFAULT_TAB_STATE>[]) => set(() => ({ tabs })),
  setActiveTabId: (id: string) => set(() => ({ activeTabId: id })),
  resetTabs: () => set(() => ({ tabs: initialTab(), activeTabId: 'tab-1' })),
})));

const DEFAULT_TOKENPEEK_TAB_STATE = {
  tab: "decode",
  headerTab: "json",
  payloadTab: "json",
  token: "",
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

export const useTokenPeekTabsStore = create<TokenPeekTabsState>(((set: (fn: (state: TokenPeekTabsState) => Partial<TokenPeekTabsState> | TokenPeekTabsState) => void) => ({
  tabs: initialTokenPeekTab(),
  activeTabId: 'tab-1',
  setTabs: (tabs: ToolTab<typeof DEFAULT_TOKENPEEK_TAB_STATE>[]) => set(() => ({ tabs })),
  setActiveTabId: (id: string) => set(() => ({ activeTabId: id })),
  resetTabs: () => set(() => ({ tabs: initialTokenPeekTab(), activeTabId: 'tab-1' })),
})));

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

export const useEncoderDecoderTabsStore = create<EncoderDecoderTabsState>(((set: (fn: (state: EncoderDecoderTabsState) => Partial<EncoderDecoderTabsState> | EncoderDecoderTabsState) => void) => ({
  tabs: initialEncoderTab(),
  activeTabId: 'tab-1',
  setTabs: (tabs: ToolTab<typeof DEFAULT_ENCODER_TAB_STATE>[]) => set(() => ({ tabs })),
  setActiveTabId: (id: string) => set(() => ({ activeTabId: id })),
  resetTabs: () => set(() => ({ tabs: initialEncoderTab(), activeTabId: 'tab-1' })),
})));

export type { EncoderDecoderTabsState }; 