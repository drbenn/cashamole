import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthQueryService } from './auth-query.service';
import { CreateUserDto } from '@common-types';

@Injectable()
export class AuthService {

  constructor(
    private readonly authQueryService: AuthQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async registerUser(dto: CreateUserDto) {
    return await this.authQueryService.insertUser(dto)
  }
}
