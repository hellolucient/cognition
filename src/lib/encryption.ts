import crypto from 'crypto';
import { AIProvider } from './ai-providers';

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required');
}

// Ensure the key is exactly 32 bytes for AES-256
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

/**
 * Encrypt an API key for secure database storage
 */
export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16); // Generate random IV for each encryption
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine IV and encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an API key for use in API calls
 */
export function decryptApiKey(encryptedApiKey: string): string {
  try {
    const [ivHex, encrypted] = encryptedApiKey.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted API key format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Validate API key based on provider (server-side only)
 */
export function validateApiKey(apiKey: string, provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      // OpenAI keys start with 'sk-' and are typically 51 characters long
      return /^sk-[a-zA-Z0-9]{48}$/.test(apiKey);
    
    case 'anthropic':
      // Anthropic keys start with 'sk-ant-' and are longer
      return /^sk-ant-[a-zA-Z0-9\-_]{95,}$/.test(apiKey);
    
    case 'google':
      // Google AI Studio keys are typically 39 characters, alphanumeric + some symbols
      return /^[a-zA-Z0-9\-_]{35,45}$/.test(apiKey);
    
    default:
      return false;
  }
}