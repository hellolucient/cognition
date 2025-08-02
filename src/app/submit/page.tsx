"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function SubmitPage() {
  const [chatContent, setChatContent] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission, call OpenAI for summary, and save to DB.
    console.log({
      chatContent,
      source,
      tags,
    });
    alert("Check the console for the form data. Submission logic is next!");
  };

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Submit a Conversation</h1>
        <p className="text-muted-foreground">
          Paste a complete conversation you've had with an AI. It will be summarized and shared with the community.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid w-full gap-2">
            <Label htmlFor="chat-content">The full chat transcript</Label>
            <Textarea
              id="chat-content"
              placeholder="Paste your entire chat log here, including both your prompts and the AI's responses."
              value={chatContent}
              onChange={(e) => setChatContent(e.target.value)}
              required
              rows={15}
            />
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="source">AI Source (optional)</Label>
            <Input
              id="source"
              placeholder="e.g., ChatGPT, Claude, Gemini"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., programming, creative-writing, science"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <Button type="submit">Generate Summary & Post</Button>
        </form>
      </div>
    </main>
  );
}
