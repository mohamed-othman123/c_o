import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  changePassword(
    encryptedCurrentPassword: string,
    encryptedNewPassword: string,
    encryptedConfirmPassword: string,
    publicKey: string,
  ): Observable<ChangePasswordResponse> {
    const requestBody: ChangePasswordRequest = {
      currentPassword: encryptedCurrentPassword,
      newPassword: encryptedNewPassword,
      confirmPassword: encryptedConfirmPassword,
    };

    const headers = new HttpHeaders({
      'public-key': publicKey,
    });

    return this.http.post<ChangePasswordResponse>(`/api/authentication/user/pwd-change`, requestBody, { headers });
  }
}
