import * as CommonTypes from '@common-types';
import { Body, Controller, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

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
      
      return await this.authService.loginUser(dto);   
    } catch (error: unknown) {
      this.logger.error(`Error during user login: ${error}`);
      // this.logger.error(`Error during standard registration registerStandardUserDto: ${JSON.stringify(createStandardUserDto)}`);
      // const errorRegisterResponseMessage: AuthResponseMessageDto = {
      //   message: AuthMessages.STANDARD_REGISTRATION_ERROR
      // };
      return error;
    };
  };


}
