import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from 'src/email/email.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { JwtStrategy } from './jwt-guard/jwt.strategy';
import { AuthQueryService } from './auth-query.service';
import { DatabaseModule } from 'src/database/database.module';
import { PassportModule } from '@nestjs/passport';
import { CategoryModule } from 'src/category/category.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
              // Use non-null assertion (!) here, as the ?? operator makes it non-null anyway
              secret: configService.get<string>('JWT_SECRET')!, 
              signOptions: {}, // Empty options object - expiresIn taken care of in auth service generateAccessJwt() & generateRefreshJwt()
            } as JwtModuleOptions), // <--- ASSERT the entire object as the required type
          }),
    EmailModule,
    DatabaseModule,
    PassportModule,
    CategoryModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthQueryService,
    JwtStrategy
  ],
  exports:[
    PassportModule,
    JwtModule,
    AuthService
  ]
})
export class AuthModule {}
