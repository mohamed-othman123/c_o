import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStore } from '@/store/auth-store';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  status: string;
  message: string;
}

@Injectable()
export class ChangePasswordService {
  readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<ChangePasswordResponse> {
    const requestBody: ChangePasswordRequest = {
      currentPassword,
      newPassword,
      confirmPassword,
    };

    const accessToken = this.authStore.tokens()?.accessToken;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    return this.http.post<ChangePasswordResponse>(`/api/authentication/user/pwd-change`, requestBody, { headers });
  }
}
