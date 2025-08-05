"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function TestApiPage() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testApiKeys = async () => {
    if (!openaiKey.trim() && !anthropicKey.trim()) {
      alert("Please enter at least one API key");
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-ai-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiKey: openaiKey.trim() || null,
          anthropicKey: anthropicKey.trim() || null,
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      setResult({
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">OpenAI API Key Test</h1>
          <p className="text-muted-foreground">
            Test different OpenAI API keys to debug the quota issue.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
            />
          </div>

          <Button 
            onClick={testApiKeys} 
            disabled={testing}
            className="w-full"
          >
            {testing ? "Testing..." : "Test API Keys"}
          </Button>

          {result && (
            <div className="space-y-2">
              <Label>Test Result</Label>
              <Textarea
                value={JSON.stringify(result, null, 2)}
                readOnly
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">What this test does:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Tests OpenAI models (gpt-4o-mini, gpt-4o, gpt-3.5-turbo, gpt-4)</li>
            <li>Tests Anthropic models (claude-3-haiku, claude-3-sonnet, claude-3-opus)</li>
            <li>Shows exact HTTP status and response for each</li>
            <li>Lists available models if API keys work</li>
            <li>Reveals detailed error information</li>
          </ul>
        </div>
      </div>
    </main>
  );
}