import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RateLimitAlgorithm = 'token-bucket' | 'fixed-window' | 'sliding-window' | 'leaky-bucket';

interface RequestLog {
  timestamp: number;
  status: 'allowed' | 'blocked';
  endpoint: string;
  tokens?: number;
  maxTokens?: number;
}

interface RateLimitConfig {
  algorithm: RateLimitAlgorithm;
  rateLimit: number;
  timeWindow: number;
  burstSize: number;
}

interface TokenBucketState {
  tokens: number;
  maxTokens: number;
  refillRate: number;
  lastRefill: number;
}

export default function ThrottleViz() {
  const { toast } = useToast();
  const [config, setConfig] = useState<RateLimitConfig>({
    algorithm: 'token-bucket',
    rateLimit: 10,
    timeWindow: 60,
    burstSize: 5
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [tokenBucket, setTokenBucket] = useState<TokenBucketState>({
    tokens: 10,
    maxTokens: 10,
    refillRate: 1,
    lastRefill: Date.now()
  });
  
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    successRate: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = () => {
    setIsRunning(true);
    setRequestLogs([]);
    setStats({
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      successRate: 0
    });
    
    // Reset token bucket
    setTokenBucket({
      tokens: config.rateLimit,
      maxTokens: config.rateLimit,
      refillRate: config.rateLimit / config.timeWindow,
      lastRefill: Date.now()
    });

    // Start token refill timer
    intervalRef.current = setInterval(() => {
      setTokenBucket(prev => {
        const now = Date.now();
        const timePassed = (now - prev.lastRefill) / 1000;
        const tokensToAdd = timePassed * prev.refillRate;
        const newTokens = Math.min(prev.maxTokens, prev.tokens + tokensToAdd);
        
        return {
          ...prev,
          tokens: newTokens,
          lastRefill: now
        };
      });
    }, 1000);

    // Start request simulation
    requestIntervalRef.current = setInterval(() => {
      simulateRequest();
    }, Math.random() * 2000 + 500); // Random requests between 0.5-2.5 seconds
  };

  const pauseSimulation = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (requestIntervalRef.current) {
      clearInterval(requestIntervalRef.current);
      requestIntervalRef.current = null;
    }
  };

  const resetSimulation = () => {
    pauseSimulation();
    setRequestLogs([]);
    setStats({
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      successRate: 0
    });
    setTokenBucket({
      tokens: config.rateLimit,
      maxTokens: config.rateLimit,
      refillRate: config.rateLimit / config.timeWindow,
      lastRefill: Date.now()
    });
  };

  const simulateRequest = () => {
    const endpoints = ['/api/users', '/api/posts', '/api/comments', '/api/auth'];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    setTokenBucket(prev => {
      const canProceed = prev.tokens >= 1;
      const newTokens = canProceed ? prev.tokens - 1 : prev.tokens;
      
      const logEntry: RequestLog = {
        timestamp: Date.now(),
        status: canProceed ? 'allowed' : 'blocked',
        endpoint,
        tokens: Math.floor(newTokens),
        maxTokens: prev.maxTokens
      };
      
      setRequestLogs(prevLogs => [logEntry, ...prevLogs.slice(0, 49)]);
      
      setStats(prevStats => {
        const newTotal = prevStats.totalRequests + 1;
        const newAllowed = prevStats.allowedRequests + (canProceed ? 1 : 0);
        const newBlocked = prevStats.blockedRequests + (canProceed ? 0 : 1);
        const newSuccessRate = Math.round((newAllowed / newTotal) * 100);
        
        return {
          totalRequests: newTotal,
          allowedRequests: newAllowed,
          blockedRequests: newBlocked,
          successRate: newSuccessRate
        };
      });
      
      return {
        ...prev,
        tokens: newTokens
      };
    });
  };

  const sendManualRequest = () => {
    simulateRequest();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (requestIntervalRef.current) clearInterval(requestIntervalRef.current);
    };
  }, []);

  const getAlgorithmDescription = (algorithm: RateLimitAlgorithm) => {
    switch (algorithm) {
      case 'token-bucket':
        return 'Tokens are added at a fixed rate. Each request consumes one token.';
      case 'fixed-window':
        return 'Allows a fixed number of requests per time window.';
      case 'sliding-window':
        return 'Maintains a rolling window of recent requests.';
      case 'leaky-bucket':
        return 'Requests are processed at a steady rate, excess requests are dropped.';
      default:
        return '';
    }
  };

  return (
    <>
      <Header 
        title="ThrottleViz - Rate Limiter Visualization" 
        subtitle="Visualize rate limiting strategies"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select 
                    value={config.algorithm} 
                    onValueChange={(value: RateLimitAlgorithm) => setConfig(prev => ({ ...prev, algorithm: value }))}
                    disabled={isRunning}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="token-bucket">Token Bucket</SelectItem>
                      <SelectItem value="fixed-window">Fixed Window</SelectItem>
                      <SelectItem value="sliding-window">Sliding Window</SelectItem>
                      <SelectItem value="leaky-bucket">Leaky Bucket</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getAlgorithmDescription(config.algorithm)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    value={config.rateLimit}
                    onChange={(e) => setConfig(prev => ({ ...prev, rateLimit: Number(e.target.value) }))}
                    min={1}
                    max={100}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground">Requests per time window</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time-window">Time Window (seconds)</Label>
                  <Input
                    id="time-window"
                    type="number"
                    value={config.timeWindow}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeWindow: Number(e.target.value) }))}
                    min={1}
                    max={3600}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground">Duration of rate limit window</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="burst-size">Burst Size</Label>
                  <Input
                    id="burst-size"
                    type="number"
                    value={config.burstSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, burstSize: Number(e.target.value) }))}
                    min={1}
                    max={50}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground">Maximum burst requests</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <Button onClick={startSimulation} disabled={isRunning}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Simulation
                </Button>
                <Button onClick={pauseSimulation} disabled={!isRunning}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={resetSimulation} variant="outline">
                  <Square className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={sendManualRequest} variant="outline">
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.allowedRequests}</div>
                <div className="text-sm text-muted-foreground">Allowed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.blockedRequests}</div>
                <div className="text-sm text-muted-foreground">Blocked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Bucket Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Token Bucket Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available Tokens</span>
                    <span className="font-mono">
                      {Math.floor(tokenBucket.tokens)} / {tokenBucket.maxTokens}
                    </span>
                  </div>
                  
                  <Progress 
                    value={(tokenBucket.tokens / tokenBucket.maxTokens) * 100} 
                    className="h-4"
                  />
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Refill Rate</span>
                      <span className="font-mono">{tokenBucket.refillRate.toFixed(2)} tokens/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Algorithm</span>
                      <span className="font-mono">{config.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Window</span>
                      <span className="font-mono">{config.timeWindow}s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Request Rate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded border p-4 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Live chart visualization would appear here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing request rate: {stats.totalRequests > 0 ? Math.round(stats.totalRequests / Math.max(1, (Date.now() - (requestLogs[requestLogs.length - 1]?.timestamp || Date.now())) / 1000)) : 0} req/sec
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Log */}
          <Card>
            <CardHeader>
              <CardTitle>Request Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded border p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2 font-mono text-sm">
                  {requestLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No requests yet. Start the simulation to see request logs.
                    </div>
                  ) : (
                    requestLogs.map((log, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant={log.status === 'allowed' ? 'default' : 'destructive'}>
                          {log.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm">{log.endpoint}</span>
                        {log.tokens !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            tokens: {log.tokens}/{log.maxTokens}
                          </span>
                        )}
                      </div>
                    ))
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
