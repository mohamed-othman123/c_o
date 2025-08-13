import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { clearTokensFromStorage, loadTokensFromStorage, saveTokensToStorage, Tokens } from '../utils/token-utils';

export type Role = 'SUPER_USER' | 'MAKER' | 'CHECKER_LEVEL_1' | 'CHECKER_LEVEL_2' | 'CHECKER_LEVEL_3' | 'VIEWER';
export interface User {
  username: string;
  email: string;
  roles: Role[];
  companyName: string;
  cif: string;
  softTokenId: string;
  softTokenSerial: string;
  softTokenStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export interface AuthInterface {
  user: User;
  tokens: Tokens;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthInterface>({
    user: {
      username: '',
      email: '',
      roles: [],
      companyName: '',
      cif: '',
      softTokenId: '',
      softTokenSerial: '',
      softTokenStatus: 'INACTIVE',
    },
    tokens: loadTokensFromStorage(),
  }),
  withComputed(store => ({
    isAuthenticated: computed(() => {
      const tokens = store.tokens();
      const hasToken = !!tokens?.accessToken;
      console.log('isAuthenticated computed: tokens =', tokens, 'hasToken =', hasToken);
      return hasToken;
    }),
    isSessionExpired: computed(() => {
      const tokens = store.tokens();
      if (!tokens?.accessToken) return true;
      const issuedAtMs = tokens.issuedAtMs ?? 0;
      const ttlSeconds = tokens.expiresIn ?? 0;
      if (!issuedAtMs || !ttlSeconds) return true;
      const now = Date.now();
      const expiresAtMs = issuedAtMs + ttlSeconds * 1000;
      return now >= expiresAtMs;
    }),
  })),
  withMethods(store => ({
    setProfileInfo(user: User) {
      patchState(store, { user });
    },
    setTokens(tokens: Tokens) {
      const withIssued = { ...tokens, issuedAtMs: Date.now() } as Tokens;
      saveTokensToStorage(withIssued);
      patchState(store, { tokens: withIssued });
    },
    clearAuthState() {
      console.log('Clearing auth state...');
      clearTokensFromStorage();

      // Create a clean state instead of reusing initialAuthState
      const cleanState: AuthInterface = {
        user: {
          username: '',
          email: '',
          roles: [],
          companyName: '',
          cif: '',
          softTokenId: '',
          softTokenSerial: '',
          softTokenStatus: 'INACTIVE',
        },
        tokens: {
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
          issuedAtMs: 0,
        },
      };

      patchState(store, cleanState);
      console.log('Auth state cleared, isAuthenticated:', store.isAuthenticated());
    },
  })),
);
