import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthQueryService } from './auth-query.service';
import { CreateUserDto, JwtPayload, LoginUserDto, RequestNewVerificationDto, RequestPasswordResetDto, ResetPasswordDto, VerifyRegistrationDto } from '@common-types';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import  type { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly authQueryService: AuthQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private emailService: EmailService,
    private readonly configService: ConfigService,
    private categoryService: CategoryService
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
      const payload: JwtPayload = { sub: userId, email: email, type: 'access' };

      const jwtAccessToken = this.jwtService.sign(payload, { 
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m'   // hardcoded instead of env bc ts errors...and really when would i even change this?
      });
      return jwtAccessToken;
  }

  async generateRefreshJwt(userId: string): Promise<{ token: string, jti: string }> {
      
      // 1. Generate the JTI (Unique ID)
      const jti = uuidv4(); 
      
      const payload = { 
          sub: userId,
          jti: jti,             // The lookup key
          type: 'refresh',
      };
      
      // 2. Sign the Token
      // Set lifespan to 7-30 days. Use a unique refresh secret.
      const jwtRefreshToken = this.jwtService.sign(payload, {
          secret: this.configService.get<string>('JWT_SECRET'), 
          expiresIn: '7d'   // hardcoded instead of env bc ts errors...and really when would i even change this?
      });
      
      // 3. Return the token (to send to client) and the JTI (to store in DB)
      return { token: jwtRefreshToken, jti }; 
  }

  // Utility function to decode the JWT payload and extract the JTI
  private extractJti(refreshToken: string): string {
    try {
      // NOTE: We only decode, not verify the signature yet.
      const [header, payload, signature] = refreshToken.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      
      if (!decodedPayload || !decodedPayload.jti) {
          throw new Error('JTI missing from token payload.');
      }
      return decodedPayload.jti;
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token format.');
    }
  }

  private generateConfirmationCode(): string {
    return (parseInt(randomBytes(3).toString('hex'), 16) % 900000 + 100000).toString();
  }

  async registerUser(dto: CreateUserDto) {    
    const isUserEmailExisting: { email: string} | undefined = await this.authQueryService.checkIsExistingEmail(dto.email)

    if (isUserEmailExisting) {
      this.logger.warn(`Registration Failed: cannot register existing user email: 
        ${JSON.stringify(dto.email)}`);

      throw new ConflictException({
        message: 'Registration Failed: Email has already been submitted for registration process.',
        data: {
          email: dto.email,
          provider: dto.provider
          // reason: 'User already registered with this provider type.'
        }
      });
    }
    if (dto.password) dto.password = await this.hashString(dto.password)

    const accountCreated = await this.authQueryService.insertUser(dto)

    // seed system fallback non-modifiable categories e.g. "Uncategorized" category for transactions, assets and liabilies
    await this.categoryService.seedSystemCategories(accountCreated.id)
    
    await this.sendAccountVerificationEmail(accountCreated.id, accountCreated.email)
    
    delete accountCreated.id

    return accountCreated
  }

  async verifyEmailNewRequest(dto: RequestNewVerificationDto) {
    const user = await this.authQueryService.findUserByEmail(dto.email)    
    
    if (user.providers.email.verified) {
      this.logger.warn(`New Verfication Request Failed: email already verified.
        ${JSON.stringify(dto.email)}`);

      throw new ConflictException({
        message: 'New Verfication Request Failed: email already verified.',
        data: {
          email: dto.email,
        }
      });
    }

    await this.sendAccountVerificationEmail(user.id, user.email)
    
    const created_at = new Date().toISOString()

    return { email: user.email, created_at: created_at }
  }

  async sendAccountVerificationEmail(userId: string, userEmail: string): Promise<any> {
    const confirmationCode: string = this.generateConfirmationCode()
    const expiresAt: Date = new Date(Date.now() + 60 * 60 * 1000) // 60 min
    let verificationUrl: string = `${process.env.FRONTEND_URL}/auth/verify-email?email=${userEmail}&code=${encodeURIComponent(confirmationCode)}&id=`

    try {
      const confirmationId = await this.authQueryService.insertRegisterAccountEmailConfirmation(userId, confirmationCode, expiresAt)
      verificationUrl += confirmationId
    } catch (error: unknown) {
      throw new ConflictException({
        message: 'Account verification failed: Error adding email confirmation record.',
      });
    }
    
    try {
      const smtpEmailResponse =  await this.emailService.sendAccountVerificationEmail(userEmail, confirmationCode, verificationUrl)      
    } catch (error: unknown) {
      this.logger.log(
        'warn',
        `Error sending email in email service to verify account registration catch for sendAccountVerificationEmail(): ${error}`,
      );
      throw new ConflictException({
        message: 'Account verification failed: Error sending email confirmation to user email.',
      });
    }

    return { expiresAt: expiresAt }
  }

  async requestNewVerificationCode(dto: RequestNewVerificationDto): Promise<any> {
    const userId: string = await this.authQueryService.findUserIdByEmail(dto.email)
    await this.sendAccountVerificationEmail(userId, dto.email)
  }

  async verifyAccount(dto: VerifyRegistrationDto, ipAddress: string) {
    const confirmation = await this.authQueryService.findEmailConfirmation(dto)

    if (!confirmation) {
      throw new ConflictException({
        message: 'Account verification failed: Incorrect account verification code submitted.',
      });
    }

    if (confirmation.used_at) {
      throw new ConflictException({
        message: 'Account verification failed: Verification previously completed.',
      });
    }
    
    if (new Date(confirmation.expires_at) < new Date()) {
      throw new ConflictException({
        message: 'Account verification failed: Verification stale. User must verify account registration within 60 minutes of registering account.',
      });
    }

    const userAsSuccessfulResponse = await this.authQueryService.updateEmailConfirmationUsedAndVerifyUser(confirmation.id)

    // generate tokens and build a success response
    const jwtAccessToken = await this.generateAccessJwt(userAsSuccessfulResponse.id, userAsSuccessfulResponse.email);
    const { token: jwtRefreshToken, jti } = await this.generateRefreshJwt(userAsSuccessfulResponse.id);

    // Hash and persist the Refresh Token in the database.
    const hashedRefreshToken: string = await this.hashString(jwtRefreshToken);
    const msInFuture: number = process.env.JWT_REFRESH_TOKEN_EXPIRATION ? Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION) : (7 * 24 * 60 * 60 * 1000)  // 7 days fallback
    const expirationDate: Date = new Date(Date.now() + msInFuture); 

    await this.authQueryService.insertRefreshTokenHash(
      hashedRefreshToken, 
      userAsSuccessfulResponse.id, 
      expirationDate,
      jti
    );

    // remove providers email hashed password from response
    delete userAsSuccessfulResponse.providers.email.password

    // log successful login
    await this.authQueryService.insertUserLoginHistory(userAsSuccessfulResponse.id, ipAddress,'web')

    return {
      user: userAsSuccessfulResponse,
      jwtAccessToken: jwtAccessToken,
      jwtRefreshToken: jwtRefreshToken
    }
  }




  /**
   * Authenticates a standard user (email/password).
   * Throws exceptions for failure cases.
   */
  async loginUser(dto: LoginUserDto, ipAddress: string): Promise<any> {
    // 1. Find the user login record.
    const user: any = await this.authQueryService.findUserByEmail(dto.email)
    
    if (!user) {
      // Case 1: User is not registered via the standard method (404 Not Found)
      throw new ConflictException({
        message: `User with email '${dto.email}' not found.`,
      })
    }

    if (!user.providers.email.verified) {
      // Case 2: User is not previously verified from initial registration through email confirmation
      throw new ConflictException({
        message: `User with email '${dto.email}' has not verified email address.`,
        data: { email: dto.email }
      })
    }

    // 3. Compare the password.
    const isMatch: boolean = await this.compareHashedString(dto.password, user.providers.email.password);
    
    if (!isMatch) {
      // Case 3: Password mismatch (401 Unauthorized)
      throw new ConflictException({
        message: 'Invalid credentials. Password mismatch.',
      })
    }
    
    // --- SUCCESS PATH ---
    // 4. If successful, generate tokens and build a success response
    const jwtAccessToken = await this.generateAccessJwt(user.id, user.email);
    const { token: jwtRefreshToken, jti } = await this.generateRefreshJwt(user.id);

    // 5. Hash and persist the Refresh Token in the database.
    const hashedRefreshToken: string = await this.hashString(jwtRefreshToken);
    const msInFuture: number = process.env.JWT_REFRESH_TOKEN_EXPIRATION ? Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION) : (7 * 24 * 60 * 60 * 1000)  // 7 days fallback
    const expirationDate: Date = new Date(Date.now() + msInFuture); 

    await this.authQueryService.insertRefreshTokenHash(
      hashedRefreshToken, 
      user.id, 
      expirationDate,
      jti
    );

    // 6. remove providers email hashed password from response
    delete user.providers.email.password

    // 7. log successful login
    await this.authQueryService.insertUserLoginHistory(user.id, ipAddress,'web')

    return {
      message: 'Login Success',
      user: user,
      jwtAccessToken: jwtAccessToken,
      jwtRefreshToken: jwtRefreshToken,
    }
  }

  // async loginCachedUser(refresh_token: string, ipAddress: string): Promise<any> {
    
  //   const jti = this.extractJti(refresh_token);

  //   // 1. LOOKUP BY JTI
  //   const record = await this.authQueryService.getRefreshTokenRecord(jti);
    
  //   // Handle Case A: Record not found (token was revoked or never existed)
  //   if (!record) {
  //     throw new ConflictException({
  //       message: 'Login cached user failed: Invalid refresh token ID or revoked.',
  //     });
  //   }

  //   // Handle Case B: Record found, but expired (Check 1)
  //   if (new Date() > new Date(record.expires_at)) {
  //     throw new ConflictException({
  //       message: 'Login cached user failed: Expired refresh token.',
  //     });
  //   }

  //   // 2. VERIFY HASH (The Security Check)
  //   const isMatch: boolean = await this.compareHashedString(refresh_token, record.token_hash);
    
  //   // Handle Case C: Token found and not expired, BUT hash does not match (Tampering)
  //   if (!isMatch) {
  //     // NOTE: You may want to log or report this as a high-security risk (attempted tampering)
  //     throw new ConflictException({
  //       message: 'Login cached user failed: Token verification failed (tampered).',
  //     });
  //   }
    
  //   // --- SUCCESS PATH (Rotation) ---
  //   const user = await this.authQueryService.findUserById(record.user_id)

  //   const jwtAccessToken = await this.generateAccessJwt(user.id, user.email);
  //   const { token: newJwtRefreshToken, jti: newJti } = await this.generateRefreshJwt(record.user_id);
  //   const newHashedRefreshToken: string = await this.hashString(newJwtRefreshToken)

  //   await this.authQueryService.rotateRefreshToken(
  //     user.id,
  //     newJti,
  //     newHashedRefreshToken
  //   )

  //   // log successful login
  //   await this.authQueryService.insertUserLoginHistory(user.id, ipAddress,'web')

  //   delete user.providers.email.password

  //   return {
  //     message: 'Cached Login Success',
  //     user: user,
  //     jwtAccessToken: jwtAccessToken,
  //     jwtRefreshToken: newJwtRefreshToken
  //   }
  // }

  async loginCachedUser(refresh_token: string, ipAddress: string): Promise<any> {
    
    let newTokens;
    let user;

    try {
      // --- 1. Centralized Token Rotation ---
      // This single call handles all validation, generation, and DB rotation.
      newTokens = await this.rotateTokens(refresh_token);
      
      // Extract user data from the newly verified access token for the response
      const payload = this.jwtService.decode(newTokens.accessToken) as { sub: string };
      user = await this.authQueryService.findUserById(payload.sub);

    } catch (e) {
      // Catch any errors thrown by rotateTokens (e.g., Expired, Invalid Hash, Revoked)
      // And throw the appropriate exception for the controller to handle.
      if (e.message.includes('Invalid refresh token ID')) {
            throw new ConflictException({ message: 'Login failed: Invalid or revoked refresh token.' });
      }
      if (e.message.includes('Expired refresh token')) {
          throw new ConflictException({ message: 'Login failed: Expired refresh token.' });
      }
      if (e.message.includes('Token verification failed')) {
          throw new ConflictException({ message: 'Login failed: Token verification failed (tampered).' });
      }
      // Fallback for other errors
      throw new InternalServerErrorException('Login failed due to unexpected error.');
    }

    // --- SUCCESS PATH ---
    
    // log successful login
    await this.authQueryService.insertUserLoginHistory(user.id, ipAddress,'web');

    // Clean up the user object before returning
    delete user.providers.email.password;

    return {
      message: 'Cached Login Success',
      user: user,
      jwtAccessToken: newTokens.accessToken,
      jwtRefreshToken: newTokens.refreshToken
    };
  }



  /**
   * Validates the old refresh token (via JTI lookup and hash check)
   * and issues a completely new access and refresh token pair, replacing the old record in the DB.
   * Used by ProactiveGuard and loginCachedUser.
   * @param oldRefreshToken The refresh token string from the cookie.
   * @returns A new pair of tokens and their calculated cookie expiration times.
   */
  async rotateTokens(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }> {
    const oldJti = this.extractJti(oldRefreshToken); // Assumes you have this utility method

    // --- 1. VALIDATION (Based on your loginCachedUser logic) ---
    const record = await this.authQueryService.getRefreshTokenRecord(oldJti);

    if (!record) {
      throw new Error('Invalid refresh token ID or revoked.'); 
    }

    if (new Date() > new Date(record.expires_at)) {
      throw new Error('Expired refresh token.');
    }
    
    // Check if the token string matches the stored hash
    const isMatch: boolean = await this.compareHashedString(oldRefreshToken, record.token_hash);
    
    if (!isMatch) {
      // HIGH SECURITY RISK: Revoke session on mismatch
      throw new Error('Token verification failed (tampered).');
    }
    
    // --- 2. GENERATION (Uses hardcoded durations from other AuthService methods) ---
    const user = await this.authQueryService.findUserById(record.user_id)

    const newAccessToken = await this.generateAccessJwt(user.id, user.email);
    const { token: newJwtRefreshToken, jti: newJti } = await this.generateRefreshJwt(record.user_id);
    const newHashedRefreshToken: string = await this.hashString(newJwtRefreshToken)

    // --- 3. ROTATION (Calculate Expiration and Call Updated Query) ---

    // Constants based on your hardcoded choice
    const ACCESS_DURATION_STRING = '15m'; 
    const REFRESH_DURATION_STRING = '7d'; 

    // Calculate the exact expiration date for the database and cookies
    const REFRESH_DURATION_MS = this.durationToMilliseconds(REFRESH_DURATION_STRING);
    const newRefreshExpiresAt = new Date(Date.now() + REFRESH_DURATION_MS); 

    // Call the UPDATED query service method (must accept the expiresAt Date now)
    await this.authQueryService.rotateRefreshToken(
      user.id,
      newJti,
      newHashedRefreshToken,
      newRefreshExpiresAt // <--- The calculated Date is passed here
    );

    // --- 4. RETURN METADATA ---
    
    // Calculate access token expiration for cookie setting
    const ACCESS_DURATION_MS = this.durationToMilliseconds(ACCESS_DURATION_STRING);

    return {
      accessToken: newAccessToken,
      refreshToken: newJwtRefreshToken,
      accessExpiresAt: new Date(Date.now() + ACCESS_DURATION_MS),
      refreshExpiresAt: newRefreshExpiresAt, 
    };
  }

  /**
   * Converts a duration string (e.g., '15m', '7d') into milliseconds.
   * This is crucial for setting the maxAge/expires option for cookies and DB persistence.
   * @param durationString The duration string (e.g., '15m', '7d').
   * @returns The duration in milliseconds.
   */
  private durationToMilliseconds(durationString: string): number {
    const unit = durationString.slice(-1).toLowerCase(); // e.g., 'm', 'h', 'd'
    const value = parseInt(durationString.slice(0, -1), 10);

    if (isNaN(value)) {
      // Default to 15 minutes if parsing fails
      return 900000; 
    }

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value * 1000; // Assume seconds if no unit provided
    }
  }


  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<any> {
    const user = await this.authQueryService.findUserByEmail(dto.email)

    if (!user.providers.email.verified) {
      this.logger.warn(`Password Reset Request Failed: account email not verified.
        ${JSON.stringify(dto.email)}`);

      throw new ConflictException({
        message: 'Password Reset Request Failed: account email not verified.',
        data: {
          email: dto.email,
        }
      });
    }
    const confirmationCode: string = this.generateConfirmationCode()
    const expiresAt: Date = new Date(Date.now() + 60 * 60 * 1000) // 60 min
    const confirmation = await this.authQueryService.insertPasswordResetEmailConfirmations(user.id, dto.email, confirmationCode, expiresAt)
    const resetUrl: string = `${process.env.FRONTEND_URL}/auth/reset-password?email=${user.email}&code=${encodeURIComponent(confirmationCode)}&id=${confirmation.id}`

    try {
      const smtpEmailResponse =  await this.emailService.sendResetPasswordLinkEmail(user.email, resetUrl)
      return {
        data: { email: dto.email, created_at: new Date().toISOString(), smtpEmailResponse: smtpEmailResponse }
      }
    } catch (error: unknown) {
      this.logger.log(
        'warn',
        `Error sending email in email service for requestPasswordReset(): ${error}`,
      );
      throw new ConflictException({
        message: 'Password reset request failed: Error sending password reset request email to user email.',
      })
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const confirmation = await this.authQueryService.findPasswordResetConfirmation(dto)

    if (!confirmation) {
      throw new ConflictException({
        message: 'Reset password failed: Incorrect code submitted.',
      })
    }

    if (confirmation.used_at) {
      throw new ConflictException({
        message: 'Account password failed: Reset confirmation previously completed. Request new password reset.',
      })
    }
    
    if (new Date(confirmation.expires_at) < new Date()) {
      throw new ConflictException({
        message: 'Password reset failed: Verification stale. User must reset password within 60 minutes of requesting password reset.',
      })
    }

    // hash new password for storage
    if (dto.password) dto.password = await this.hashString(dto.password)

    const userAsSuccessfulResponse = await this.authQueryService.updatePassword(dto, confirmation.user_id)
    return userAsSuccessfulResponse
  }
  
  getClientIp(req: Request): string {
    const forwardedIp = req.headers['x-forwarded-for'];
    
    if (forwardedIp) {
      // If it's a list, the client's IP is the first one.
      // Ensure you handle forwardedIp being a string or string[] if using TypeScript strict mode.
      const ipList = Array.isArray(forwardedIp) ? forwardedIp[0] : forwardedIp.split(',')[0];
      return ipList.trim();
    }
    
    // Fallback for local development or direct connections
    return req.ip || 'unknown'; 
  }


}
