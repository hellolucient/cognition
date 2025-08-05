"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const AI_SOURCES = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Perplexity",
  "Copilot",
  "Grok",
  "Other"
];

const POPULAR_TAGS = [
  "programming",
  "creative-writing",
  "science",
  "business",
  "education",
  "philosophy",
  "productivity",
  "debugging",
  "brainstorming",
  "research"
];

export default function SubmitPage() {
  const [chatContent, setChatContent] = useState("");
  const [source, setSource] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [tags, setTags] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [step, setStep] = useState<"input" | "review">("input");

  const handleTagClick = (tag: string) => {
    if (tag === "Other") {
      // Handle custom tag input
      return;
    }
    
    const currentTags = tags.split(",").map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      const newTags = currentTags.length > 0 ? `${tags}, ${tag}` : tag;
      setTags(newTags);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim()) {
      const currentTags = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (!currentTags.includes(customTag.trim())) {
        const newTags = currentTags.length > 0 ? `${tags}, ${customTag.trim()}` : customTag.trim();
        setTags(newTags);
      }
      setCustomTag("");
    }
  };

  const generateSummary = async () => {
    if (!chatContent.trim()) {
      alert("Please enter the conversation content first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: chatContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data.summary);
      setStep("review");
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!summary.trim()) {
      alert("Please provide a summary before posting.");
      return;
    }

    setIsPosting(true);
    try {
      const finalSource = source === "Other" ? customSource : source;
      
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: chatContent,
          source: finalSource,
          tags,
          summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create thread');
      }
      
      alert("Post submitted successfully! Your conversation has been shared with the community.");
      
      // Reset form
      setChatContent("");
      setSource("");
      setCustomSource("");
      setTags("");
      setSummary("");
      setStep("input");
      
    } catch (error: any) {
      alert(`Error posting: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "input") {
      generateSummary();
    } else {
      handlePost();
    }
  };

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Submit a Conversation</h1>
        <p className="text-muted-foreground">
          Paste a complete conversation you've had with an AI. It will be summarized and shared with the community.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === "input" && (
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
          )}
          
          {step === "review" && (
            <div className="space-y-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="generated-summary">Generated Summary (you can edit this)</Label>
                <Textarea
                  id="generated-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Review your submission:</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Source:</strong> {source === "Other" ? customSource : source}</div>
                  <div><strong>Tags:</strong> {tags || "None"}</div>
                  <div><strong>Content length:</strong> {chatContent.length} characters</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep("input")}
                >
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
          
          {step === "input" && (
            <>
              <div className="grid w-full gap-2">
                <Label htmlFor="source">AI Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI source" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_SOURCES.map((aiSource) => (
                      <SelectItem key={aiSource} value={aiSource}>
                        {aiSource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {source === "Other" && (
                  <Input
                    placeholder="Enter custom AI source"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                  />
                )}
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Your selected tags will appear here"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  readOnly
                />
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Click to add tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTagClick(tag)}
                        className="h-8"
                      >
                        {tag}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle custom tag input
                        document.getElementById('custom-tag')?.focus();
                      }}
                      className="h-8"
                    >
                      Other
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="custom-tag"
                      placeholder="Enter custom tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addCustomTag} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <Button 
            type="submit" 
            disabled={isGenerating || isPosting}
            className="w-full"
          >
            {isGenerating ? "Generating Summary..." : 
             step === "input" ? "Generate Summary" : 
             isPosting ? "Posting..." : "Post to Community"}
          </Button>
        </form>
      </div>
    </main>
  );
}
