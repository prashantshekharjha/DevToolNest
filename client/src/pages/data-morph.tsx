import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Copy, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataMorph() {
  const { toast } = useToast();
  const [inputData, setInputData] = useState("");
  const [outputData, setOutputData] = useState("");
  const [conversionType, setConversionType] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");

  const csvToJson = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV must have at least a header and one data row");
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    return JSON.stringify(data, null, 2);
  };

  const jsonToCsv = (json: string) => {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) throw new Error("JSON must be an array of objects");
    if (data.length === 0) throw new Error("JSON array cannot be empty");
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ];
    
    return csv.join('\n');
  };

  const convertData = () => {
    if (!inputData.trim()) {
      toast({
        title: "Error",
        description: "Please enter some data to convert",
        variant: "destructive"
      });
      return;
    }

    try {
      let result: string;
      
      if (conversionType === "csv-to-json") {
        result = csvToJson(inputData);
      } else {
        result = jsonToCsv(inputData);
      }
      
      setOutputData(result);
      
      toast({
        title: "Conversion successful",
        description: `Data converted from ${conversionType.replace('-', ' to ').toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Invalid data format",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputData);
    toast({
      title: "Copied",
      description: "Converted data copied to clipboard"
    });
  };

  const downloadData = () => {
    const extension = conversionType === "csv-to-json" ? "json" : "csv";
    const mimeType = conversionType === "csv-to-json" ? "application/json" : "text/csv";
    
    const blob = new Blob([outputData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputData(content);
    };
    reader.readAsText(file);
  };

  const getInputPlaceholder = () => {
    if (conversionType === "csv-to-json") {
      return `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;
    } else {
      return `[
  {
    "name": "John",
    "age": 30,
    "city": "New York"
  },
  {
    "name": "Jane",
    "age": 25,
    "city": "Los Angeles"
  }
]`;
    }
  };

  return (
    <>
      <Header 
        title="DataMorph - CSV/JSON Converter" 
        subtitle="Convert between CSV and JSON formats"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Conversion Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={conversionType} onValueChange={(value: any) => setConversionType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv-to-json">CSV to JSON</SelectItem>
                    <SelectItem value="json-to-csv">JSON to CSV</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={convertData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Input/Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Input ({conversionType.split('-')[0].toUpperCase()})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={getInputPlaceholder()}
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="font-mono text-sm min-h-[400px]"
                />
                <input
                  id="file-upload"
                  type="file"
                  accept={conversionType === "csv-to-json" ? ".csv" : ".json"}
                  onChange={uploadFile}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Output */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Output ({conversionType.split('-')[2].toUpperCase()})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!outputData}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadData} disabled={!outputData}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="code-editor min-h-[400px] overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {outputData || "Converted data will appear here..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
