import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from 'src/email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthQueryService } from './auth-query.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Load the secret from .env
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    EmailModule,
    DatabaseModule
  ],
  providers: [AuthService, AuthQueryService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
