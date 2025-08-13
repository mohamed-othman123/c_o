import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../store/auth-store';

export const SecuredJwtAuthGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  try {
    const isLoggedIn = authStore.isAuthenticated();
    const isSessionExpired = authStore.isSessionExpired();

    console.log('AuthGuard: isLoggedIn =', isLoggedIn, 'isSessionExpired =', isSessionExpired);

    // Check if user is authenticated
    if (!isLoggedIn) {
      console.log('AuthGuard: User not authenticated, redirecting to login');
      router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    // Check if session has expired
    if (isSessionExpired) {
      console.log('AuthGuard: Session expired, clearing auth state and redirecting to login');
      authStore.clearAuthState();
      router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    console.log('AuthGuard: User authenticated and session valid, allowing access');
    return true;
  } catch (error) {
    console.error('AuthGuard error:', error);
    // Clear auth state on error and redirect to login
    authStore.clearAuthState();
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
};
