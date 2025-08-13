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
  },
  {
    id: "neural-network",
    title: "ARTIFICIAL NEURAL NETWORKS",
    description: "Inspired by biological brains, artificial neural networks were first conceptualized in 1943. Today's deep learning models can have billions of interconnected nodes.",
    year: "1943",
    image: "🧬",
    imageType: 'emoji',
    color: "bg-cyan-600"
  },
  {
    id: "expert-systems",
    title: "EXPERT SYSTEMS",
    description: "MYCIN (1970s) was one of the first expert systems, diagnosing bacterial infections better than many doctors. It paved the way for AI in healthcare.",
    year: "1970s",
    image: "🏥",
    imageType: 'emoji',
    color: "bg-emerald-600"
  },
  {
    id: "lisp",
    title: "LISP PROGRAMMING",
    description: "Created in 1958, LISP became the dominant AI programming language for decades. Its recursive nature made it perfect for symbolic AI reasoning.",
    year: "1958",
    image: "💻",
    imageType: 'emoji',
    color: "bg-violet-600"
  },
  {
    id: "machine-learning",
    title: "MACHINE LEARNING TERM",
    description: "Arthur Samuel coined 'machine learning' in 1959, defining it as giving computers the ability to learn without being explicitly programmed.",
    year: "1959",
    image: "📚",
    imageType: 'emoji',
    color: "bg-rose-600"
  },
  {
    id: "ai-winter",
    title: "THE AI WINTER",
    description: "The 1970s-80s 'AI Winter' saw funding cuts and skepticism after overpromising. It taught the field valuable lessons about realistic expectations.",
    year: "1970s-80s",
    image: "❄️",
    imageType: 'emoji',
    color: "bg-slate-600"
  },
  {
    id: "watson",
    title: "IBM WATSON",
    description: "In 2011, Watson defeated Jeopardy! champions using natural language processing and vast knowledge databases. It marked AI's return to mainstream attention.",
    year: "2011",
    image: "🏆",
    imageType: 'emoji',
    color: "bg-amber-600"
  },
  {
    id: "imagenet",
    title: "IMAGENET REVOLUTION",
    description: "The 2012 ImageNet competition breakthrough using deep CNNs reduced image recognition errors by 10%, sparking the modern deep learning boom.",
    year: "2012",
    image: "📸",
    imageType: 'emoji',
    color: "bg-lime-600"
  },
  {
    id: "gan",
    title: "GENERATIVE ADVERSARIAL NETWORKS",
    description: "Ian Goodfellow invented GANs in 2014, enabling AI to create realistic fake images, videos, and art by training two networks against each other.",
    year: "2014",
    image: "🎨",
    imageType: 'emoji',
    color: "bg-fuchsia-600"
  },
  {
    id: "alphafold",
    title: "ALPHAFOLD PROTEIN FOLDING",
    description: "DeepMind's AlphaFold solved the 50-year protein folding problem in 2020, potentially revolutionizing drug discovery and biology research.",
    year: "2020",
    image: "🧪",
    imageType: 'emoji',
    color: "bg-teal-700"
  },
  {
    id: "chatgpt",
    title: "CHATGPT PHENOMENON",
    description: "Released in November 2022, ChatGPT reached 100 million users in just 2 months, becoming the fastest-growing consumer app in history.",
    year: "2022",
    image: "💭",
    imageType: 'emoji',
    color: "bg-green-700"
  },
  {
    id: "reinforcement",
    title: "REINFORCEMENT LEARNING",
    description: "Inspired by behavioral psychology, reinforcement learning teaches AI through rewards and penalties. It's how AlphaGo and game-playing AIs master complex strategies.",
    year: "1950s",
    image: "🎯",
    imageType: 'emoji',
    color: "bg-orange-700"
  },
  {
    id: "computer-vision",
    title: "COMPUTER VISION BIRTH",
    description: "The first computer vision experiments in the 1960s tried to identify simple objects. Today's vision AI can recognize thousands of objects in milliseconds.",
    year: "1960s",
    image: "👁️",
    imageType: 'emoji',
    color: "bg-blue-700"
  },
  {
    id: "speech-recognition",
    title: "SPEECH RECOGNITION",
    description: "Bell Labs' 'Audrey' system in 1952 could recognize digits 0-9. Modern speech AI understands natural conversation in hundreds of languages.",
    year: "1952",
    image: "🎤",
    imageType: 'emoji',
    color: "bg-purple-700"
  },
  {
    id: "fuzzy-logic",
    title: "FUZZY LOGIC",
    description: "Lotfi Zadeh's 1965 fuzzy logic allowed AI to handle uncertainty and partial truths, enabling more human-like reasoning in complex situations.",
    year: "1965",
    image: "🌫️",
    imageType: 'emoji',
    color: "bg-gray-600"
  },
  {
    id: "genetic-algorithm",
    title: "GENETIC ALGORITHMS",
    description: "Inspired by evolution, genetic algorithms use mutation and selection to solve optimization problems. They've designed everything from antennas to game strategies.",
    year: "1960s",
    image: "🧬",
    imageType: 'emoji',
    color: "bg-indigo-700"
  },
  {
    id: "turing-machine",
    title: "TURING MACHINE",
    description: "Alan Turing's 1936 theoretical machine laid the foundation for all modern computers and AI. It proved what problems could be solved computationally.",
    year: "1936",
    image: "⚙️",
    imageType: 'emoji',
    color: "bg-red-700"
  },
  {
    id: "ai-ethics",
    title: "AI ETHICS EMERGENCE",
    description: "As AI grows powerful, researchers focus on alignment, bias, and safety. Ensuring AI benefits humanity is now as important as making it smarter.",
    year: "2010s",
    image: "⚖️",
    imageType: 'emoji',
    color: "bg-emerald-700"
  },
  {
    id: "robotics",
    title: "ROBOTICS REVOLUTION",
    description: "The word 'robot' comes from Czech 'robota' (forced labor). Today's robots perform surgery, explore Mars, and may soon be our everyday companions.",
    year: "1920",
    image: "🦾",
    imageType: 'emoji',
    color: "bg-zinc-600"
  },
  {
    id: "neural-turing",
    title: "NEURAL TURING MACHINES",
    description: "DeepMind's 2014 Neural Turing Machines combined neural networks with external memory, allowing AI to learn algorithms and perform complex reasoning tasks.",
    year: "2014",
    image: "🔮",
    imageType: 'emoji',
    color: "bg-violet-700"
  },
  {
    id: "multimodal",
    title: "MULTIMODAL AI",
    description: "Modern AI like GPT-4V can understand text, images, and audio simultaneously, mimicking how humans naturally process multiple types of information.",
    year: "2020s",
    image: "🌈",
    imageType: 'emoji',
    color: "bg-pink-700"
  }
];

