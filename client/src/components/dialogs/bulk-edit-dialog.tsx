import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Header {
  key: string;
  value: string;
}

interface TestAssertion {
  id: string;
  type: 'status' | 'header' | 'body' | 'response-time';
  field?: string;
  operator: 'equals' | 'contains' | 'not-equals' | 'greater-than' | 'less-than' | 'exists';
  value: string;
  enabled: boolean;
}

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'headers' | 'params' | 'tests';
  initialText: string;
  onApply: (items: Header[] | TestAssertion[]) => void;
}

export function BulkEditDialog({ isOpen, onClose, type, initialText, onApply }: BulkEditDialogProps) {
  const [text, setText] = useState(initialText);

  const handleApply = () => {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (type === 'headers' || type === 'params') {
      let items: Header[] = [];
      lines.forEach(line => {
        if (type === 'headers') {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            items = [...items, { key, value }];
          }
        } else if (type === 'params') {
          const equalIndex = line.indexOf('=');
          if (equalIndex > 0) {
            const key = line.substring(0, equalIndex).trim();
            const value = line.substring(equalIndex + 1).trim();
            items = [...items, { key, value }];
          }
        }
      });
      onApply(items);
    } else if (type === 'tests') {
      let tests: TestAssertion[] = [];
      lines.forEach((line, index) => {
        const parts = line.split(' ');
        if (parts.length >= 3) {
          const type = parts[0] as TestAssertion['type'];
          const operator = parts[1] as TestAssertion['operator'];
          const value = parts.slice(2).join(' ');
          tests = [...tests, {
            id: Date.now().toString() + index,
            type,
            operator,
            value,
            enabled: true
          }];
        }
      });
      onApply(tests);
    }
    
    onClose();
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'headers':
        return `Content-Type: application/json
Authorization: Bearer your-token
Accept: application/json`;
      case 'params':
        return `page=1
limit=10
sort=created_at`;
      case 'tests':
        return `status equals 200
body contains "success"
response-time less-than 1000`;
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'headers':
        return 'Bulk Edit Headers';
      case 'params':
        return 'Bulk Edit Parameters';
      case 'tests':
        return 'Bulk Edit Tests';
      default:
        return 'Bulk Edit';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'headers':
        return 'Enter headers in the format "Key: Value" (one per line)';
      case 'params':
        return 'Enter parameters in the format "key=value" (one per line)';
      case 'tests':
        return 'Enter tests in the format "type operator value" (one per line)';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {getDescription()}
            </Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={getPlaceholder()}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 