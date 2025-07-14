import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Wand2, Copy, Download, CheckCircle, AlertCircle, Minimize2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as yaml from 'js-yaml';

const LANGUAGES = [
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "XML", value: "xml" },
  { label: "Plain Text", value: "text" },
];

function beautify(content: string, lang: string) {
  try {
    if (lang === "json") {
      return JSON.stringify(JSON.parse(content), null, 2);
    } else if (lang === "yaml") {
      const obj = yaml.load(content);
      return yaml.dump(obj, { indent: 2 });
    } else if (lang === "xml") {
      // Simple XML beautifier
      const PADDING = "  ";
      let formatted = "";
      const reg = /(>)(<)(\/*)/g;
      let xml = content.replace(reg, "$1\r\n$2$3");
      let pad = 0;
      xml.split("\r\n").forEach((node) => {
        let indent = 0;
        if (node.match(/.+<\/.+>$/)) {
          indent = 0;
        } else if (node.match(/^<\//)) {
          if (pad !== 0) pad -= 1;
        } else if (node.match(/^<[^!?]+[^\/>]>.*$/)) {
          indent = 1;
        } else {
          indent = 0;
        }
        formatted += PADDING.repeat(pad) + node + "\n";
        pad += indent;
      });
      return formatted.trim();
    } else {
      return content;
    }
  } catch (e) {
    return content;
  }
}

function minify(content: string, lang: string) {
  try {
    if (lang === "json") {
      return JSON.stringify(JSON.parse(content));
    } else if (lang === "yaml") {
      const obj = yaml.load(content);
      return yaml.dump(obj, { indent: 0, flowLevel: -1 });
    } else if (lang === "xml") {
      return content.replace(/>\s+</g, "><").trim();
    } else {
      return content.replace(/\s+/g, " ").trim();
    }
  } catch (e) {
    return content;
  }
}

export default function CodeBeautifier() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("json");
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");
  const [error, setError] = useState("");

  const handleFormat = () => {
    setError("");
    try {
      const formatted = mode === "beautify" ? beautify(input, language) : minify(input, language);
      setOutput(formatted);
      toast({
        title: mode === "beautify" ? "Beautified!" : "Minified!",
        description: `Your ${language.toUpperCase()} has been ${mode === "beautify" ? "beautified" : "minified"}.`,
      });
    } catch (e) {
      setError((e as Error).message || "Failed to format content");
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
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInput(content);
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <>
      <Header 
        title="Code Beautifier" 
        subtitle="Beautify or minify JSON, YAML, XML, or plain text"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle>Code Beautifier</CardTitle>
                <div className="flex gap-2 items-center">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                  <Button
                    variant={mode === "beautify" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("beautify")}
                  >
                    <Maximize2 className="w-4 h-4 mr-1" /> Beautify
                  </Button>
                  <Button
                    variant={mode === "minify" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("minify")}
                  >
                    <Minimize2 className="w-4 h-4 mr-1" /> Minify
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Upload
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <Trash2 className="w-4 h-4 mr-2" /> Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Textarea
                    placeholder={`Paste your ${language.toUpperCase()} here...`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                  />
                  <input
                    id="file-upload"
                    type="file"
                    accept={language === 'json' ? '.json' : language === 'yaml' ? '.yaml,.yml' : language === 'xml' ? '.xml' : '*'}
                    onChange={uploadFile}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className="flex gap-2 mb-2">
                    <Button onClick={handleFormat}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {mode === "beautify" ? "Beautify" : "Minify"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)} disabled={!output}>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadOutput} disabled={!output}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                  <div className="code-editor min-h-[300px] overflow-auto bg-muted rounded p-2">
                    <pre className="text-sm whitespace-pre-wrap">
                      {output || `Your ${mode === "beautify" ? "beautified" : "minified"} ${language.toUpperCase()} will appear here...`}
                    </pre>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-destructive mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
