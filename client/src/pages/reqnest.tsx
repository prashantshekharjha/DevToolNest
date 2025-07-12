import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';

export default function ReqNest() {
  return (
    <>
      <Header 
        title="ReqNest" 
        subtitle="API Request Builder (Coming Soon)"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ReqNest - API Request Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This feature is temporarily disabled while we fix some build issues. 
                The full API request builder with collections, environment variables, 
                and request history will be available soon.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm">
                  GET https://api.example.com/users
                  Content-Type: application/json
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
