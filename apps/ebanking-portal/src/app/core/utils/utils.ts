import { DatePipe } from '@angular/common';
import { computed, inject } from '@angular/core';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoService } from '@jsverse/transloco';
import { ScbDate } from '@scb/util/datepicker';

export const DATE_FORMAT = 'h:mm a, d MMM y';

export function calculateUserLockedTime(lockedDateTime: string, currentDate: string | Date = new Date()) {
  const currentDateTime = new ScbDate(currentDate);
  const userLockedTime = new ScbDate(lockedDateTime);
  const diff = currentDateTime.diff(userLockedTime, 'minutes');
  /* istanbul ignore file */
  if (diff > 60) {
    return { time: Math.floor(diff / 60), isHours: true };
  }
  return { time: diff, isHours: false };
}

export function lockedUserTitleDesc(date: string, transloco: TranslocoService) {
  const { time, isHours } = calculateUserLockedTime(date);
  return {
    title: transloco.translate('credentialsLockedTitle'),
    description: transloco.translate('credentialsLockedDesc', {
      // We have to maintain min 1 minutes
      timeLeft: isHours ? time : Math.max(1, time),
      state: transloco.translate(isHours ? 'hours' : 'minutes'),
    }),
  };
}

export function lockedActivateUserTitleDesc(date: string, transloco: TranslocoService) {
  const { time, isHours } = calculateUserLockedTime(date);
  return {
    title: transloco.translate('credentialsLockedTitle'),
    description: transloco.translate('credentialsACLockedDesc', {
      timeLeft: time,
      state: transloco.translate(isHours ? 'hours' : 'minutes'),
    }),
  };
}

export function lastUpdateProcess(lastUpdateAt: () => number | string | undefined) {
  const datePipe = inject(DatePipe);
  const layoutFacade = inject(LayoutFacadeService);
  return computed(() => {
    const lang = layoutFacade.language();
    const timestamp = lastUpdateAt() || '';

    const final = datePipe.transform(timestamp, DATE_FORMAT, undefined, lang) || '';
    return final;
  });
}

export function isEqual<T>(arr1: T[], arr2: T[]) {
  return arr1.length === arr2.length && arr1.every(x => arr2.includes(x));
}

export function extractTokenData(
  token: string,
): { email: string; mobile: string; expiration: string; username: string } | null {
  try {
    if (!token || typeof token !== 'string') {
      console.error('extractTokenData: Invalid token input:', token);
      return null;
    }

    // Clean up the token for base64 decoding
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      console.error('extractTokenData: Invalid base64 format in token');
      return null;
    }

    const decodedText = atob(base64);

    if (!decodedText || decodedText.trim() === '') {
      console.error('extractTokenData: Decoded token is empty');
      return null;
    }

    const parts = decodedText.split(':');

    if (parts.length < 4) {
      console.error(
        'extractTokenData: Token format invalid - expected at least 4 parts (email:mobile:expiration:username), got:',
        parts.length,
      );
      return null;
    }

    const [email, mobile, ...remainingParts] = parts;

    // The last part is the username, everything in between is the expiration datetime
    const username = remainingParts.pop()!;
    const expiration = remainingParts.join(':');

    // Validate extracted data
    if (!email || !mobile || !expiration || !username) {
      console.error('extractTokenData: Missing required fields in token:', { email, mobile, expiration, username });
      return null;
    }

    // Validate that we have at least some content for expiration (should contain datetime format)
    if (expiration.trim() === '') {
      console.error('extractTokenData: Expiration datetime is empty');
      return null;
    }

    // Basic email validation
    if (!email.includes('@') || email.length < 3) {
      console.error('extractTokenData: Invalid email format:', email);
      return null;
    }

    // Basic mobile validation (should contain digits)
    if (!/\d/.test(mobile) || mobile.length < 5) {
      console.error('extractTokenData: Invalid mobile format:', mobile);
      return null;
    }

    return {
      email: email.trim(),
      mobile: mobile.trim(),
      expiration: expiration.trim(),
      username: username.trim(),
    };
  } catch (error) {
    console.error('extractTokenData: Error decoding token:', error, 'Token:', token);
    return null;
  }
}
