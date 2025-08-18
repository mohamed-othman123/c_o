export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  issuedAtMs?: number;
}

const STORAGE_KEY = 'auth_tokens';

const emptyTokens: Tokens = {
  accessToken: '',
  refreshToken: '',
  expiresIn: 0,
  issuedAtMs: 0,
};

export const loadTokensFromStorage = (): Tokens => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('loadTokensFromStorage: stored value =', stored);

    if (!stored) {
      console.log('loadTokensFromStorage: no stored tokens, returning empty tokens');
      return emptyTokens;
    }

    const parsed = JSON.parse(stored);
    console.log('loadTokensFromStorage: parsed tokens =', parsed);

    // Validate the parsed tokens
    if (parsed && typeof parsed === 'object' && parsed.accessToken) {
      return parsed;
    } else {
      console.log('loadTokensFromStorage: invalid tokens, returning empty tokens');
      return emptyTokens;
    }
  } catch (error) {
    console.error('loadTokensFromStorage: error parsing tokens:', error);
    return emptyTokens;
  }
};

export const saveTokensToStorage = (tokens: Tokens): void => {
  try {
    console.log('saveTokensToStorage: saving tokens =', tokens);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    console.log('saveTokensFromStorage: tokens saved successfully');
  } catch (error) {
    console.error('saveTokensToStorage: error saving tokens:', error);
  }
};

export const clearTokensFromStorage = (): void => {
  console.log('Clearing tokens from storage...');
  const before = localStorage.getItem(STORAGE_KEY);
  console.log('Tokens before clearing:', before);

  try {
    localStorage.removeItem(STORAGE_KEY);
    const after = localStorage.getItem(STORAGE_KEY);
    console.log('Tokens after clearing:', after);

    if (after === null) {
      console.log('clearTokensFromStorage: tokens cleared successfully');
    } else {
      console.warn('clearTokensFromStorage: tokens may not have been cleared properly');
    }
  } catch (error) {
    console.error('clearTokensFromStorage: error clearing tokens:', error);
  }
};
