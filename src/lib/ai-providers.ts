// Client-safe AI provider utilities (no server environment variables)

export type AIProvider = 'openai' | 'anthropic' | 'google';

export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'google':
      return 'Google AI';
    default:
      return 'Unknown';
  }
}

export function getProviderDocsUrl(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'https://platform.openai.com/api-keys';
    case 'anthropic':
      return 'https://console.anthropic.com/settings/keys';
    case 'google':
      return 'https://aistudio.google.com/app/apikey';
    default:
      return '#';
  }
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return apiKey;
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}${'*'.repeat(Math.min(apiKey.length - 8, 20))}${end}`;
}