"use client";

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "If vanwinkle winks while you think… is that a thinkle-winkle?",
  "Somewhere out there, someone is sleeping through the AI revolution.",
  "If an AI collaborates in the forest and nobody prompts it… did it even think?",
  "Can a prompt dream of electric sheep?",
  "Is this a loading screen, or a moment of introspection?",
  "What's heavier: a simple question, or the answer you didn't expect?",
  "Fun fact: Most people blink 12 times before this loads.",
  "AI consumes 97% inspiration, 3% GPU.",
  "Loading… because thinking takes at least 2.7s.",
  "Did you know a human brain has 86B neurons and still forgets passwords?",
  "If collaboration is the new currency… does that make this screen a bank?",
  "Maybe the true answer was the loading screen all along.",
  "Somewhere, right now, a prompt is shouting into the void.",
  "If ideas could stretch, would they ever snap… or just loop back?",
  "We're not stalling. We're just choosing the most interesting thought.",
  "Time moves slower in the loading dimension. Use it wisely.",
  "Please hold while we translate your curiosity into machine-readable awe.",
  "You could check your phone… or wait and see what happens here.",
  "Don't worry — no one's ever been left on the vanwinkle loading screen forever. (…yet.)",
  "This is the part where the universe whispers, '…well?'",
  "Somewhere, a GPT is crying because you didn't phrase the prompt politely.",
  "Loading… because thinking is harder than blindly reacting.",
  "You could've gone outside and touched grass. But you chose this instead.",
  "If you fall asleep now, don't worry — the AI will build a new world without you.",
  "We're just checking if your question violates any existential rules.",
  "Let's see whether your idea survives the loading screen of doubt.",
  "Loading the collective brain. Please get yours ready.",
  "Warning: excessive thinking may cause spontaneous philosophical combustion.",
  "Fact: Collaboration increases by 37.38% when you say the word 'vanwinkle' out loud.",
  "If your thought has absurd levels of creative potential, please keep arms and legs inside the vehicle at all times."
];

interface TypingLoaderProps {
  isVisible: boolean;
  onDismiss: () => void;
  customMessage?: string;
  typingSpeed?: number; // milliseconds per character
}

export function TypingLoader({ 
  isVisible, 
  onDismiss, 
  customMessage, 
  typingSpeed = 50 
}: TypingLoaderProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Select a random message when component becomes visible
  useEffect(() => {
    if (isVisible && !currentMessage) {
      const message = customMessage || LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
      setCurrentMessage(message);
      setDisplayedText("");
      setIsTypingComplete(false);
    }
  }, [isVisible, customMessage, currentMessage]);

  // Typing animation effect
  useEffect(() => {
    if (!isVisible || !currentMessage || isTypingComplete) return;

    if (displayedText.length < currentMessage.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else {
      setIsTypingComplete(true);
    }
  }, [displayedText, currentMessage, isVisible, typingSpeed, isTypingComplete]);

  // Reset when component becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setDisplayedText("");
      setCurrentMessage("");
      setIsTypingComplete(false);
    }
  }, [isVisible]);

  // Handle click to dismiss
  const handleClick = () => {
    if (isVisible) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      <div className="max-w-2xl mx-4 p-8 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center space-y-6">
          {/* Typing indicator */}
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>

          {/* Typed message */}
          <div className="relative">
            <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed min-h-[2rem]">
              {displayedText}
              {/* Blinking cursor */}
              {!isTypingComplete && (
                <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse"></span>
              )}
            </p>
          </div>

          {/* Dismiss hint */}
          {isTypingComplete && (
            <div className="text-sm text-muted-foreground animate-fade-in">
              Click anywhere to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// CSS for fade-in animation (add to globals.css)
/*
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-in;
}
*/
