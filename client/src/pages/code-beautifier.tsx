import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Trash2, Wand2, Minimize2, Maximize2, Type, AlertCircle, CheckCircle, XCircle, RotateCcw, FileText, Code, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { ToolTabs, ToolTab } from "@/components/ui/ToolTabs";
import { v4 as uuidv4 } from "uuid";
import { useCodeBeautifierTabsStore } from '@/lib/toolTabsStore';
import JSON5 from 'json5';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import Hjson from 'hjson';

const LANGUAGES = [
  { label: 'JSON', value: 'json', ext: 'json', mime: 'application/json' },
  { label: 'YAML', value: 'yaml', ext: 'yaml', mime: 'text/yaml' },
  { label: 'XML', value: 'xml', ext: 'xml', mime: 'application/xml' },
  { label: 'JavaScript', value: 'javascript', ext: 'js', mime: 'application/javascript' },
  { label: 'TypeScript', value: 'typescript', ext: 'ts', mime: 'application/typescript' },
  { label: 'HTML', value: 'html', ext: 'html', mime: 'text/html' },
  { label: 'CSS', value: 'css', ext: 'css', mime: 'text/css' },
  { label: 'SCSS', value: 'scss', ext: 'scss', mime: 'text/x-scss' },
  { label: 'SQL', value: 'sql', ext: 'sql', mime: 'text/x-sql' },
  { label: 'Markdown', value: 'markdown', ext: 'md', mime: 'text/markdown' },
  { label: 'GraphQL', value: 'graphql', ext: 'graphql', mime: 'application/graphql' },
  { label: 'TOML', value: 'toml', ext: 'toml', mime: 'text/x-toml' },
  { label: 'INI', value: 'ini', ext: 'ini', mime: 'text/x-ini' },
  { label: 'Text', value: 'text', ext: 'txt', mime: 'text/plain' },
];

const LANGUAGE_TEMPLATES: { [key: string]: string } = {
  json: '{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "Sample JSON"\n}',
  yaml: 'name: example\nversion: 1.0.0\ndescription: Sample YAML',
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>Sample XML</item>\n</root>',
  javascript: 'function example() {\n  console.log("Hello World");\n}',
  typescript: 'interface Example {\n  name: string;\n  value: number;\n}\n\nconst example: Example = {\n  name: "test",\n  value: 42\n};',
  html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Example</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
  css: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
  scss: '$primary-color: #0077ff;\nbody {\n  color: $primary-color;\n  font-family: Arial, sans-serif;\n}',
  sql: 'SELECT id, name, email\nFROM users\nWHERE active = true\nORDER BY name;',
  markdown: '# Example\n\nThis is a **sample** markdown document.\n\n- Item 1\n- Item 2\n- Item 3',
  graphql: 'query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n    email\n  }\n}',
  toml: '[package]\nname = "example"\nversion = "1.0.0"\n\n[dependencies]\nreact = "*"\ntypescript = "*"',
  ini: '[database]\nhost = localhost\nport = 5432\nname = mydb\n\n[server]\nport = 3000\ndebug = true',
  text: 'This is a sample text document.\nYou can format it as needed.'
};

function autoFixJson(input: string): string {
  // This function can be simplified as Hjson/JSON5 are very tolerant
  return input;
}

function autoFixXml(input: string): string {
  // Attempt to auto-close tags and fix common XML issues
  // 1. Remove newlines and extra whitespace from inside tags
  let fixed = input.replace(/<([^>]+)>/g, (match) => match.replace(/[\n\r\s]+/g, ' '));
  // 2. Remove illegal characters
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  return fixed;
}

