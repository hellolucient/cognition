"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TypingLoader } from "@/components/ui/typing-loader";

export default function DemoTypingPage() {
  const [showLoader, setShowLoader] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>("");

  const demoMessages = [
    "If vanwinkle winks while you think… is that a thinkle-winkle?",
    "Crafting the perfect summary for your conversation...",
    "Summoning the AI muses to craft your contribution...",
    "Launching your idea into the vanwinkle universe...",
    "We're just checking if your question violates any existential rules.",
    "Loading the collective brain. Please get yours ready.",
  ];

  const handleShowDemo = (message?: string) => {
    setCustomMessage(message || "");
    setShowLoader(true);
  };

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Typing Loader Demo</h1>
          <p className="text-muted-foreground">
            Test the new typing animation loading messages. Click any button to see it in action!
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Random Message</h2>
          <Button onClick={() => handleShowDemo()}>
            Show Random Loading Message
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Specific Messages</h2>
          <div className="grid gap-2">
            {demoMessages.map((message, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleShowDemo(message)}
                className="text-left justify-start h-auto p-4"
              >
                <span className="text-sm">{message}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Text appears one character at a time (typewriter effect)</li>
            <li>• Blinking cursor shows while typing</li>
            <li>• "Click anywhere to continue" appears when typing is complete</li>
            <li>• Click anywhere on the overlay to dismiss</li>
            <li>• Customizable typing speed and messages</li>
            <li>• Random message selection from the pool</li>
          </ul>
        </div>
      </div>

      <TypingLoader 
        isVisible={showLoader}
        onDismiss={() => setShowLoader(false)}
        customMessage={customMessage || undefined}
        typingSpeed={40} // Slightly faster for demo
      />
    </main>
  );
}