interface AILoadingModalProps {
  isLoading: boolean;
  delay?: number; // Delay before showing modal (default 800ms)
  requireAuth?: boolean; // Whether to require authentication (default false)
}

export function AILoadingModal({ isLoading, delay = 800, requireAuth = false }: AILoadingModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentSnippet, setCurrentSnippet] = useState<AISnippet | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  // Check localStorage for disabled state and auth state on mount
  useEffect(() => {
    const disabled = localStorage.getItem('ai-loading-modals-disabled') === 'true';
    setIsDisabled(disabled);
    
    // Check if user is authenticated (simple check for session cookie or localStorage)
    const hasAuth = document.cookie.includes('sb-') || localStorage.getItem('supabase.auth.token');
    setUserAuthenticated(!!hasAuth);
    
    console.log('🤖 AI Loading Modal - Disabled state:', disabled, 'Auth required:', requireAuth, 'User auth:', !!hasAuth);
  }, [requireAuth]);

  useEffect(() => {
    console.log('🤖 AI Loading Modal - State change:', { isLoading, isDisabled, delay, requireAuth, userAuthenticated });
    let delayTimer: NodeJS.Timeout;
    
    // Show modal if loading and not disabled, and either no auth required OR user is authenticated
    const shouldShow = isLoading && !isDisabled && (!requireAuth || userAuthenticated);
    
    if (shouldShow) {
      console.log('🤖 AI Loading Modal - Starting delay timer for', delay, 'ms');
      // Start delay timer
      delayTimer = setTimeout(() => {
        console.log('🤖 AI Loading Modal - Delay timer fired, showing modal');
        // Pick a random snippet
        const randomSnippet = AI_SNIPPETS[Math.floor(Math.random() * AI_SNIPPETS.length)];
        setCurrentSnippet(randomSnippet);
        setShowModal(true);
        // Small delay for fade-in animation
        setTimeout(() => setIsVisible(true), 50);
      }, delay);
    } else {
      console.log('🤖 AI Loading Modal - Not showing:', { isLoading, isDisabled, requireAuth, userAuthenticated });
    }
    // Note: We don't automatically hide when loading stops
    // Modal stays visible until user manually closes it

    return () => {
      if (delayTimer) {
        console.log('🤖 AI Loading Modal - Clearing delay timer');
        clearTimeout(delayTimer);
      }
    };
  }, [isLoading, delay, isDisabled, requireAuth, userAuthenticated]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setCurrentSnippet(null);
    }, 300);
  };

  const handleDisable = () => {
    localStorage.setItem('ai-loading-modals-disabled', 'true');
    setIsDisabled(true);
    handleClose();
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
          
          {/* Disable option */}
          <div className="pt-4 border-t border-white/20 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisable}
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs w-full justify-center"
            >
              Don't show these popups again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
