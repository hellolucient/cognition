/**
 * AI Platform URL Detection and Validation
 * 
 * This module provides utilities to detect which AI platform a share URL belongs to
 * and validate the URL structure for supported platforms.
 */

export interface PlatformInfo {
  name: string;
  detected: boolean;
  displayName: string;
}

export interface URLAnalysis {
  isValid: boolean;
  platform: PlatformInfo;
  error?: string;
}

/**
 * URL patterns for different AI platforms
 */
const PLATFORM_PATTERNS = {
  chatgpt: {
    name: "ChatGPT",
    displayName: "ChatGPT",
    patterns: [
      /^https:\/\/chatgpt\.com\/share\/.+/i,
      /^https:\/\/chat\.openai\.com\/share\/.+/i,
    ]
  },
  claude: {
    name: "Claude",
    displayName: "Claude (Anthropic)",
    patterns: [
      /^https:\/\/claude\.ai\/share\/[a-f0-9-]+$/i,
    ]
  },
  perplexity: {
    name: "Perplexity",
    displayName: "Perplexity",
    patterns: [
      /^https:\/\/www\.perplexity\.ai\/search\/[a-f0-9-]+$/i,
    ]
  },
  grok: {
    name: "Grok",
    displayName: "Grok (xAI)",
    patterns: [
      /^https:\/\/grok\.com\/share\/.+$/i,
    ]
  },
  gemini: {
    name: "Gemini",
    displayName: "Gemini (Google)",
    patterns: [
      /^https:\/\/g\.co\/gemini\/share\/[a-f0-9]+$/i,
    ]
  },
  copilot: {
    name: "Copilot",
    displayName: "Copilot (Microsoft)",
    patterns: [
      /^https:\/\/copilot\.microsoft\.com\/shares\/[a-zA-Z0-9]+$/i,
    ]
  }
};

/**
 * Detects which AI platform a URL belongs to
 */
export function detectPlatform(url: string): PlatformInfo {
  // Trim whitespace and normalize
  const cleanUrl = url.trim();
  
  for (const [key, platform] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of platform.patterns) {
      if (pattern.test(cleanUrl)) {
        return {
          name: platform.name,
          detected: true,
          displayName: platform.displayName
        };
      }
    }
  }
  
  return {
    name: "Unknown",
    detected: false,
    displayName: "Unknown Platform"
  };
}

/**
 * Validates if a URL is from a supported AI platform
 */
export function validateAIUrl(url: string): URLAnalysis {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      platform: { name: "Unknown", detected: false, displayName: "Unknown Platform" },
      error: "URL is required"
    };
  }
  
  // Basic URL validation
  try {
    new URL(url.trim());
  } catch {
    return {
      isValid: false,
      platform: { name: "Unknown", detected: false, displayName: "Unknown Platform" },
      error: "Invalid URL format"
    };
  }
  
  const platform = detectPlatform(url);
  
  if (!platform.detected) {
    return {
      isValid: false,
      platform,
      error: "This URL is not from a supported AI platform. Supported platforms: ChatGPT, Claude, Perplexity, Grok, Gemini, Copilot"
    };
  }
  
  return {
    isValid: true,
    platform
  };
}

/**
 * Gets all supported platforms for display purposes
 */
export function getSupportedPlatforms(): string[] {
  return Object.values(PLATFORM_PATTERNS).map(p => p.displayName);
}

/**
 * Auto-detects clipboard content for supported AI platforms
 */
export function isLikelyAIUrl(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const cleanText = text.trim();
  return detectPlatform(cleanText).detected;
}
