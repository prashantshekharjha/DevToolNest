import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Wand2, Copy, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  isValid: boolean;
  error?: string;
  objectCount?: number;
  characterCount?: number;
}

export default function PrettyJSON() {
  const { toast } = useToast();
  const [inputJson, setInputJson] = useState("");
  const [outputJson, setOutputJson] = useState("");
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });

  // Real-time validation as user types
  useEffect(() => {
    validateAndCount(inputJson);
  }, [inputJson]);

  const validateAndCount = (json: string) => {
    if (!json.trim()) {
      setValidation({ isValid: true });
      return;
    }

    try {
      const parsed = JSON.parse(json);
      const objectCount = JSON.stringify(parsed).split('{').length - 1;
      const characterCount = json.length;
      
      setValidation({
        isValid: true,
        objectCount,
        characterCount
      });
    } catch (error) {
      setValidation({
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid JSON"
      });
    }
  };

  const formatJson = () => {
    if (!inputJson.trim()) {
      toast({
        title: "Error",
        description: "Please enter some JSON to format",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutputJson(formatted);
      validateAndCount(inputJson);
      
      toast({
        title: "JSON formatted successfully",
        description: "Your JSON has been formatted and validated"
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: error instanceof Error ? error.message : "Please check your JSON syntax",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "JSON copied to clipboard"
    });
  };

  const downloadJson = () => {
    if (!outputJson) return;
    
    const blob = new Blob([outputJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputJson(content);
      validateAndCount(content);
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    setInputJson("");
    setOutputJson("");
    setValidation({ isValid: true });
  };

  return (
    <>
      <Header 
        title="PrettyJSON - JSON Formatter" 
        subtitle="Format and validate JSON data"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Input */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Input JSON</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your JSON here..."
                value={inputJson}
                onChange={(e) => {
                  setInputJson(e.target.value);
                  validateAndCount(e.target.value);
                }}
                className="font-mono text-sm min-h-[400px]"
              />
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={uploadFile}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Formatted JSON</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={formatJson}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Format
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(outputJson)} disabled={!outputJson}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadJson} disabled={!outputJson}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="code-editor min-h-[400px] overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {outputJson || "Formatted JSON will appear here..."}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Status */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {validation.isValid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Valid JSON</span>
                  {validation.objectCount !== undefined && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {validation.objectCount} objects
                      </span>
                    </>
                  )}
                  {validation.characterCount !== undefined && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {validation.characterCount} characters
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Invalid JSON</span>
                  {validation.error && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{validation.error}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
