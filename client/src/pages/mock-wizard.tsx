import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MockWizard() {
  const { toast } = useToast();
  const [schema, setSchema] = useState(`{
  "type": "object",
  "properties": {
    "id": {"type": "integer"},
    "name": {"type": "string"},
    "email": {"type": "string", "format": "email"},
    "age": {"type": "integer", "minimum": 18, "maximum": 100},
    "address": {
      "type": "object",
      "properties": {
        "street": {"type": "string"},
        "city": {"type": "string"},
        "country": {"type": "string"}
      }
    },
    "hobbies": {
      "type": "array",
      "items": {"type": "string"}
    }
  }
}`);
  const [recordCount, setRecordCount] = useState(5);
  const [locale, setLocale] = useState("en_US");
  const [seed, setSeed] = useState(12345);
  const [generatedData, setGeneratedData] = useState("");

  // Simple mock data generator (in a real app, you'd use faker.js)
  const generateMockData = () => {
    try {
      const parsedSchema = JSON.parse(schema);
      let mockData = [];

      for (let i = 0; i < recordCount; i++) {
        const record = generateFromSchema(parsedSchema, i + 1);
        mockData = [...mockData, record];
      }

      const formatted = JSON.stringify(mockData, null, 2);
      setGeneratedData(formatted);

      toast({
        title: "Mock data generated",
        description: `Generated ${recordCount} records successfully`
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Invalid schema format",
        variant: "destructive"
      });
    }
  };

  const generateFromSchema = (schema: any, index: number): any => {
    if (schema.type === "object" && schema.properties) {
      const obj: any = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        obj[key] = generateFromSchema(prop as any, index);
      }
      return obj;
    }

    if (schema.type === "array" && schema.items) {
      const count = Math.floor(Math.random() * 3) + 1;
      return Array.from({ length: count }, (_, i) => generateFromSchema(schema.items, i));
    }

    if (schema.type === "string") {
      if (schema.format === "email") {
        return `user${index}@example.com`;
      }
      return `Sample ${schema.format || 'text'} ${index}`;
    }

    if (schema.type === "integer") {
      const min = schema.minimum || 1;
      const max = schema.maximum || 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    if (schema.type === "boolean") {
      return Math.random() > 0.5;
    }

    return null;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedData);
    toast({
      title: "Copied",
      description: "Mock data copied to clipboard"
    });
  };

  const downloadJson = () => {
    const blob = new Blob([generatedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mock-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header 
        title="MockWizard - Mock Data Generator" 
        subtitle="Generate realistic mock data"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Schema Input */}
          <Card>
            <CardHeader>
              <CardTitle>JSON Schema or Sample</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your JSON schema or sample data..."
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="record-count">Records Count</Label>
                  <Input
                    id="record-count"
                    type="number"
                    value={recordCount}
                    onChange={(e) => setRecordCount(Number(e.target.value))}
                    min={1}
                    max={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Locale</Label>
                  <Select value={locale} onValueChange={setLocale}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="en_UK">English (UK)</SelectItem>
                      <SelectItem value="de_DE">German</SelectItem>
                      <SelectItem value="fr_FR">French</SelectItem>
                      <SelectItem value="es_ES">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seed">Seed</Label>
                  <Input
                    id="seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={generateMockData}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Mock Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Data */}
          {generatedData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Mock Data</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadJson}>
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="code-editor max-h-96 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap">{generatedData}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
