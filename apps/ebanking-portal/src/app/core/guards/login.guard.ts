import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@/store/auth-store';

export const LoginGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  try {
    const isLoggedIn = authStore.isAuthenticated();
    const isSessionExpired = authStore.isSessionExpired();

    console.log('LoginGuard: isLoggedIn =', isLoggedIn, 'isSessionExpired =', isSessionExpired);

    // If user is authenticated and session is valid, redirect to dashboard
    if (isLoggedIn && !isSessionExpired) {
      console.log('LoginGuard: User is logged in with valid session, redirecting to dashboard');
      router.navigate(['/'], { replaceUrl: true });
      return false;
    }

    // If user has expired session, clear auth state and allow access to login
    if (isLoggedIn && isSessionExpired) {
      console.log('LoginGuard: User has expired session, clearing auth state and allowing login access');
      authStore.clearAuthState();
      return true;
    }

    // If user is not logged in, allow access to login page
    console.log('LoginGuard: User is not logged in, allowing access to login page');
    return true;
  } catch (error) {
    console.error('LoginGuard error:', error);
    // On error, clear auth state and allow access to login
    authStore.clearAuthState();
    return true;
  }
};
