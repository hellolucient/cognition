"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
  isLoading: boolean;
  delay?: number; // Delay before showing modal (default 800ms)
  requireAuth?: boolean; // Whether to require authentication (default false)
  customMessage?: string;
  typingSpeed?: number; // milliseconds per character
}

export function TypingLoader({ 
  isLoading,
  delay = 800,
  requireAuth = false,
  customMessage,
  typingSpeed = 50 
}: TypingLoaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  
  // Message chaining state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [availableMessages, setAvailableMessages] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Check localStorage for disabled state and auth state on mount
  useEffect(() => {
    const disabled = localStorage.getItem('ai-loading-modals-disabled') === 'true';
    setIsDisabled(disabled);
    
    // Check if user is authenticated (simple check for session cookie or localStorage)
    const hasAuth = document.cookie.includes('sb-') || localStorage.getItem('supabase.auth.token');
    setUserAuthenticated(!!hasAuth);
  }, [requireAuth]);

  // Initialize messages when modal should show
  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    
    // Show modal if loading and not disabled, and either no auth required OR user is authenticated
    const shouldShow = isLoading && !isDisabled && (!requireAuth || userAuthenticated);
    
    if (shouldShow) {
      // Start delay timer
      delayTimer = setTimeout(() => {
        // Prepare messages - either custom message or shuffled random messages
        if (customMessage) {
          setAvailableMessages([customMessage]);
        } else {
          // Shuffle messages for variety
          const shuffled = [...LOADING_MESSAGES].sort(() => Math.random() - 0.5);
          setAvailableMessages(shuffled);
        }
        setCurrentMessageIndex(0);
        setShowModal(true);
        // Small delay for fade-in animation
        setTimeout(() => setIsVisible(true), 50);
      }, delay);
    }

    return () => {
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
    };
  }, [isLoading, delay, isDisabled, requireAuth, userAuthenticated, customMessage]);

  // Typing animation effect
  useEffect(() => {
    if (!showModal || !isVisible || availableMessages.length === 0) return;

    const currentMessage = availableMessages[currentMessageIndex];
    if (!currentMessage) return;

    if (!isTypingComplete && displayedText.length < currentMessage.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else if (!isTypingComplete && displayedText.length === currentMessage.length) {
      setIsTypingComplete(true);
    }
  }, [showModal, isVisible, availableMessages, currentMessageIndex, displayedText, isTypingComplete, typingSpeed]);

  // Handle message completion and chaining
  useEffect(() => {
    if (!isTypingComplete || isPulsing) return;

    // Start pulsing after typing completes
    setIsPulsing(true);
    
    // Pulse twice, then move to next message (if still loading and more messages available)
    const pulseTimer = setTimeout(() => {
      if (isLoading && currentMessageIndex < availableMessages.length - 1) {
        // Move to next message
        setCurrentMessageIndex(prev => prev + 1);
        setDisplayedText("");
        setIsTypingComplete(false);
        setIsPulsing(false);
      } else {
        setIsPulsing(false);
      }
    }, 2000); // 2 seconds of pulsing

    return () => clearTimeout(pulseTimer);
  }, [isTypingComplete, isPulsing, isLoading, currentMessageIndex, availableMessages.length]);

  // Reset when loading stops or modal closes
  useEffect(() => {
    if (!isLoading && showModal) {
      // Don't auto-close, let user click to dismiss
    }
  }, [isLoading, showModal]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setDisplayedText("");
      setCurrentMessageIndex(0);
      setAvailableMessages([]);
      setIsTypingComplete(false);
      setIsPulsing(false);
    }, 300);
  };

  const handleDisable = () => {
    localStorage.setItem('ai-loading-modals-disabled', 'true');
    setIsDisabled(true);
    handleClose();
  };

  // Handle click to dismiss
  const handleClick = () => {
    handleClose();
  };

  if (!showModal || availableMessages.length === 0) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClick}
    >
      <div className={`max-w-2xl mx-4 p-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl text-white transform transition-all duration-300 ${isVisible ? 'scale-100' : 'scale-95'} ${isPulsing ? 'animate-pulse' : ''}`}>
        {/* Header with close button */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="text-3xl">💭</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>

        {/* Typed message */}
        <div className="space-y-6">
          <div className="relative">
            <p className="text-lg md:text-xl font-medium leading-relaxed min-h-[3rem]">
              {displayedText}
              {/* Blinking cursor */}
              {!isTypingComplete && (
                <span className="inline-block w-0.5 h-6 bg-white ml-1 animate-pulse"></span>
              )}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-white/80 text-sm">
              {availableMessages.length > 1 && (
                <span>Message {currentMessageIndex + 1} of {availableMessages.length}</span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                  <span>Loading continues...</span>
                </>
              ) : (
                <>
                  <div className="rounded-full h-4 w-4 bg-green-400 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Page loaded!</span>
                </>
              )}
            </div>
          </div>

          {/* Dismiss hint */}
          {(isTypingComplete || !isLoading) && (
            <div className="text-center">
              <div className="text-white/70 text-sm animate-fade-in mb-3">
                Click anywhere to continue
              </div>
              
              {/* Disable option */}
              <div className="pt-3 border-t border-white/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisable();
                  }}
                  className="text-white/70 hover:text-white hover:bg-white/10 text-xs w-full justify-center"
                >
                  Don't show these messages again
                </Button>
              </div>
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
