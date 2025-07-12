import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
}

export default function TokenPeek() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [error, setError] = useState("");

  const decodeToken = () => {
    setError("");
    setDecodedToken(null);

    if (!token.trim()) {
      setError("Please enter a JWT token");
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const signature = parts[2];

      const now = Date.now() / 1000;
      const exp = payload.exp;
      const iat = payload.iat;

      const isExpired = exp ? now > exp : false;
      const isValid = true; // We can't verify signature without secret

      setDecodedToken({
        header,
        payload,
        signature,
        isValid,
        isExpired,
        expiresAt: exp ? new Date(exp * 1000) : undefined,
        issuedAt: iat ? new Date(iat * 1000) : undefined
      });

      toast({
        title: "Token decoded successfully",
        description: isExpired ? "Warning: Token has expired" : "Token is valid"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode token");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  };

  const clearToken = () => {
    setToken("");
    setDecodedToken(null);
    setError("");
  };

  return (
    <>
      <Header 
        title="TokenPeek - JWT Decoder" 
        subtitle="Decode and analyze JWT tokens"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Token Input */}
          <Card>
            <CardHeader>
              <CardTitle>JWT Token Decoder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="token">JWT Token</Label>
                <Textarea
                  id="token"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-2 font-mono"
                  rows={6}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={decodeToken}>Decode Token</Button>
                <Button variant="outline" onClick={clearToken}>Clear</Button>
              </div>
            </CardContent>
          </Card>

          {/* Decoded Sections */}
          {decodedToken && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Header</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(decodedToken.header, null, 2))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="code-editor">
                      <pre className="text-sm">
                        {JSON.stringify(decodedToken.header, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Payload */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payload</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(decodedToken.payload, null, 2))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="code-editor">
                      <pre className="text-sm">
                        {JSON.stringify(decodedToken.payload, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Token Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Token Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-muted rounded p-4">
                      <div className="text-sm text-muted-foreground mb-1">Algorithm</div>
                      <div className="font-mono">{decodedToken.header.alg || 'Unknown'}</div>
                    </div>
                    
                    {decodedToken.issuedAt && (
                      <div className="bg-muted rounded p-4">
                        <div className="text-sm text-muted-foreground mb-1">Issued At</div>
                        <div className="font-mono text-sm">
                          {decodedToken.issuedAt.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {decodedToken.expiresAt && (
                      <div className="bg-muted rounded p-4">
                        <div className="text-sm text-muted-foreground mb-1">Expires At</div>
                        <div className="font-mono text-sm">
                          {decodedToken.expiresAt.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-muted rounded p-4">
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        {decodedToken.isExpired ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <Badge variant="destructive">Expired</Badge>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <Badge variant="default">Valid</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}
