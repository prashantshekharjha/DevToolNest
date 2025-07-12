import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Copy, Download, Play, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MethodCall {
  className: string;
  methodName: string;
  returnType: string;
  parameters: string[];
  calls: MethodCall[];
}

export default function FlowTrace() {
  const { toast } = useToast();
  const [javaCode, setJavaCode] = useState(`@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User savedUser = userService.save(user);
        return ResponseEntity.ok(savedUser);
    }
}

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    public User save(User user) {
        return userRepository.save(user);
    }
}

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // JPA methods are inherited
}`);

  const [plantUML, setPlantUML] = useState("");
  const [parsedMethods, setParsedMethods] = useState<MethodCall[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const parseJavaCode = () => {
    try {
      // Simple Java parser - in a real implementation, use a proper Java parser
      let methods: MethodCall[] = [];
      const lines = javaCode.split('\n');
      
      let currentClass = '';
      let currentMethod = '';
      let inMethod = false;
      let braceCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Extract class name
        if (line.includes('class ') && !line.includes('//')) {
          const classMatch = line.match(/class\s+(\w+)/);
          if (classMatch) {
            currentClass = classMatch[1];
          }
        }
        
        // Extract method signature
        if (line.includes('public ') && line.includes('(') && !line.includes('//')) {
          const methodMatch = line.match(/public\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)/);
          if (methodMatch) {
            const [, returnType, methodName, params] = methodMatch;
            const parameters = params.split(',').map(p => p.trim()).filter(p => p);
            
            const method: MethodCall = {
              className: currentClass,
              methodName,
              returnType,
              parameters,
              calls: []
            };
            
            // Look for method calls within this method
            let methodBody = '';
            let j = i + 1;
            let methodBraceCount = 0;
            let foundOpenBrace = false;
            
            while (j < lines.length) {
              const bodyLine = lines[j].trim();
              if (bodyLine.includes('{')) {
                methodBraceCount++;
                foundOpenBrace = true;
              }
              if (bodyLine.includes('}')) {
                methodBraceCount--;
                if (methodBraceCount === 0 && foundOpenBrace) {
                  break;
                }
              }
              methodBody += bodyLine + '\n';
              j++;
            }
            
            // Extract method calls from body
            const callMatches = methodBody.match(/(\w+)\.(\w+)\s*\(/g);
            if (callMatches) {
              callMatches.forEach(call => {
                const [, objectName, methodName] = call.match(/(\w+)\.(\w+)\s*\(/) || [];
                if (objectName && methodName) {
                  method.calls = [...method.calls, {
                    className: objectName,
                    methodName,
                    returnType: 'Unknown',
                    parameters: [],
                    calls: []
                  }];
                }
              });
            }
            
            methods = [...methods, method];
          }
        }
      }
      
      setParsedMethods(methods);
      
      toast({
        title: "Code parsed successfully",
        description: `Found ${methods.length} methods`
      });
    } catch (error) {
      toast({
        title: "Parsing failed",
        description: "Failed to parse Java code",
        variant: "destructive"
      });
    }
  };

  const generatePlantUML = () => {
    if (parsedMethods.length === 0) {
      toast({
        title: "No methods found",
        description: "Please parse Java code first",
        variant: "destructive"
      });
      return;
    }

    let uml = "@startuml\n";
    uml += "!theme plain\n";
    uml += "title Method Call Sequence\n\n";
    
    // Extract participants
    const participants = new Set<string>();
    parsedMethods.forEach(method => {
      participants.add(method.className);
      method.calls.forEach(call => {
        participants.add(call.className);
      });
    });
    
    participants.forEach(participant => {
      uml += `participant ${participant}\n`;
    });
    uml += "\n";
    
    // Generate sequence
    const selectedMethodObj = parsedMethods.find(m => 
      selectedMethod === `${m.className}.${m.methodName}` || 
      (selectedMethod === "" && parsedMethods.indexOf(m) === 0)
    );
    
    if (selectedMethodObj) {
      uml += `activate ${selectedMethodObj.className}\n`;
      
      selectedMethodObj.calls.forEach((call, index) => {
        uml += `${selectedMethodObj.className} -> ${call.className} : ${call.methodName}()\n`;
        uml += `activate ${call.className}\n`;
        uml += `${call.className} --> ${selectedMethodObj.className} : return\n`;
        uml += `deactivate ${call.className}\n`;
      });
      
      uml += `deactivate ${selectedMethodObj.className}\n`;
    }
    
    uml += "\n@enduml";
    
    setPlantUML(uml);
    
    toast({
      title: "PlantUML generated",
      description: "Sequence diagram code has been generated"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  };

  const downloadPlantUML = () => {
    const blob = new Blob([plantUML], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequence-diagram.puml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header 
        title="FlowTrace - PlantUML Generator" 
        subtitle="Generate sequence diagrams"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                How to Use FlowTrace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Paste Java Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter your Java controller, service, or repository code
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Parse & Analyze</h4>
                    <p className="text-sm text-muted-foreground">
                      The tool will extract method calls and dependencies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Generate Diagram</h4>
                    <p className="text-sm text-muted-foreground">
                      Get PlantUML code for sequence diagrams
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Java Code Input */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Java Code Input</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={parseJavaCode}>
                    <Play className="w-4 h-4 mr-2" />
                    Parse Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={javaCode}
                onChange={(e) => setJavaCode(e.target.value)}
                placeholder="Paste your Java code here..."
                className="font-mono text-sm min-h-[400px]"
              />
            </CardContent>
          </Card>

          {/* Parsed Methods */}
          {parsedMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Parsed Methods ({parsedMethods.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedMethods.map((method, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {method.className}.{method.methodName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Returns: {method.returnType}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMethod(`${method.className}.${method.methodName}`);
                            generatePlantUML();
                          }}
                        >
                          Generate Diagram
                        </Button>
                      </div>
                      
                      {method.parameters.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Parameters:</span>
                          <div className="flex gap-2 flex-wrap mt-1">
                            {method.parameters.map((param, pIndex) => (
                              <Badge key={pIndex} variant="secondary" className="text-xs">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {method.calls.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Calls:</span>
                          <div className="flex gap-2 flex-wrap mt-1">
                            {method.calls.map((call, cIndex) => (
                              <Badge key={cIndex} variant="outline" className="text-xs">
                                {call.className}.{call.methodName}()
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PlantUML Output */}
          {plantUML && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated PlantUML</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(plantUML)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPlantUML}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="code" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code">PlantUML Code</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="code" className="mt-4">
                    <div className="code-editor max-h-96 overflow-auto">
                      <pre className="text-sm">{plantUML}</pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4">
                    <div className="bg-muted rounded border p-4 h-64 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">
                          Diagram preview would appear here
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Copy the PlantUML code and paste it into a PlantUML renderer
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Usage Guide */}
          <Card>
            <CardHeader>
              <CardTitle>PlantUML Usage Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Online Renderers</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <a href="https://plantuml.com/plantuml" className="text-primary hover:underline" target="_blank" rel="noopener">PlantUML Online Server</a></li>
                    <li>• <a href="https://www.planttext.com/" className="text-primary hover:underline" target="_blank" rel="noopener">PlantText</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">IDE Extensions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• VS Code: PlantUML extension</li>
                    <li>• IntelliJ IDEA: PlantUML integration plugin</li>
                    <li>• Eclipse: PlantUML plugin</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Command Line</h4>
                  <div className="bg-muted rounded p-2 font-mono text-sm">
                    java -jar plantuml.jar sequence-diagram.puml
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
