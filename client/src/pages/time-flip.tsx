import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Copy, Clock, Calendar, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToolTabs, ToolTab } from "@/components/ui/ToolTabs";
import { v4 as uuidv4 } from "uuid";
import { useTimeFlipTabsStore } from '@/lib/toolTabsStore';

const TIMEFLIP_TABS_LOCAL_STORAGE_KEY = "devtoolnest-timeflip-tabs";
const TIMEFLIP_ACTIVE_TAB_LOCAL_STORAGE_KEY = "devtoolnest-timeflip-active-tab";

export default function TimeFlip() {
  const { toast } = useToast();
  const { tabs, activeTabId, setTabs, setActiveTabId } = useTimeFlipTabsStore();

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(TIMEFLIP_TABS_LOCAL_STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TIMEFLIP_ACTIVE_TAB_LOCAL_STORAGE_KEY, activeTabId);
  }, [activeTabId]);

  const addTab = () => {
    const newTab: ToolTab = {
      id: uuidv4(),
      title: `Tab ${tabs.length + 1}`,
      state: {
        epochTimestamp: '',
        humanDate: '',
        timezone: 'UTC',
        conversions: [],
        activeTab: 'converter'
      }
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    const newTabs = tabs.filter(tab => tab.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const currentIndex = tabs.findIndex(tab => tab.id === id);
      const newActiveTab = newTabs[Math.min(currentIndex, newTabs.length - 1)];
      setActiveTabId(newActiveTab.id);
    }
  };

  const renameTab = (id: string, title: string) => {
    setTabs(tabs.map(tab => tab.id === id ? { ...tab, title } : tab));
  };

  const updateTabState = (id: string, updater: (state: any) => any) => {
    setTabs(tabs.map(tab => 
      tab.id === id ? { ...tab, state: updater(tab.state) } : tab
    ));
  };

  const closeTabsToLeft = (id: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === id);
    const newTabs = tabs.slice(currentIndex);
    setTabs(newTabs);
    setActiveTabId(id);
  };

  const closeTabsToRight = (id: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === id);
    const newTabs = tabs.slice(0, currentIndex + 1);
    setTabs(newTabs);
    setActiveTabId(id);
  };

  const closeTabsOthers = (id: string) => {
    const tab = tabs.find(tab => tab.id === id);
    if (tab) {
      setTabs([tab]);
      setActiveTabId(id);
    }
  };

  const convertToHuman = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.state.epochTimestamp.trim()) {
      toast({
        title: "Error",
        description: "Please enter an epoch timestamp",
        variant: "destructive"
      });
      return;
    }

    try {
      const timestamp = parseInt(tab.state.epochTimestamp);
      const date = new Date(timestamp * 1000);
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid timestamp");
      }

      const human = date.toLocaleString('en-US', { 
        timeZone: tab.state.timezone === 'UTC' ? 'UTC' : tab.state.timezone,
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
        timezone: tab.state.timezone
      };
      
      updateTabState(tabId, (state: any) => ({
        ...state,
        humanDate: human,
        conversions: [newConversion, ...state.conversions.slice(0, 9)]
      }));
      
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

  const convertToEpoch = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.state.humanDate.trim()) {
      toast({
        title: "Error",
        description: "Please enter a date and time",
        variant: "destructive"
      });
      return;
    }

    try {
      const date = new Date(tab.state.humanDate);
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      const timestamp = Math.floor(date.getTime() / 1000);
      const human = date.toLocaleString('en-US', { 
        timeZone: tab.state.timezone === 'UTC' ? 'UTC' : tab.state.timezone,
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
        timezone: tab.state.timezone
      };
      
      updateTabState(tabId, (state: any) => ({
        ...state,
        epochTimestamp: timestamp.toString(),
        conversions: [newConversion, ...state.conversions.slice(0, 9)]
      }));
      
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

  const getCurrentTimestamp = (tabId: string) => {
    const now = Math.floor(Date.now() / 1000);
    updateTabState(tabId, (state: any) => ({
      ...state,
      epochTimestamp: now.toString()
    }));
    convertToHuman(tabId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Value copied to clipboard"
    });
  };

  const clearHistory = (tabId: string) => {
    updateTabState(tabId, (state: any) => ({
      ...state,
      conversions: []
    }));
    toast({
      title: "History cleared",
      description: "Conversion history has been cleared"
    });
  };

  const timezones = [
    { value: 'UTC', label: 'UTC (GMT+0)' },
    { value: 'GMT', label: 'GMT (GMT+0)' },
    { value: 'America/New_York', label: 'Eastern Time (GMT-5/-4)' },
    { value: 'America/Chicago', label: 'Central Time (GMT-6/-5)' },
    { value: 'America/Denver', label: 'Mountain Time (GMT-7/-6)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (GMT-8/-7)' },
    { value: 'America/Anchorage', label: 'Alaska Time (GMT-9/-8)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (GMT-10)' },
    { value: 'Europe/London', label: 'London (GMT+0/+1)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1/+2)' },
    { value: 'Europe/Berlin', label: 'Berlin (GMT+1/+2)' },
    { value: 'Europe/Rome', label: 'Rome (GMT+1/+2)' },
    { value: 'Europe/Moscow', label: 'Moscow (GMT+3)' },
    { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
    { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Asia/Seoul', label: 'Seoul (GMT+9)' },
    { value: 'Australia/Sydney', label: 'Sydney (GMT+10/+11)' },
    { value: 'Australia/Perth', label: 'Perth (GMT+8)' },
    { value: 'Pacific/Auckland', label: 'Auckland (GMT+12/+13)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3/-2)' },
    { value: 'America/Mexico_City', label: 'Mexico City (GMT-6/-5)' },
    { value: 'America/Toronto', label: 'Toronto (GMT-5/-4)' },
    { value: 'America/Vancouver', label: 'Vancouver (GMT-8/-7)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (GMT+1/+2)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1/+2)' },
    { value: 'Europe/Stockholm', label: 'Stockholm (GMT+1/+2)' },
    { value: 'Europe/Zurich', label: 'Zurich (GMT+1/+2)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
    { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
    { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
    { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (GMT+8)' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (GMT+7)' },
    { value: 'Asia/Taipei', label: 'Taipei (GMT+8)' },
    { value: 'Asia/Tehran', label: 'Tehran (GMT+3:30/+4:30)' },
    { value: 'Asia/Karachi', label: 'Karachi (GMT+5)' },
    { value: 'Asia/Dhaka', label: 'Dhaka (GMT+6)' },
    { value: 'Asia/Colombo', label: 'Colombo (GMT+5:30)' },
    { value: 'Asia/Kathmandu', label: 'Kathmandu (GMT+5:45)' },
    { value: 'Asia/Rangoon', label: 'Rangoon (GMT+6:30)' },
    { value: 'Asia/Almaty', label: 'Almaty (GMT+6)' },
    { value: 'Asia/Tashkent', label: 'Tashkent (GMT+5)' },
    { value: 'Asia/Baku', label: 'Baku (GMT+4)' },
    { value: 'Asia/Yerevan', label: 'Yerevan (GMT+4)' },
    { value: 'Asia/Tbilisi', label: 'Tbilisi (GMT+4)' },
    { value: 'Asia/Qatar', label: 'Qatar (GMT+3)' },
    { value: 'Asia/Kuwait', label: 'Kuwait (GMT+3)' },
    { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
    { value: 'Asia/Jerusalem', label: 'Jerusalem (GMT+2/+3)' },
    { value: 'Asia/Beirut', label: 'Beirut (GMT+2/+3)' },
    { value: 'Asia/Baghdad', label: 'Baghdad (GMT+3)' },
    { value: 'Asia/Amman', label: 'Amman (GMT+2/+3)' },
    { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (GMT+2)' },
    { value: 'Africa/Lagos', label: 'Lagos (GMT+1)' },
    { value: 'Africa/Casablanca', label: 'Casablanca (GMT+0/+1)' },
    { value: 'Africa/Nairobi', label: 'Nairobi (GMT+3)' },
    { value: 'Africa/Addis_Ababa', label: 'Addis Ababa (GMT+3)' },
    { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (GMT+3)' },
    { value: 'Africa/Khartoum', label: 'Khartoum (GMT+2)' },
    { value: 'Africa/Tripoli', label: 'Tripoli (GMT+1/+2)' },
    { value: 'Africa/Algiers', label: 'Algiers (GMT+1)' },
    { value: 'Africa/Tunis', label: 'Tunis (GMT+1)' },
    { value: 'Africa/Rabat', label: 'Rabat (GMT+0/+1)' },
    { value: 'Africa/Dakar', label: 'Dakar (GMT+0)' },
    { value: 'Africa/Accra', label: 'Accra (GMT+0)' },
    { value: 'Africa/Abidjan', label: 'Abidjan (GMT+0)' },
    { value: 'Africa/Brazzaville', label: 'Brazzaville (GMT+1)' },
    { value: 'Africa/Kinshasa', label: 'Kinshasa (GMT+1)' },
    { value: 'Africa/Luanda', label: 'Luanda (GMT+1)' },
    { value: 'Africa/Windhoek', label: 'Windhoek (GMT+1/+2)' },
    { value: 'Africa/Harare', label: 'Harare (GMT+2)' },
    { value: 'Africa/Lusaka', label: 'Lusaka (GMT+2)' },
    { value: 'Africa/Maputo', label: 'Maputo (GMT+2)' },
    { value: 'Africa/Gaborone', label: 'Gaborone (GMT+2)' },
    { value: 'Africa/Maseru', label: 'Maseru (GMT+2)' },
    { value: 'Africa/Mbabane', label: 'Mbabane (GMT+2)' },
    { value: 'Africa/Mogadishu', label: 'Mogadishu (GMT+3)' },
    { value: 'Africa/Asmara', label: 'Asmara (GMT+3)' },
    { value: 'Africa/Djibouti', label: 'Djibouti (GMT+3)' },
    { value: 'Africa/Asmera', label: 'Asmera (GMT+3)' },
    { value: 'Africa/Bamako', label: 'Bamako (GMT+0)' },
    { value: 'Africa/Bangui', label: 'Bangui (GMT+1)' },
    { value: 'Africa/Banjul', label: 'Banjul (GMT+0)' },
    { value: 'Africa/Bissau', label: 'Bissau (GMT+0)' },
    { value: 'Africa/Blantyre', label: 'Blantyre (GMT+2)' },
    { value: 'Africa/Bujumbura', label: 'Bujumbura (GMT+2)' },
    { value: 'Africa/Conakry', label: 'Conakry (GMT+0)' },
    { value: 'Africa/Douala', label: 'Douala (GMT+1)' },
    { value: 'Africa/Freetown', label: 'Freetown (GMT+0)' },
    { value: 'Africa/Kigali', label: 'Kigali (GMT+2)' },
    { value: 'Africa/Libreville', label: 'Libreville (GMT+1)' },
    { value: 'Africa/Lome', label: 'Lome (GMT+0)' },
    { value: 'Africa/Malabo', label: 'Malabo (GMT+1)' },
    { value: 'Africa/Niamey', label: 'Niamey (GMT+1)' },
    { value: 'Africa/Nouakchott', label: 'Nouakchott (GMT+0)' },
    { value: 'Africa/Ouagadougou', label: 'Ouagadougou (GMT+0)' },
    { value: 'Africa/Porto-Novo', label: 'Porto-Novo (GMT+1)' },
    { value: 'Africa/Sao_Tome', label: 'Sao Tome (GMT+0)' },
    { value: 'Africa/Yaounde', label: 'Yaounde (GMT+1)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/Chile/Santiago', label: 'Santiago (GMT-3/-4)' },
    { value: 'America/Colombia/Bogota', label: 'Bogota (GMT-5)' },
    { value: 'America/Peru/Lima', label: 'Lima (GMT-5)' },
    { value: 'America/Venezuela/Caracas', label: 'Caracas (GMT-4)' },
    { value: 'America/Uruguay/Montevideo', label: 'Montevideo (GMT-3)' },
    { value: 'America/Paraguay/Asuncion', label: 'Asuncion (GMT-3/-4)' },
    { value: 'America/Bolivia/La_Paz', label: 'La Paz (GMT-4)' },
    { value: 'America/Ecuador/Quito', label: 'Quito (GMT-5)' },
    { value: 'America/Guyana/Georgetown', label: 'Georgetown (GMT-4)' },
    { value: 'America/Suriname/Paramaribo', label: 'Paramaribo (GMT-3)' },
    { value: 'America/French_Guiana/Cayenne', label: 'Cayenne (GMT-3)' },
    { value: 'America/Argentina/Cordoba', label: 'Cordoba (GMT-3)' },
    { value: 'America/Argentina/Rosario', label: 'Rosario (GMT-3)' },
    { value: 'America/Argentina/Mendoza', label: 'Mendoza (GMT-3)' },
    { value: 'America/Argentina/Salta', label: 'Salta (GMT-3)' },
    { value: 'America/Argentina/Jujuy', label: 'Jujuy (GMT-3)' },
    { value: 'America/Argentina/Tucuman', label: 'Tucuman (GMT-3)' },
    { value: 'America/Argentina/Catamarca', label: 'Catamarca (GMT-3)' },
    { value: 'America/Argentina/La_Rioja', label: 'La Rioja (GMT-3)' },
    { value: 'America/Argentina/San_Juan', label: 'San Juan (GMT-3)' },
    { value: 'America/Argentina/San_Luis', label: 'San Luis (GMT-3)' },
    { value: 'America/Argentina/Rio_Gallegos', label: 'Rio Gallegos (GMT-3)' },
    { value: 'America/Argentina/Ushuaia', label: 'Ushuaia (GMT-3)' },
    { value: 'America/Chile/Easter', label: 'Easter Island (GMT-6/-5)' },
    { value: 'America/Colombia/Medellin', label: 'Medellin (GMT-5)' },
    { value: 'America/Colombia/Cali', label: 'Cali (GMT-5)' },
    { value: 'America/Colombia/Barranquilla', label: 'Barranquilla (GMT-5)' },
    { value: 'America/Colombia/Cartagena', label: 'Cartagena (GMT-5)' },
    { value: 'America/Peru/Arequipa', label: 'Arequipa (GMT-5)' },
    { value: 'America/Peru/Trujillo', label: 'Trujillo (GMT-5)' },
    { value: 'America/Peru/Cusco', label: 'Cusco (GMT-5)' },
    { value: 'America/Venezuela/Maracaibo', label: 'Maracaibo (GMT-4)' },
    { value: 'America/Venezuela/Valencia', label: 'Valencia (GMT-4)' },
    { value: 'America/Uruguay/Punta_del_Este', label: 'Punta del Este (GMT-3)' },
    { value: 'America/Paraguay/Ciudad_del_Este', label: 'Ciudad del Este (GMT-3/-4)' },
    { value: 'America/Bolivia/Sucre', label: 'Sucre (GMT-4)' },
    { value: 'America/Ecuador/Guayaquil', label: 'Guayaquil (GMT-5)' },
    { value: 'America/Guyana/Georgetown', label: 'Georgetown (GMT-4)' },
    { value: 'America/Suriname/Paramaribo', label: 'Paramaribo (GMT-3)' },
    { value: 'America/French_Guiana/Cayenne', label: 'Cayenne (GMT-3)' }
  ];

  const renderTabContent = (tab: ToolTab) => {
    const state = tab.state;
    
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="TimeFlip - Epoch Converter" 
          subtitle="Convert timestamps and dates with comprehensive timezone support"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Tabs value={state.activeTab} onValueChange={(value) => updateTabState(tab.id, (s: any) => ({ ...s, activeTab: value }))} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="converter" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Converter
                </TabsTrigger>
                <TabsTrigger value="current" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Current Time
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="converter" className="space-y-6">
                {/* Timezone Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timezone Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Select value={state.timezone} onValueChange={(value) => updateTabState(tab.id, (s: any) => ({ ...s, timezone: value }))}>
                        <SelectTrigger className="w-80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timezones.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button variant="outline" onClick={() => getCurrentTimestamp(tab.id)}>
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
                          value={state.epochTimestamp}
                          onChange={(e) => updateTabState(tab.id, (s: any) => ({ ...s, epochTimestamp: e.target.value }))}
                          className="font-mono"
                        />
                      </div>
                      
                      <Button onClick={() => convertToHuman(tab.id)} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Convert to Human
                      </Button>
                      
                      {state.humanDate && (
                        <div className="bg-muted rounded p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{state.humanDate}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(state.humanDate)}>
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
                          value={state.humanDate}
                          onChange={(e) => updateTabState(tab.id, (s: any) => ({ ...s, humanDate: e.target.value }))}
                        />
                      </div>
                      
                      <Button onClick={() => convertToEpoch(tab.id)} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Convert to Epoch
                      </Button>
                      
                      {state.epochTimestamp && (
                        <div className="bg-muted rounded p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{state.epochTimestamp}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(state.epochTimestamp)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="current" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Time Around the World</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {timezones.slice(0, 12).map(tz => {
                        const now = new Date();
                        const timeInZone = now.toLocaleString('en-US', {
                          timeZone: tz.value,
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        });
                        const epoch = Math.floor(now.getTime() / 1000);
                        
                        return (
                          <div key={tz.value} className="p-4 border rounded-lg">
                            <div className="font-semibold text-sm">{tz.label}</div>
                            <div className="text-sm text-muted-foreground mt-1">{timeInZone}</div>
                            <div className="font-mono text-xs text-muted-foreground mt-1">{epoch}</div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => copyToClipboard(epoch.toString())}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Epoch
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Conversion History</CardTitle>
                      {state.conversions.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => clearHistory(tab.id)}>
                          Clear History
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {state.conversions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No conversions yet. Start converting timestamps to see your history here.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {state.conversions.map((conversion: { timestamp: number; human: string; timezone: string }, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                            <div className="space-y-1">
                              <div className="font-mono text-sm">{conversion.timestamp}</div>
                              <div className="text-sm text-muted-foreground">{conversion.human}</div>
                              <div className="text-xs text-muted-foreground">{conversion.timezone}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(conversion.timestamp.toString())}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
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
        renderTabContent={renderTabContent}
        className="h-full"
      />
    </div>
  );
} 