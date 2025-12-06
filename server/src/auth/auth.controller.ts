import * as CommonTypes from '@common-types';
import { Body, Controller, Inject, InternalServerErrorException, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import  type { Response } from 'express';
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
    try {
      return await this.authService.registerUser(dto);   
    } catch (error: unknown) {
      this.logger.error(`Error during user registration: ${error}`);
      // this.logger.error(`Error during standard registration registerStandardUserDto: ${JSON.stringify(createStandardUserDto)}`);
      // const errorRegisterResponseMessage: AuthResponseMessageDto = {
      //   message: AuthMessages.STANDARD_REGISTRATION_ERROR
      // };
      return error;
    };
  };

  @Post('login')
  async login(
    @Body() dto: CommonTypes.LoginUserDto,
    @Req() req: Request,                          // req for capturing and logging ip
    @Res({ passthrough: true }) res: Response,    // Enables passing response
  ): Promise<any> {
    try {
      console.log('login dto: ', dto);
      const login = await this.authService.loginUser(dto); 
      this.sendLoginCookies(res, login.jwtAccessToken, login.jwtRefreshToken);
      return login
    } catch (error: unknown) {
      this.logger.error(`Error during user login: ${error}`);
      // this.logger.error(`Error during standard registration registerStandardUserDto: ${JSON.stringify(createStandardUserDto)}`);
      // const errorRegisterResponseMessage: AuthResponseMessageDto = {
      //   message: AuthMessages.STANDARD_REGISTRATION_ERROR
      // };
      return error;
    };
  };

  private sendLoginCookies(res: Response, jwtAccessToken: string, jwtRefreshToken: string) {
    const baseOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,          // Use 'as const' for TypeScript literal type safety
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
  };

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    try {
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
        statusCode: 200, 
        message: 'Logged out successfully' 
      };

    } catch (error) {
      this.logger.error(`Error during user logout: ${error}`);
      
      // 3. For an API endpoint, return an error status (e.g., 500) 
      //    instead of redirecting. The frontend handles the redirect.
      throw new InternalServerErrorException('Failed to log out due to a server error.');
    }
  }

  @Post('verify-email')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 }}) // 5 attempts per min
  async verifyEmail(
    @Body() dto: CommonTypes.VerifyRegistrationDto 
  ) {
    await this.authService.verifyAccount(dto)
  }



}