function beautify(content: string, lang: string, toast: any): string {
  try {
    const trimmed = content.trim();
    if (!trimmed) return '';
    switch (lang) {
      case 'json': {
        try {
          return JSON.stringify(JSON.parse(trimmed), null, 2);
        } catch (strictErr) {
          try {
            const hjsonParsed = Hjson.parse(trimmed);
            toast({
              title: 'Warning',
              description: 'Input is not valid strict JSON, but was parsed as tolerant Hjson.',
              variant: 'destructive',
            });
            return JSON.stringify(hjsonParsed, null, 2);
          } catch (hjsonErr: any) {
            throw new Error('Invalid JSON: ' + (hjsonErr.message || 'Unknown error'));
          }
        }
      }
      case 'yaml': {
        const yaml = require('js-yaml');
        return yaml.dump(yaml.load(trimmed), { indent: 2 });
      }
      case 'xml': {
        try {
          const fixed = autoFixXml(trimmed);
          const parser = new XMLParser({
            ignoreAttributes: false,
            allowBooleanAttributes: true,
            parseTagValue: false,
            processEntities: true,
            htmlEntities: true,
            trimValues: false,
            preserveOrder: true,
          });
          const parsed = parser.parse(fixed);
          const builder = new XMLBuilder({ format: true, indentBy: '  ', ignoreAttributes: false, preserveOrder: true });
          const pretty = builder.build(parsed);
          if (content !== pretty) {
            toast({
              title: 'Warning',
              description: 'Input was auto-corrected and parsed in tolerant mode.',
              variant: 'destructive',
            });
          }
          return pretty;
        } catch (xmlErr: any) {
          throw new Error('Invalid XML: ' + (xmlErr.message || 'Unknown error'));
        }
      }
      case 'javascript':
      case 'typescript':
        // @ts-ignore
        return (window as any).prettier ? (window as any).prettier.format(trimmed, { parser: lang, plugins: (window as any).prettierPlugins }) : trimmed;
      case 'html':
        // @ts-ignore
        return (window as any).prettier ? (window as any).prettier.format(trimmed, { parser: 'html', plugins: (window as any).prettierPlugins }) : trimmed;
      case 'css':
      case 'scss':
        // @ts-ignore
        return (window as any).prettier ? (window as any).prettier.format(trimmed, { parser: lang, plugins: (window as any).prettierPlugins }) : trimmed;
      case 'sql':
        return trimmed.replace(/\s+/g, ' ').replace(/\s*([,;])\s*/g, '$1\n');
      case 'markdown':
        return trimmed.replace(/\n\s*\n/g, '\n\n').trim();
      default:
        return trimmed;
    }
  } catch (e: any) {
    throw new Error(`Beautify failed: ${(typeof e === 'object' && e && 'message' in e ? e.message : String(e)) || e}`);
  }
}

function minify(content: string, lang: string): string {
  try {
    const trimmed = content.trim();
    if (!trimmed) return '';
    switch (lang) {
      case 'json':
        return JSON.stringify(Hjson.parse(trimmed));
      case 'yaml': {
      const yaml = require('js-yaml');
        return yaml.dump(yaml.load(trimmed), { flowLevel: -1 });
      }
      case 'xml':
        return trimmed.replace(/>\s+</g, '><').replace(/\n/g, '').trim();
      case 'javascript':
      case 'typescript':
        // @ts-ignore
        return (window as any).prettier ? (window as any).prettier.format(trimmed, { parser: lang, plugins: (window as any).prettierPlugins, printWidth: 9999 }) : trimmed;
      case 'html':
        // @ts-ignore
        return (window as any).prettier ? (window as any).prettier.format(trimmed, { parser: 'html', plugins: (window as any).prettierPlugins, printWidth: 9999 }) : trimmed;
      case 'css':
      case 'scss':
        // @ts-ignore
        return (window as any).prettier ? (window as any).prettier.format(trimmed, { parser: lang, plugins: (window as any).prettierPlugins, printWidth: 9999 }) : trimmed;
      case 'sql':
        return trimmed.replace(/\s+/g, ' ').trim();
      case 'markdown':
        return trimmed.replace(/\n\s*\n/g, '\n').trim();
      default:
        return trimmed;
    }
  } catch (e: any) {
    throw new Error(`Minify failed: ${(typeof e === 'object' && e && 'message' in e ? e.message : String(e)) || e}`);
  }
}

function validateContent(content: string, lang: string): { valid: boolean; message: string } {
  if (!content.trim()) return { valid: false, message: 'Content is empty' };
  try {
    switch (lang) {
      case 'json':
        JSON.parse(content);
        return { valid: true, message: 'Valid JSON' };
      case 'yaml': {
        require('js-yaml').load(content);
        return { valid: true, message: 'Valid YAML' };
      }
      case 'xml': {
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) throw new Error('Invalid XML');
        return { valid: true, message: 'Valid XML' };
      }
      default:
        return { valid: true, message: 'Content is valid' };
    }
  } catch (e: any) {
    return { valid: false, message: (typeof e === 'object' && e && 'message' in e ? e.message : String(e)) || 'Invalid content' };
  }
}

