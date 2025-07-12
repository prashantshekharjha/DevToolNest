import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';

export default function SpecCraft() {
  const [spec, setSpec] = useState(`openapi: 3.0.3
info:
  title: Sample API
  version: 1.0.0
  description: A sample API to demonstrate OpenAPI specifications
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success`);

  return (
    <>
      <Header 
        title="SpecCraft" 
        subtitle="OpenAPI Specification Editor (Coming Soon)"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SpecCraft - OpenAPI Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This feature is temporarily disabled while we fix some build issues. 
                The full OpenAPI editor with live preview, validation, and cURL generation 
                will be available soon.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {spec}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}