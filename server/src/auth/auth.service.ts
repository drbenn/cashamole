import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthQueryService } from './auth-query.service';
import { CreateUserDto } from '@common-types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    private readonly authQueryService: AuthQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async registerUser(dto: CreateUserDto) {

    const isUserEmailExisting = await this.authQueryService.findUserByEmail(dto.email)
    console.log('isUserEmailExisting: ', isUserEmailExisting);

    if (isUserEmailExisting) {
      this.logger.warn(`Registration Failed: cannot register existing user email: 
        ${JSON.stringify(dto.email)}`);

      throw new ConflictException({
        message: 'Registration Failed',
        email: dto.email,
        provider: dto.provider,
        reason: 'User already registered with this provider type.'
      });
    }
    if (dto.password) dto.password = await this.hashPassword(dto.password)

    return await this.authQueryService.insertUser(dto)
  }

  // hashes standard login password for storage in user_logins table
  private async hashPassword(rawPassword: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);
    return hashedPassword;
  };
}
