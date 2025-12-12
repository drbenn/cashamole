import * as CommonTypes from '@common-types';
import { Body, ConflictException, Controller, Get, Inject, InternalServerErrorException, Logger, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Response, Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Post('register')
  async register(
    @Body() dto: CommonTypes.CreateUserDto,
    @Req() req: Request,                          // req for capturing and logging ip
    @Res({ passthrough: true }) res: Response,    // Enables passing response
  ): Promise<any> {
    return await this.authService.registerUser(dto);
  };

  @Post('login')
  async login(
    @Body() dto: CommonTypes.LoginUserDto,
    @Req() req: Request,                          // req for capturing and logging ip
    @Res({ passthrough: true }) res: Response,    // Enables passing response
  ): Promise<any> {
    const ipAddress: string = this.authService.getClientIp(req)
    const response = await this.authService.loginUser(dto, ipAddress);
    this.sendLoginCookies(res, response.jwtAccessToken, response.jwtRefreshToken);
    return response
  };

  @Get('login-cached')
  async loginCachedUser(
    @Req() req: Request,                          // req for capturing and logging ip
    @Res({ passthrough: true }) res: Response,    // Enables passing response
  ): Promise<any> {
    console.log('login cachced');
    const sessionToken = req.cookies['jwt'];
    const refreshToken = req.cookies['refresh_token'];
    console.log('sessionToken: ', sessionToken);
    console.log('refreshToken: ', )
    // return sessionToken

    const refreshTokenCookie = req.cookies['refresh_token'];
    
    if (!refreshTokenCookie) {
      // throw new ConflictException({
      //   message: 'Login cached user failed: No refresh token found.',
      // });
      throw new UnauthorizedException('No refresh token found');
    }
      
    const data = await this.authService.loginCachedUser(refreshTokenCookie)

    this.sendLoginCookies(res, data.jwtAccessToken, data.jwtRefreshToken);
  
    return { 
      user: data.user,
      message: 'Session restored'
    };
  };

  private sendLoginCookies(res: Response, jwtAccessToken: string, jwtRefreshToken: string) {   
    const baseOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,         // Use 'as const' for TypeScript literal type safety
      path: '/',                            // Ensure the cookie is cleared from the root path
    };
    res.cookie('jwt', jwtAccessToken, {
      ...baseOptions,
      maxAge: Number(process.env.JWT_ACCESS_TOKEN_EXPIRATION),  // Expiration time, time stored in browser, not validity
    });

    res.cookie('refresh_token', jwtRefreshToken, {
      ...baseOptions,
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION),  // Expiration time
    });
    console.log('sending cookies: ', jwtAccessToken, jwtRefreshToken);
    
  };

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // 1. Clear the JWT and Refresh Token cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,          // Use 'as const' for TypeScript literal type safety
      path: '/',                            // Ensure the cookie is cleared from the root path
    };

    res.clearCookie('jwt', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    // 2. Return a successful, standardized response
    return { 
      message: 'Logged out successfully' 
    };
  }

  @Post('verify-email')
  // @UseGuards(ThrottlerGuard)
  // @Throttle({ default: { limit: 5, ttl: 60000 }}) // 5 attempts per min
  async verifyEmail(
    @Body() dto: CommonTypes.VerifyRegistrationDto 
  ) {
    const user = await this.authService.verifyAccount(dto)
    return { 
      message: 'Account verified successfully!',
      user: user
    }
  }

  @Post('verify-email-new-request')
  // @UseGuards(ThrottlerGuard)
  // @Throttle({ default: { limit: 5, ttl: 60000 }}) // 5 attempts per min
  async verifyEmailNewRequest(
    @Body() dto: CommonTypes.RequestNewVerificationDto 
  ) {
    return await this.authService.verifyEmailNewRequest(dto);
  }

  @Post('request-password-reset')
  // @UseGuards(ThrottlerGuard)
  // @Throttle({ default: { limit: 1, ttl: 60000 }}) // 1 attempts per min
  async requestPasswordReset(
    @Body() dto: CommonTypes.RequestPasswordResetDto 
  ) {
    await this.authService.requestPasswordReset(dto)
    return {
      message: 'Reset password info emailed to user.',
    }
  }

  @Post('reset-password')
  // @UseGuards(ThrottlerGuard)
  // @Throttle({ default: { limit: 1, ttl: 60000 }}) // 1 attempts per min
  async resetPassword(
    @Body() dto: CommonTypes.ResetPasswordDto 
  ) {
    const user = await this.authService.resetPassword(dto)
    return {
      message: 'User password reset successfully.',
      data: user
    }
  }


}
