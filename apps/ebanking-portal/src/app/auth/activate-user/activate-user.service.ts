import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResult } from '@/models/api';

@Injectable()
export class ActivateUserService {
  readonly http = inject(HttpClient);

  validateUser(data: { username: string }) {
    return this.http.post<ApiResult<{ maskedMobileNumber: string; maskedEmail: string }>>(
      `/api/authentication/activate/userDetails`,
      data,
    );
  }

  resendOtp(username: string) {
    return this.http.post<ApiResult<{ numberOfAttempts: number }>>(`/api/authentication/activate/regenerate`, {
      username,
    });
  }

  validateCode(data: { username: string; activationcode: string }) {
    return this.http.post<ApiResult<null>>(`/api/authentication/activate/validate`, data);
  }

  createPassword(data: { username: string; password: string; key: string }) {
    const headers = new HttpHeaders({
      'public-key': data.key,
    });
    return this.http.post<ApiResult<null>>(`/api/authentication/activate/setPassword`, data, { headers });
  }
}
