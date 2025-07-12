import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Copy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TimeFlip() {
  const { toast } = useToast();
  const [epochTimestamp, setEpochTimestamp] = useState("");
  const [humanDate, setHumanDate] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [conversions, setConversions] = useState<Array<{
    timestamp: number;
    human: string;
    timezone: string;
  }>>([]);

  const convertToHuman = () => {
    if (!epochTimestamp.trim()) {
      toast({
        title: "Error",
        description: "Please enter an epoch timestamp",
        variant: "destructive"
      });
      return;
    }

    try {
      const timestamp = parseInt(epochTimestamp);
      const date = new Date(timestamp * 1000);
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid timestamp");
      }

      const human = date.toLocaleString('en-US', { 
        timeZone: timezone === 'UTC' ? 'UTC' : timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      setHumanDate(human);
      
      const newConversion = {
        timestamp,
        human,
        timezone
      };
      
      setConversions(prev => [newConversion, ...prev.slice(0, 9)]);
      
      toast({
        title: "Conversion successful",
        description: "Timestamp converted to human-readable format"
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "Invalid timestamp format",
        variant: "destructive"
      });
    }
  };

  const convertToEpoch = () => {
    if (!humanDate.trim()) {
      toast({
        title: "Error",
        description: "Please enter a date and time",
        variant: "destructive"
      });
      return;
    }

    try {
      const date = new Date(humanDate);
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      const timestamp = Math.floor(date.getTime() / 1000);
      setEpochTimestamp(timestamp.toString());
      
      const human = date.toLocaleString('en-US', { 
        timeZone: timezone === 'UTC' ? 'UTC' : timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      const newConversion = {
        timestamp,
        human,
        timezone
      };
      
      setConversions(prev => [newConversion, ...prev.slice(0, 9)]);
      
      toast({
        title: "Conversion successful",
        description: "Date converted to epoch timestamp"
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "Invalid date format",
        variant: "destructive"
      });
    }
  };

  const getCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000);
    setEpochTimestamp(now.toString());
    convertToHuman();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Value copied to clipboard"
    });
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  return (
    <>
      <Header 
        title="TimeFlip - Epoch Converter" 
        subtitle="Convert timestamps and dates"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Timezone Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Timezone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={getCurrentTimestamp}>
                  <Clock className="w-4 h-4 mr-2" />
                  Current Time
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Converters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Epoch to Human */}
            <Card>
              <CardHeader>
                <CardTitle>Epoch to Human</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="epoch-input">Unix Timestamp</Label>
                  <Input
                    id="epoch-input"
                    placeholder="1672531200"
                    value={epochTimestamp}
                    onChange={(e) => setEpochTimestamp(e.target.value)}
                    className="font-mono"
                  />
                </div>
                
                <Button onClick={convertToHuman} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert to Human
                </Button>
                
                {humanDate && (
                  <div className="bg-muted rounded p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{humanDate}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(humanDate)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Human to Epoch */}
            <Card>
              <CardHeader>
                <CardTitle>Human to Epoch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="human-input">Date and Time</Label>
                  <Input
                    id="human-input"
                    placeholder="2023-01-01 00:00:00"
                    value={humanDate}
                    onChange={(e) => setHumanDate(e.target.value)}
                  />
                </div>
                
                <Button onClick={convertToEpoch} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert to Epoch
                </Button>
                
                {epochTimestamp && (
                  <div className="bg-muted rounded p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{epochTimestamp}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(epochTimestamp)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversion History */}
          {conversions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversions.map((conversion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{conversion.timestamp}</div>
                        <div className="text-sm text-muted-foreground">{conversion.human}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(conversion.timestamp.toString())}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