const DEFAULT_TAB_STATE = {
  input: '',
  output: '',
  language: 'json',
  mode: 'beautify' as 'beautify' | 'minify',
  error: '',
  validation: { valid: false, message: '' },
  isProcessing: false,
  showTemplates: false,
  fontSize: 16,
  maximized: 'none' as 'none' | 'input' | 'output',
  outputEdited: false,
};

const TABS_LOCAL_STORAGE_KEY = "devtoolnest-code-beautifier-tabs";
const ACTIVE_TAB_LOCAL_STORAGE_KEY = "devtoolnest-code-beautifier-active-tab";

export default function CodeBeautifier() {
  const { toast } = useToast();
  const tabs = useCodeBeautifierTabsStore((s: import("@/lib/toolTabsStore").CodeBeautifierTabsState) => s.tabs);
  const setTabs = useCodeBeautifierTabsStore((s: import("@/lib/toolTabsStore").CodeBeautifierTabsState) => s.setTabs);
  const activeTabId = useCodeBeautifierTabsStore((s: import("@/lib/toolTabsStore").CodeBeautifierTabsState) => s.activeTabId);
  const setActiveTabId = useCodeBeautifierTabsStore((s: import("@/lib/toolTabsStore").CodeBeautifierTabsState) => s.setActiveTabId);

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
    setTabs(tabs.map((t: ToolTab<typeof DEFAULT_TAB_STATE>) =>
      t.id === id ? { ...t, state: { ...DEFAULT_TAB_STATE, ...updater(t.state) } } : t
    ));
  };

  const activeTab = tabs.find((t) => t.id === activeTabId)!;
  const {
    input,
    output,
    language,
    mode,
    error,
    validation,
    isProcessing,
    showTemplates,
    fontSize,
    maximized,
    outputEdited = false,
  } = activeTab.state;

  useEffect(() => {
    updateTabState(activeTabId, (state) => ({ ...state, validation: validateContent(state.input, state.language) }));
    // eslint-disable-next-line
  }, [activeTabId, activeTab.state.input, activeTab.state.language]);

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
          // Ensure every tab.state has outputEdited
          const safeTabs = parsedTabs.map((t: any) => ({
            ...t,
            state: { ...DEFAULT_TAB_STATE, ...t.state, outputEdited: t.state?.outputEdited ?? false },
          }));
          setTabs(safeTabs);
          if (savedActiveTabId && safeTabs.some((t: any) => t.id === savedActiveTabId)) {
            setActiveTabId(savedActiveTabId);
          } else {
            setActiveTabId(safeTabs[0].id);
          }
        }
      } catch {}
    }
  }, []);

  // Context menu handlers
  const closeTabsToLeft = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx > 0) {
      const keep = tabs.slice(idx).map(t => ({ ...t, state: { ...DEFAULT_TAB_STATE, ...t.state, outputEdited: t.state?.outputEdited ?? false } }));
      setTabs(keep);
      if (!keep.some(t => t.id === activeTabId)) setActiveTabId(keep[0].id);
    }
  };
  const closeTabsToRight = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx >= 0 && idx < tabs.length - 1) {
      const keep = tabs.slice(0, idx + 1).map(t => ({ ...t, state: { ...DEFAULT_TAB_STATE, ...t.state, outputEdited: t.state?.outputEdited ?? false } }));
      setTabs(keep);
      if (!keep.some(t => t.id === activeTabId)) setActiveTabId(keep[keep.length - 1].id);
    }
  };
  const closeTabsOthers = (id: string) => {
    const keep = tabs.filter(t => t.id === id).map(t => ({ ...t, state: { ...DEFAULT_TAB_STATE, ...t.state, outputEdited: t.state?.outputEdited ?? false } }));
    setTabs(keep);
    setActiveTabId(id);
  };

  const handleFormat = (modeOverride?: 'beautify' | 'minify') => {
    const currentMode = modeOverride || mode;
    updateTabState(activeTabId, (state) => ({ ...state, error: '' }));
    try {
      const formatted = currentMode === 'beautify' ? beautify(input, language, toast) : minify(input, language);
      updateTabState(activeTabId, (state) => ({ ...state, output: formatted, outputEdited: false }));
      toast({
        title: currentMode === 'beautify' ? 'Beautified!' : 'Minified!',
        description: `Your ${language.toUpperCase()} has been ${currentMode === 'beautify' ? 'beautified' : 'minified'}.`,
      });
    } catch (e: any) {
      updateTabState(activeTabId, (state) => ({ ...state, error: (typeof e === 'object' && e && 'message' in e ? e.message : String(e)) || 'Failed to format content', output: '' }));
      toast({
        title: 'Error',
        description: (typeof e === 'object' && e && 'message' in e ? e.message : String(e)) || 'Failed to format content',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Content copied to clipboard' });
  };

  const downloadOutput = () => {
    if (!output) return;
    const ext = LANGUAGES.find(l => l.value === language)?.ext || 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    updateTabState(activeTabId, (state) => ({ ...state, input: '', output: '', error: '' }));
  };

  const loadTemplate = () => {
    const template = LANGUAGE_TEMPLATES[language] || '';
    updateTabState(activeTabId, (state) => ({ ...state, input: template }));
    toast({ title: 'Template loaded', description: `Loaded ${language.toUpperCase()} template` });
  };

  const swapContent = () => {
    updateTabState(activeTabId, (state) => ({ ...state, input: output, output: '', error: '' }));
  };

  return (
    <div className="flex flex-col h-screen min-h-0 bg-[#fcfbfa] dark:bg-[#1a1a1a]">
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
          const {
            input,
            output,
            language,
            mode,
            error,
            validation,
            isProcessing,
            showTemplates,
            fontSize,
            maximized,
            outputEdited = false,
          } = tab.state;
          return (
            <div className="flex flex-col h-full min-h-0">
              {/* Header - always visible, floats above maximized editor */}
              <div className={`flex-shrink-0 bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 p-4 z-50 ${maximized !== 'none' ? 'fixed top-0 left-0 w-full shadow-lg' : ''}`}
                style={maximized !== 'none' ? { position: 'fixed', top: 0, left: 0, width: '100vw' } : {}}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Code Beautifier</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Professional code formatting and minification</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={language} onValueChange={val => updateTabState(tab.id, state => ({ ...state, language: val }))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {lang.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => updateTabState(tab.id, state => ({ ...state, showTemplates: !state.showTemplates }))}>
                      <Type className="w-4 h-4 mr-1" /> Templates
                    </Button>
                    <Button variant="outline" onClick={() => updateTabState(tab.id, state => ({ ...state, fontSize: Math.max(12, state.fontSize - 2) }))}>
                      A-
                    </Button>
                    <Button variant="outline" onClick={() => updateTabState(tab.id, state => ({ ...state, fontSize: Math.min(32, state.fontSize + 2) }))}>
                      A+
                    </Button>
                  </div>
                </div>
              </div>
              {/* Add padding to top of maximized editor so content is not hidden behind header */}
              {maximized !== 'none' && <div style={{ height: 80 }} />}
              {showTemplates && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-[#3a3a3a] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Language Templates</h3>
                    <Button size="sm" onClick={loadTemplate} disabled={!LANGUAGE_TEMPLATES[language]}>
                      Load Template
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {LANGUAGES.map(lang => (
                  <Button
                        key={lang.value}
                        variant="ghost"
                    size="sm"
                        onClick={() => updateTabState(tab.id, state => ({ ...state, language: lang.value }))}
                        className={language === lang.value ? 'bg-blue-100 dark:bg-blue-900' : ''}
                      >
                        {lang.label}
                  </Button>
                    ))}
                  </div>
                </div>
              )}
              {/* Main Content */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Input Panel */}
                {(maximized === 'none' || maximized === 'input') && (
                  <div className={`flex-1 flex flex-col min-w-0 min-h-0 h-full border-r border-gray-200 dark:border-gray-700 z-10 ${maximized === 'input' ? 'absolute inset-0 bg-white dark:bg-[#23272e] z-50' : ''}`} style={maximized === 'input' ? { position: 'absolute', left: 0, top: 0, width: '100vw', height: '100vh' } : {}}>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-gray-900 dark:text-white">Input</h2>
                      {validation.valid && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />Valid
                        </Badge>
                      )}
                      {!validation.valid && validation.message && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />Invalid
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(input)} disabled={!input}>
                        <Copy className="w-4 h-4 mr-1" />Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAll}>
                        <Trash2 className="w-4 h-4 mr-1" />Clear
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => updateTabState(tab.id, state => ({ ...state, maximized: maximized === 'input' ? 'none' : 'input' }))} title={maximized === 'input' ? 'Minimize' : 'Maximize'}>
                        {maximized === 'input' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className={`flex-1 min-h-0 h-full overflow-hidden min-h-[200px] ${maximized === 'input' ? '' : 'max-h-[calc(100vh-300px)]'}` }>
                    <Editor
                      height="100%"
                      language={language}
                      value={input}
                      onChange={value => updateTabState(tab.id, state => ({ ...state, input: value || '' }))}
                      theme="vs-light"
                      options={{
                        minimap: { enabled: false },
                        fontSize,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        padding: { top: 16 },
                        folding: true,
                        foldingStrategy: 'indentation',
                        showFoldingControls: 'always',
                        renderLineHighlight: 'all',
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: 'line',
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          verticalScrollbarSize: 12,
                          horizontalScrollbarSize: 12,
                        },
                      }}
                    />
                  </div>
                  {validation.message && (
                    <div className={`p-3 text-sm border-t ${validation.valid ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800' : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center gap-2">
                        {validation.valid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {validation.message}
                      </div>
                    </div>
                  )}
                  </div>
                )}
                {/* Controls Panel */}
                {maximized === 'none' && (
                  <div className="w-56 bg-gray-50 dark:bg-[#3a3a3a] border-l border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4 min-h-0 h-full overflow-y-auto">
                  <div className="space-y-3">
            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() => { updateTabState(tab.id, state => ({ ...state, mode: 'beautify', error: '' })); handleFormat('beautify'); }}
              disabled={!validation.valid || isProcessing}
            >
              <Wand2 className="w-5 h-5 mr-2" />Beautify
            </Button>
            <Button
              className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-semibold"
              onClick={() => { updateTabState(tab.id, state => ({ ...state, mode: 'minify', error: '' })); handleFormat('minify'); }}
              disabled={!validation.valid || isProcessing}
            >
              <Minimize2 className="w-5 h-5 mr-2" />Minify
            </Button>
          </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={swapContent} disabled={!output}>
                      <RotateCcw className="w-4 h-4 mr-2" />Swap Content
                  </Button>
                    <Button variant="outline" className="w-full" onClick={() => copyToClipboard(output)} disabled={!output}>
                      <Copy className="w-4 h-4 mr-2" />Copy Output
                  </Button>
                    <Button variant="outline" className="w-full" onClick={downloadOutput} disabled={!output}>
                      <Download className="w-4 h-4 mr-2" />Download
                  </Button>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>Supported Languages:</div>
                      <div className="grid grid-cols-2 gap-1">
                        {LANGUAGES.map(lang => (
                          <div key={lang.value} className="truncate">{lang.label}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {/* Output Panel */}
                {(maximized === 'none' || maximized === 'output') && (
                  <div className={`flex-1 flex flex-col min-w-0 min-h-0 h-full border-l border-gray-200 dark:border-gray-700 z-10 ${maximized === 'output' ? 'absolute inset-0 bg-white dark:bg-[#23272e] z-50' : ''}`} style={maximized === 'output' ? { position: 'absolute', left: 0, top: 0, width: '100vw', height: '100vh' } : {}}>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Output</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)} disabled={!output}>
                        <Copy className="w-4 h-4 mr-1" />Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadOutput} disabled={!output}>
                        <Download className="w-4 h-4 mr-1" />Download
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => updateTabState(tab.id, state => ({ ...state, maximized: maximized === 'output' ? 'none' : 'output' }))} title={maximized === 'output' ? 'Minimize' : 'Maximize'}>
                        {maximized === 'output' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className={`flex-1 min-h-0 h-full overflow-hidden min-h-[200px] ${maximized === 'output' ? '' : 'max-h-[calc(100vh-300px)]'}` }>
                    <Editor
                      height="100%"
                      language={language}
                      value={output}
                      onChange={value => updateTabState(tab.id, state => ({ ...state, output: value || '', outputEdited: true }))}
                      theme="vs-light"
                      options={{
                        minimap: { enabled: false },
                        fontSize,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        padding: { top: 16 },
                        folding: true,
                        foldingStrategy: 'indentation',
                        showFoldingControls: 'always',
                        renderLineHighlight: 'all',
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false, // Make output editable
                        cursorStyle: 'line',
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          verticalScrollbarSize: 12,
                          horizontalScrollbarSize: 12,
                        },
                      }}
                  />
                </div>
                {(outputEdited ?? false) && (
                  <div className="p-2 text-xs text-yellow-700 bg-yellow-50 border-t border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800">
                    Output has been edited manually.
                  </div>
                )}
                {error && (
                    <div className="p-3 bg-red-50 text-red-800 border-t border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}