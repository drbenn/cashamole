import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthQueryService } from './auth-query.service';
import { CreateUserDto, JwtPayload, LoginUserDto, RequestNewVerificationDto, RequestPasswordResetDto, ResetPasswordDto, VerifyRegistrationDto } from '@common-types';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly authQueryService: AuthQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private emailService: EmailService
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

  async verifyAccount(dto: VerifyRegistrationDto) {
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
    return userAsSuccessfulResponse
  }




  /**
   * Authenticates a standard user (email/password).
   * Throws exceptions for failure cases.
   */
  async loginUser(dto: LoginUserDto): Promise<any> {
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
      success: true,
      user: user,
      jwtAccessToken: jwtAccessToken,
      jwtRefreshToken: jwtRefreshToken,
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


}
