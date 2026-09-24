/**
 * Global Configuration for Candipuro AI
 * All values can be overridden via environment variables
 */

export const AI_CONFIG = {
  // Model name can be overridden via OPENAI_MODEL
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",

  // Maximum number of past conversation messages sent to OpenAI context
  maxHistoryMessages: Number(process.env.AI_MAX_HISTORY) || 10,

  // Maximum character length per user message before truncation
  maxMessageLength: Number(process.env.AI_MAX_MESSAGE_LENGTH) || 2000,

  // Max retries for OpenAI API calls
  maxRetries: Number(process.env.AI_MAX_RETRIES) || 3,

  // Base delay between retries in milliseconds
  retryDelayMs: Number(process.env.AI_RETRY_DELAY_MS) || 1000,

  // Fallbacks for dynamic metadata parsing
  defaultLanguage: "id",
  defaultTopic: "Umum",
  defaultTitle: "Percakapan Baru",
};

export const QUOTA_CONFIG = {
  // Max tokens for logged in user (default 50.000)
  maxTokensLoggedIn: Number(process.env.NEXT_PUBLIC_MAX_TOKENS_LOGGED_IN || process.env.MAX_TOKENS_LOGGED_IN) || 50000,

  // Max tokens for anonymous/guest user (default 10.000)
  maxTokensAnonymous: Number(process.env.NEXT_PUBLIC_MAX_TOKENS_ANONYMOUS || process.env.MAX_TOKENS_ANONYMOUS) || 10000,

  // Reset window in hours (default 3 hours)
  resetWindowHours: Number(process.env.RESET_WINDOW_HOURS) || 3,

  // Calculated reset window in milliseconds
  get resetWindowMs() {
    return this.resetWindowHours * 60 * 60 * 1000;
  },

  // Firestore collection name for quota records
  collectionName: process.env.QUOTA_COLLECTION_NAME || "quotas",
};

export const STREAM_CONFIG = {
  // Max characters to buffer searching for the dynamic <!--METADATA: ...--> tag before flushing
  metadataBufferLimit: Number(process.env.STREAM_METADATA_BUFFER_LIMIT) || 250,

  // Estimated characters per token for fallback calculation when stream doesn't report usage
  charsPerToken: Number(process.env.STREAM_CHARS_PER_TOKEN) || 4,
};
