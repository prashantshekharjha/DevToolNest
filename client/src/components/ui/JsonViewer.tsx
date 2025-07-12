import React, { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";

interface JsonViewerProps {
  value: object | string;
  className?: string;
  maxPreviewLines?: number;
  maxPreviewBytes?: number;
  showTruncatedMessage?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ value, className, maxPreviewLines = 1000, maxPreviewBytes = 100 * 1024, showTruncatedMessage = false }) => {
  const ref = useRef<HTMLElement>(null);
  const jsonString = typeof value === "string"
    ? value
    : JSON.stringify(value, null, 2);

  let previewString = jsonString;
  let truncated = false;
  if (jsonString.length > maxPreviewBytes) {
    previewString = jsonString.slice(0, maxPreviewBytes);
    truncated = true;
  }
  const lines = previewString.split("\n");
  if (lines.length > maxPreviewLines) {
    previewString = lines.slice(0, maxPreviewLines).join("\n");
    truncated = true;
  }

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current);
    }
  }, [previewString]);

  return (
    <div>
      <pre className={className} style={{ margin: 0 }}>
        <code ref={ref} className="language-json">
          {previewString}
        </code>
      </pre>
      {truncated && showTruncatedMessage && (
        <div className="text-xs text-muted-foreground mt-2">Preview truncated for performance. Maximize to view full content.</div>
      )}
    </div>
  );
}; 