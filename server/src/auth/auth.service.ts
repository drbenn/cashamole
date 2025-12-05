import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthQueryService } from './auth-query.service';
import { CreateUserDto, JwtPayload, LoginUserDto } from '@common-types';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly authQueryService: AuthQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}


  private async hashString(string: string): Promise<string> {
    const saltRounds = 10;
    const hashedString = await bcrypt.hash(string, saltRounds);
    return hashedString;
  };

  private async compareHashedString(plainString: string, storedHashedString: string): Promise<boolean> {
    return await bcrypt.compare(plainString, storedHashedString);
  };

  async generateAccessJwt(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email: email};
    const jwtAccessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return jwtAccessToken;
  };

  async generateRefreshJwt(): Promise<string> {
    const jwtToken = randomBytes(64).toString('hex'); // Generate a random token
    const saltRounds = 10;
    const hashedJwtRefreshToken = await bcrypt.hash(jwtToken, saltRounds);
    return hashedJwtRefreshToken;
  };

  async registerUser(dto: CreateUserDto) {

    const isUserEmailExisting: { email: string} | undefined = await this.authQueryService.checkIsExistingEmail(dto.email)
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
    if (dto.password) dto.password = await this.hashString(dto.password)

    return await this.authQueryService.insertUser(dto)
  }


  /**
   * Authenticates a standard user (email/password).
   * Throws exceptions for failure cases.
   */
  async loginUser(dto: LoginUserDto): Promise<any> {
    // 1. Find the user login record.
    const user: any = await this.authQueryService.findUserByEmail(dto.email)
    console.log('USER: ',user);
    
    if (!user) {
      // Case 1: User is not registered via the standard method (404 Not Found)
      throw new NotFoundException(`User with email '${dto.email}' not found or not registered.`);
    }

    // 3. Compare the password.
    const isMatch: boolean = await this.compareHashedString(dto.password, user.providers.email.password);
    console.log('isMatch: ', isMatch);
    
    
    if (!isMatch) {
      // Case 3: Password mismatch (401 Unauthorized)
      throw new UnauthorizedException('Invalid credentials. Password mismatch.');
    }
    
    // --- SUCCESS PATH ---
    // 4. If successful, generate tokens and build a success response
    const jwtAccessToken = await this.generateAccessJwt(user.id, user.email);
    const jwtRefreshToken = await this.generateRefreshJwt();
    
    // 5. Hash and persist the Refresh Token in the database.
    const hashedRefreshToken: string = await this.hashString(jwtRefreshToken);
    const msInFuture: number = process.env.JWT_REFRESH_TOKEN_EXPIRATION ? Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION) : (7 * 24 * 60 * 60 * 1000)  // 7 days fallback
    const expirationDate: Date = new Date(Date.now() + msInFuture); 
    
    await this.authQueryService.insertRefreshTokenHash(
      hashedRefreshToken, 
      user.id, 
      expirationDate
    );

    // 6. remove providers email hashed password from response
    delete user.providers.email.password

    return {
      message: 'Login Success',
      user: user,
      jwtAccessToken: jwtAccessToken,
      jwtRefreshToken: jwtRefreshToken,
    }
  }
}
