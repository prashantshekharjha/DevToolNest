// Debug script to test cURL parser and normalizeRequest function
const testCurl = `curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer your-token' \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`;

console.log('Testing cURL:', testCurl);

// Normalize the curl command
const normalizedCurl = testCurl
  .replace(/\\\s*\n\s*/g, ' ') // Remove line continuations
  .replace(/\n/g, ' ') // Replace newlines with spaces
  .replace(/\s+/g, ' ') // Normalize multiple spaces
  .trim();

console.log('Normalized cURL:', normalizedCurl);

// Split the command into parts
function splitCurlCommand(command) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let escapeNext = false;
  
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }
    
    if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      continue;
    }
    
    if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

const parts = splitCurlCommand(normalizedCurl);
console.log('Split parts:', parts);

// Extract method
let method = 'GET';
const methodIndex = parts.findIndex(part => part === '-X' || part === '--request');
if (methodIndex !== -1 && parts[methodIndex + 1]) {
  method = parts[methodIndex + 1].toUpperCase();
}
console.log('Method:', method);

// Extract URL (first non-flag argument after curl, but not method)
let url = '';
let urlIndex = 1; // Skip 'curl'
while (urlIndex < parts.length && (parts[urlIndex].startsWith('-') || parts[urlIndex] === 'curl')) {
  urlIndex++;
}
// Skip method if it's the next argument
if (urlIndex < parts.length && (parts[urlIndex] === 'GET' || parts[urlIndex] === 'POST' || parts[urlIndex] === 'PUT' || parts[urlIndex] === 'DELETE' || parts[urlIndex] === 'PATCH' || parts[urlIndex] === 'HEAD' || parts[urlIndex] === 'OPTIONS')) {
  urlIndex++;
}
if (urlIndex < parts.length) {
  url = parts[urlIndex];
  // Clean up URL
  url = url.replace(/^['"`]|['"`]$/g, '');
}
console.log('URL:', url);

// Extract headers
const headers = [];
for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (part === '-H' || part === '--header') {
    if (i + 1 < parts.length) {
      const headerValue = parts[i + 1];
      const colonIndex = headerValue.indexOf(':');
      if (colonIndex > 0) {
        const key = headerValue.substring(0, colonIndex).trim();
        const value = headerValue.substring(colonIndex + 1).trim();
        headers.push({ key, value });
      }
    }
  }
}
console.log('Headers:', headers);

// Extract body data
let body = '';
const bodyFlags = ['-d', '--data', '--data-raw', '--data-binary', '--data-urlencode'];
for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (bodyFlags.includes(part)) {
    if (i + 1 < parts.length) {
      body = parts[i + 1];
      // Clean up body
      body = body.replace(/^['"`]|['"`]$/g, '');
      break;
    }
  }
}
console.log('Body:', body);

// Simulate the normalizeRequest function
function normalizeRequest(req) {
  // Ensure headers is an array of objects with key/value pairs
  const normalizedHeaders = req.headers || [];
  const headers = Array.isArray(normalizedHeaders) 
    ? normalizedHeaders.map(h => ({ key: h.key || '', value: h.value || '' }))
    : [];
  
  // Ensure params is an array of objects with key/value pairs
  const normalizedParams = req.params || [];
  const params = Array.isArray(normalizedParams) 
    ? normalizedParams.map(p => ({ key: p.key || '', value: p.value || '' }))
    : [];
  
  // Ensure tests is an array of test objects
  const normalizedTests = req.tests || [];
  const tests = Array.isArray(normalizedTests) 
    ? normalizedTests.map(t => ({
        id: t.id || Date.now().toString(),
        type: t.type || 'status',
        field: t.field || '',
        operator: t.operator || 'equals',
        value: t.value || '',
        enabled: t.enabled !== undefined ? t.enabled : true
      }))
    : [];
  
  return {
    id: req.id || Date.now().toString(),
    name: req.name || "Untitled Request",
    method: req.method || 'GET',
    url: req.url || '',
    headers: headers,
    body: req.body || '',
    auth: req.auth || { type: 'none' },
    params: params,
    preRequestScript: req.preRequestScript || '',
    postRequestScript: req.postRequestScript || '',
    tests: tests,
    description: req.description || '',
    parentId: req.parentId
  };
}

// Test the full flow
const parsed = { method, url, headers, body, params: [] };
console.log('Parsed result:', parsed);

const importedRequest = normalizeRequest({
  ...parsed,
  headers: parsed.headers || [],
  body: parsed.body || '',
  auth: { type: 'none' },
  params: parsed.params || []
});

console.log('Normalized request:', importedRequest);
console.log('Headers count:', importedRequest.headers.length);
console.log('Body length:', importedRequest.body.length); 