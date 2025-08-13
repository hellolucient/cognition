"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AISnippet {
  id: string;
  title: string;
  description: string;
  year: string;
  image: string;
  imageType: 'emoji' | 'file';
  color: string;
}

const AI_SNIPPETS: AISnippet[] = [
  {
    id: "shakey",
    title: "SHAKEY THE ROBOT",
    description: "Built in the late 1960s, Shakey was the first mobile robot able to reason about its own actions. It could plan routes, push objects, and navigate rooms — slowly, but smartly.",
    year: "1960s",
    image: "🤖", // Could be "/ai-history/shakey-robot.png" when you add images
    imageType: 'emoji',
    color: "bg-blue-600"
  },
  {
    id: "eliza",
    title: "ELIZA",
    description: "Created in 1966, ELIZA was one of the first chatbots. It simulated conversation by using pattern matching and substitution, making people believe they were talking to a real therapist.",
    year: "1966",
    image: "💬",
    imageType: 'emoji',
    color: "bg-green-600"
  },
  {
    id: "turing-test",
    title: "THE TURING TEST",
    description: "Alan Turing proposed in 1950 that a machine could be considered intelligent if it could engage in conversations indistinguishable from a human. Still a benchmark today!",
    year: "1950",
    image: "🧠",
    imageType: 'emoji',
    color: "bg-purple-600"
  },
  {
    id: "perceptron",
    title: "THE PERCEPTRON",
    description: "Frank Rosenblatt's 1957 invention was the first artificial neural network. Though simple, it laid the groundwork for today's deep learning revolution.",
    year: "1957",
    image: "🔗",
    imageType: 'emoji',
    color: "bg-orange-600"
  },
  {
    id: "deep-blue",
    title: "DEEP BLUE",
    description: "IBM's chess computer made history in 1997 by defeating world champion Garry Kasparov. It could evaluate 200 million chess positions per second.",
    year: "1997",
    image: "♟️",
    imageType: 'emoji',
    color: "bg-indigo-600"
  },
  {
    id: "dartmouth",
    title: "DARTMOUTH CONFERENCE",
    description: "The 1956 Dartmouth Summer Research Project coined the term 'Artificial Intelligence' and launched AI as an academic discipline. The field was born here!",
    year: "1956",
    image: "🎓",
    imageType: 'emoji',
    color: "bg-red-600"
  },
  {
    id: "backprop",
    title: "BACKPROPAGATION",
    description: "Developed in the 1970s and popularized in the 1980s, backpropagation became the key algorithm for training neural networks by learning from errors.",
    year: "1980s",
    image: "↩️",
    imageType: 'emoji',
    color: "bg-teal-600"
  },
  {
    id: "gpt-1",
    title: "GPT-1",
    description: "OpenAI's first Generative Pre-trained Transformer in 2018 showed that unsupervised learning could create coherent text. The beginning of the modern AI era.",
    year: "2018",
    image: "🚀",
    imageType: 'emoji',
    color: "bg-pink-600"
  },
  {
    id: "alphago",
    title: "ALPHAGO",
    description: "DeepMind's AlphaGo defeated the world Go champion in 2016, mastering a game with more possible positions than atoms in the observable universe.",
    year: "2016",
    image: "⚫",
    imageType: 'emoji',
    color: "bg-gray-700"
  },
  {
    id: "transformer",
    title: "TRANSFORMER ARCHITECTURE",
    description: "Google's 2017 'Attention Is All You Need' paper introduced transformers, revolutionizing NLP and enabling ChatGPT, GPT-4, and modern language models.",
    year: "2017",
    image: "⚡",
    imageType: 'emoji',
    color: "bg-yellow-600"
  }
];

interface AILoadingModalProps {
  isLoading: boolean;
  delay?: number; // Delay before showing modal (default 1500ms)
}

export function AILoadingModal({ isLoading, delay = 1500 }: AILoadingModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentSnippet, setCurrentSnippet] = useState<AISnippet | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    
    if (isLoading) {
      // Start delay timer
      delayTimer = setTimeout(() => {
        // Pick a random snippet
        const randomSnippet = AI_SNIPPETS[Math.floor(Math.random() * AI_SNIPPETS.length)];
        setCurrentSnippet(randomSnippet);
        setShowModal(true);
        // Small delay for fade-in animation
        setTimeout(() => setIsVisible(true), 50);
      }, delay);
    }
    // Note: We don't automatically hide when loading stops
    // Modal stays visible until user manually closes it

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [isLoading, delay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setCurrentSnippet(null);
    }, 300);
  };

  if (!showModal || !currentSnippet) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`${currentSnippet.color} rounded-lg p-8 max-w-md w-full mx-4 text-white transform transition-all duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 flex items-center justify-center">
            {currentSnippet.imageType === 'emoji' ? (
              <div className="text-4xl">{currentSnippet.image}</div>
            ) : (
              <img 
                src={currentSnippet.image} 
                alt={currentSnippet.title}
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {currentSnippet.title}
          </h2>
          
          <p className="text-white/90 leading-relaxed">
            {currentSnippet.description}
          </p>
          
          <div className="flex items-center justify-between pt-4">
            <span className="text-white/80 text-sm font-medium">
              {currentSnippet.year}
            </span>
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
        </div>
      </div>
    </div>
  );
}
