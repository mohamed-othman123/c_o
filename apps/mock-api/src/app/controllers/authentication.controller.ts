import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtService } from '../services/jwt.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(private jwtService: JwtService) {}

  @Get('auth/gen-key')
  @HttpCode(HttpStatus.OK)
  genKey() {
    const publicKey =
      'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjTqUwzt2toDuyImvf/s6Gny/b0XrSxvzpzGMoMnys/ddQgCtbUkB4NBUHSov1b895bn6YYDQRqeRi4qgbZQlQR8BtLbYCUNx1S8uDBggckgQHMIxt65wibYRTme1VRQw6m1xUn/cGOwDqV+wWCqCpgypmzjzWWZVpW6uv+e1ZQzkt8iizC6qRzR3QRiJYdhl4TT5OyucSPcGQZJ7xCTrHNKTyhscvgZTSSFiujf4V9vNoZE9fpThJ5wuFAdbrSkDLXTCwgeTpUMx+9yWNAeJpEP3673EXWO8qoIdDWip0i/ysYe0l0oIWNDMvBZfumCD8Z6TFF7OEOpF8ykuVuTTGwIDAQAB';
    return {
      publicKey,
    };
  }

  @Post('auth/mobile/login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Headers('recaptcha-token') recaptchaToken: string,
    @Headers('public-key') publicKey: string,
    @Headers('Content-Type') contentType: string,
  ) {
    if (contentType !== 'application/x-www-form-urlencoded') {
      throw new HttpException('Invalid Content-Type header', HttpStatus.BAD_REQUEST);
    }

    // Generate short-lived JWT tokens for mock testing
    const { accessToken, refreshToken, expiresIn } = this.jwtService.generateTokens({
      username,
      email: 'hatem@corporate.com',
      realm_access: {
        roles: ['SUPER_USER'],
      },
      roles: ['MAKER', 'SUPER_USER'],
      companyName: 'AL-Hatem Group',
    });

    return { accessToken, refreshToken, expiresIn };
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  me(@Headers('Authorization') accessToken: string) {
    return this.jwtService.decodeToken(accessToken.split(' ')[1]);
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    const newAccessToken = this.jwtService.refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    return {
      accessToken: newAccessToken,
      expiresIn: 900,
    };
  }

  @Post('auth/validate-user')
  @HttpCode(HttpStatus.OK)
  validateUser(@Body('companyId') companyId: string) {
    if (companyId === '123') {
      throw new HttpException(
        { code: 'OTP-003', details: { hoursRemaining: '2025-03-18T11:28:41.177Z' } },
        HttpStatus.BAD_REQUEST,
      );
    }
    return { numberOfAttempts: 1, token: 'token123', maskedMobileNumber: '*****987', maskedEmail: '88888.com' };
  }

  @Post('auth/forget-password')
  @HttpCode(HttpStatus.OK)
  forgetPassword(
    @Headers('public-key') publicKey: string,
    @Body('password') password: string,
    @Body('token') token: string,
  ) {
    return {
      message: 'Success',
    };
  }

  @Post('activate/userDetails')
  @HttpCode(HttpStatus.OK)
  userDetails() {
    return { maskedMobileNumber: '01111111111', maskedEmail: 'wudhdn@lcmckc.co' };
  }

  @Post('activate/regenerate')
  @HttpCode(HttpStatus.OK)
  resendOtp() {
    return { numberOfAttempts: 2 };
  }

  @Post('activate/validate')
  @HttpCode(HttpStatus.OK)
  validateCode(@Body('activationCode') activationCode: string) {
    return { token: 2 };
  }

  @Post('activate/setPassword')
  @HttpCode(HttpStatus.NO_CONTENT)
  createPassword(@Body('password') password: string, @Headers('public-key') publicKey: string) {
    return null; // No content
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body('token') token: string) {
    return { numberOfAttempts: '1' };
  }

  @Post('otp/resend')
  @HttpCode(HttpStatus.OK)
  resendOTP(@Body('token') token: string) {
    return { numberOfAttempts: '1' };
  }

  @Post('otp/validate')
  @HttpCode(HttpStatus.OK)
  validateOtp(@Body('otp') otp: string, @Body('token') token: string) {
    if (otp === '123456') {
      return { token: 'token12345' };
    } else if (otp === '234567') {
      throw new HttpException({ code: 'OTP-002' }, HttpStatus.BAD_REQUEST);
    }
    throw new HttpException({ code: 'OTP-001' }, HttpStatus.BAD_REQUEST);
  }

  @Post('user/register')
  @HttpCode(HttpStatus.OK)
  registerUser(@Body('companyId') companyId: string, @Body('mobileNumber') mobileNumber: string) {
    return { numberOfAttempts: '1', otpToken: '123token', maskedMobile: '*****8765', maskedEmail: '8888@ci.co' };
  }

  @Post('user/getForm')
  @HttpCode(HttpStatus.OK)
  generatePDF(@Body('companyId') companyId: string, @Body('token') token: string) {
    return {
      file: 'file_string',
    };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out successfully' };
  }

  @Post('user/pwd-change')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Body('confirmPassword') confirmPassword: string,
  ) {
    if (currentPassword === 'wrongpassword') {
      throw new HttpException(
        {
          status: 'error',
          message: 'Current password is incorrect',
          code: 'PWD-001',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (newPassword !== confirmPassword) {
      throw new HttpException(
        {
          status: 'error',
          message: 'New password and confirm password do not match',
          code: 'PWD-002',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      status: 'success',
      message: 'Password changed successfully',
    };
  }

  @Get('auth/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyAuth(@Req() req) {
    return req.user;
  }
}
