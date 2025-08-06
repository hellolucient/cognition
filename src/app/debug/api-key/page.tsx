"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function ApiKeyDebugPage() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [result, setResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testApiKey = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/api-key-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, provider }),
      });

      const data = await response.json();
      setResult({ response: data, status: response.status, ok: response.ok });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  };

  const testRealSave = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, provider }),
      });

      const data = await response.json();
      setResult({ response: data, status: response.status, ok: response.ok, type: 'REAL_SAVE' });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error', type: 'REAL_SAVE' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">API Key Debug Tool</h1>
      
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider">Provider</Label>
            <select 
              id="provider"
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
            </select>
          </div>

          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testApiKey} disabled={testing || !apiKey}>
              {testing ? "Testing..." : "Test Validation"}
            </Button>
            <Button onClick={testRealSave} disabled={testing || !apiKey} variant="outline">
              {testing ? "Testing..." : "Test Real Save"}
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {result.type === 'REAL_SAVE' ? 'Real Save Result' : 'Validation Test Result'}
          </h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
          
          {result.response?.validation && (
            <div className="mt-4 space-y-2">
              <div><strong>Valid:</strong> {result.response.validation.isValid ? "✅ Yes" : "❌ No"}</div>
              <div><strong>Key Length:</strong> {result.response.validation.keyLength}</div>
              <div><strong>Key Preview:</strong> {result.response.validation.keyPrefix}</div>
              <div><strong>OpenAI Pattern Match:</strong> {result.response.validation.keyPattern.openai ? "✅" : "❌"}</div>
              <div><strong>Anthropic Pattern Match:</strong> {result.response.validation.keyPattern.anthropic ? "✅" : "❌"}</div>
              <div><strong>Google Pattern Match:</strong> {result.response.validation.keyPattern.google ? "✅" : "❌"}</div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4 mt-6 bg-blue-50">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ol className="text-sm space-y-1">
          <li>1. Paste the same API key you used on desktop</li>
          <li>2. Click "Test Validation" to check format validation</li>
          <li>3. Click "Test Real Save" to test the actual save endpoint</li>
          <li>4. Check the detailed results below</li>
        </ol>
      </Card>
    </div>
  );
}