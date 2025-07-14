import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Trash2, Wand2, Minimize2, AlertCircle, Maximize2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { json as jsonLang } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { xml as xmlLang } from '@codemirror/lang-xml';
import prettier from 'prettier/standalone';
// Prettier v3.x: Use plugins from 'prettier/plugins/*' for non-core languages
import parserYaml from 'prettier/plugins/yaml';

// Add a simple JSON tree view component
function JsonTree({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(true);
  if (typeof data !== 'object' || data === null) return <span>{String(data)}</span>;
  return (
    <div className="font-mono text-sm bg-[#f8f6f2] rounded-lg p-4 mt-4 border border-[#e5e0d8]">
      <button className="mb-2 text-xs text-[#6d4c2f] underline" onClick={() => setExpanded(e => !e)}>
        {expanded ? 'Collapse' : 'Expand'}
      </button>
      {expanded && (
        <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

const LANGUAGES = [
  { label: 'JSON', value: 'json', ext: 'json' },
  { label: 'YAML', value: 'yaml', ext: 'yaml' },
  { label: 'XML', value: 'xml', ext: 'xml' },
  { label: 'Text', value: 'text', ext: 'txt' },
  { label: 'HTTP', value: 'http', ext: 'http' },
  { label: 'cURL', value: 'curl', ext: 'sh' },
];

function getCodeMirrorLang(lang: string) {
  switch (lang) {
    case 'json': return jsonLang();
    case 'yaml': return yamlLang();
    case 'xml': return xmlLang();
    // case 'http': return httpLang(); // No such package, fallback to plain text
    // case 'curl': return httpLang(); // No such package, fallback to plain text
    default: return undefined;
  }
}

function beautify(content: string, lang: string) {
  try {
    if (lang === 'json') {
      // Prettier v3.x: No plugin needed for JSON
      return prettier.format(content, { parser: 'json', tabWidth: 2, useTabs: false, printWidth: 80 });
    } else if (lang === 'yaml') {
      if (!parserYaml) throw new Error('Prettier parserYaml plugin is missing');
      return prettier.format(content, { parser: 'yaml', plugins: [parserYaml], tabWidth: 2, useTabs: false, printWidth: 80 });
    } else if (lang === 'xml') {
      // Simple XML beautifier
      return content.replace(/(>)(<)(\/*)/g, '$1\n$2$3').replace(/\n\s*/g, '\n').trim();
    } else if (lang === 'http' || lang === 'curl') {
      return content.trim();
    } else {
      return content;
    }
  } catch (e) {
    throw new Error((e as Error).message || 'Beautify failed');
  }
}

function minify(content: string, lang: string) {
  try {
    if (lang === 'json') {
      return JSON.stringify(JSON.parse(content));
    } else if (lang === 'yaml') {
      return content.replace(/\n/g, '').replace(/\s+/g, ' ');
    } else if (lang === 'xml') {
      return content.replace(/\s{2,}/g, '').replace(/\n/g, '');
    } else if (lang === 'http' || lang === 'curl') {
      return content.trim();
    } else {
      return content;
    }
  } catch (e) {
    throw new Error((e as Error).message || 'Minify failed');
  }
}

export default function CodeBeautifier() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("json");
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");
  const [error, setError] = useState("");
  const [inputValid, setInputValid] = useState<null | boolean>(null);
  const [inputValidationMsg, setInputValidationMsg] = useState("");
  const [fullscreen, setFullscreen] = useState<"none" | "input" | "output">("none");
  const inputRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Validate input on change or language change
  useEffect(() => {
    if (!input.trim()) {
      setInputValid(null);
      setInputValidationMsg("");
      return;
    }
    try {
      if (language === "json") {
        JSON.parse(input);
        setInputValid(true);
        setInputValidationMsg("Valid JSON");
      } else if (language === "yaml") {
        // Use a try/catch for YAML
        require("js-yaml").load(input);
        setInputValid(true);
        setInputValidationMsg("Valid YAML");
      } else if (language === "xml") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, "application/xml");
        if (doc.getElementsByTagName("parsererror").length > 0) {
          throw new Error("Invalid XML");
        }
        setInputValid(true);
        setInputValidationMsg("Valid XML");
      } else {
        setInputValid(null);
        setInputValidationMsg("");
      }
    } catch (e: any) {
      setInputValid(false);
      setInputValidationMsg(e.message || "Invalid content");
    }
  }, [input, language]);

  const handleFormat = () => {
    setError("");
    try {
      let formatted;
      if (mode === "beautify") {
        formatted = beautify(input, language);
      } else {
        formatted = minify(input, language);
      }
      setOutput(typeof formatted === 'string' ? formatted : String(formatted));
      toast({
        title: mode === "beautify" ? "Beautified!" : "Minified!",
        description: `Your ${language.toUpperCase()} has been ${mode === "beautify" ? "beautified" : "minified"}.`,
      });
    } catch (e) {
      setError((e as Error).message || "Failed to format content");
      setOutput("");
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to format content",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  };

  const downloadOutput = () => {
    if (!output) return;
    const ext = LANGUAGES.find(l => l.value === language)?.ext || 'txt';
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  // Fullscreen styles
  const fullscreenClass =
    "fixed inset-0 z-50 bg-white dark:bg-[#23272e] flex flex-col justify-center items-center w-screen h-screen p-0 m-0 transition-all duration-300";

  return (
    <main className="flex-1 overflow-y-auto p-2 md:p-6 bg-[#fcfbfa] dark:bg-[#f7f5f2] min-h-screen">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2d1c0f] dark:text-[#2d1c0f]">Code Beautifier</h1>
          <p className="text-base sm:text-lg text-[#6d4c2f] dark:text-[#6d4c2f]">Beautify or minify code for API requests and responses</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Input Editor */}
          <div className={`flex-1 min-w-0 ${fullscreen === "input" ? fullscreenClass : ""}`} ref={inputRef}>
            <Card className={`bg-[#fffdfa] dark:bg-[#f7f5f2] shadow-xl rounded-3xl min-h-[350px] w-full ${fullscreen === "input" ? "h-screen m-0 max-w-[98vw]" : "max-w-full"} flex flex-col h-full`}>
              <CardHeader className="flex flex-row items-center justify-between bg-[#fff6ed] rounded-t-2xl p-4 md:p-6 border-b border-[#e5e0d8]">
                <span className="font-semibold text-lg md:text-xl text-[#2d1c0f]">Input</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setFullscreen(fullscreen === "input" ? "none" : "input")}
                    className="text-[#2d1c0f] hover:bg-[#f3e7d9]">
                    {fullscreen === "input" ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} className="border-[#bfae9c] text-[#2d1c0f]">
                    <Trash2 className="w-4 h-4 mr-2" /> Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="relative flex-1 min-w-0">
                  <CodeMirror
                    value={input}
                    height={fullscreen === "input" ? "80vh" : "300px"}
                    minHeight="200px"
                    maxHeight={fullscreen === "input" ? "80vh" : "600px"}
                    extensions={getCodeMirrorLang(language) ? [getCodeMirrorLang(language)!, EditorView.lineWrapping] : [EditorView.lineWrapping]}
                    onChange={val => setInput(val)}
                    theme="light"
                    className="font-mono text-base border-none min-h-[200px] bg-[#fffdfa] text-[#2d1c0f]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(input)}
                    disabled={!input}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                </div>
                {/* Validation message */}
                {inputValid === true && (
                  <div className="flex items-center gap-2 text-green-700 mt-2 p-2 text-base">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">{inputValidationMsg}</span>
                  </div>
                )}
                {inputValid === false && (
                  <div className="flex items-center gap-2 text-red-700 mt-2 p-2 text-base">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold">{inputValidationMsg}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Controls */}
          <div className="flex flex-col items-center justify-center gap-4 w-full sm:w-auto">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-52 bg-[#fffdfa] border-[#bfae9c] text-base sm:text-lg font-semibold">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full sm:w-44 h-12 sm:h-16 text-base sm:text-lg bg-[#6d4c2f] text-white font-bold shadow-md hover:bg-[#4b2e13]"
              onClick={() => { setMode('beautify'); handleFormat(); }}
              size="lg"
            >
              <Wand2 className="w-7 h-7 mr-2" /> Beautify
            </Button>
            <Button
              className="w-full sm:w-44 h-12 sm:h-16 text-base sm:text-lg bg-[#2d1c0f] text-white font-bold shadow-md hover:bg-[#4b2e13]"
              onClick={() => { setMode('minify'); handleFormat(); }}
              size="lg"
            >
              <Minimize2 className="w-7 h-7 mr-2" /> Minify
            </Button>
          </div>

          {/* Output Editor */}
          <div className={`flex-1 min-w-0 ${fullscreen === "output" ? fullscreenClass : ""}`} ref={outputRef}>
            <Card className={`bg-[#fffdfa] dark:bg-[#f7f5f2] shadow-xl rounded-3xl min-h-[350px] w-full ${fullscreen === "output" ? "h-screen m-0 max-w-[98vw]" : "max-w-full"} flex flex-col h-full`}>
              <CardHeader className="flex flex-row items-center justify-between bg-[#fff6ed] rounded-t-2xl p-4 md:p-6 border-b border-[#e5e0d8]">
                <span className="font-semibold text-lg md:text-xl text-[#2d1c0f]">Output</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setFullscreen(fullscreen === "output" ? "none" : "output")}
                    className="text-[#2d1c0f] hover:bg-[#f3e7d9]">
                    {fullscreen === "output" ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)} disabled={!output} className="border-[#bfae9c] text-[#2d1c0f]">
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadOutput} disabled={!output} className="border-[#bfae9c] text-[#2d1c0f]">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="relative flex-1 min-w-0">
                  <CodeMirror
                    value={output}
                    height={fullscreen === "output" ? "80vh" : "300px"}
                    minHeight="200px"
                    maxHeight={fullscreen === "output" ? "80vh" : "600px"}
                    readOnly
                    extensions={getCodeMirrorLang(language) ? [getCodeMirrorLang(language)!, EditorView.lineWrapping] : [EditorView.lineWrapping]}
                    theme="light"
                    className="font-mono text-base border-none min-h-[200px] bg-[#fffdfa] text-[#2d1c0f]"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-destructive mt-2 p-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
