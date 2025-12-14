import { ExecutionContext, Injectable, Inject, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// Use a configuration variable for the threshold (5 minutes = 300 seconds)
const REFRESH_THRESHOLD_SECONDS = 5 * 60; 

// We extend the default 'jwt' guard to add our check.
@Injectable()
export class ProactiveRefreshGuard extends AuthGuard('jwt') {
  constructor(
    private authService: AuthService, 
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super(); // Initialize the underlying 'jwt' guard
  }

  // This method runs for every protected route.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 1. Run the standard JWT validation first. 
    // This ensures the token is valid (not expired, not tampered with, and user exists).
    // If this fails (e.g., token expired 10 minutes ago), it will throw a 401.
    const authenticated = await super.canActivate(context) as boolean;
    if (!authenticated) {
        return false;
    }
    
    // 2. The Simple Check (The part you wanted!)
    // We only proceed here if the token is 100% currently valid.
    try {
        const accessToken = request.cookies['jwt']; 
        const refreshToken = request.cookies['refresh_token'];
        
        // Ensure we have both tokens to attempt rotation
        if (!accessToken || !refreshToken) {
          return true; 
        }

        // Get the expiration time (exp) from the token payload
        const decoded = this.jwtService.decode(accessToken) as { exp: number } | null;
        
        if (!decoded || !decoded.exp) {
            return true;
        }

        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        const secondsUntilExpiration = decoded.exp - currentTimeInSeconds;

        // If it's going to expire in 5 minutes (300 seconds) or less...
        if (secondsUntilExpiration <= REFRESH_THRESHOLD_SECONDS) {
            this.logger.log(`Token for user ${request.user.sub} is low, initiating refresh.`, ProactiveRefreshGuard.name);
            
            // 3. Refresh the Goddamn Cookies!
            const newTokens = await this.authService.rotateTokens(refreshToken); 

            // Set the new tokens on the response object
            const isSecure = process.env.NODE_ENV === 'production';
            const cookieOptions = {
                httpOnly: true,
                path: '/',
                secure: isSecure,
                sameSite: isSecure ? 'none' as const : 'lax' as const, 
                // Using 'expires' (Date) to match the service output
            };

            response.cookie('jwt', newTokens.accessToken, { ...cookieOptions, expires: newTokens.accessExpiresAt }); 
            response.cookie('refresh_token', newTokens.refreshToken, { ...cookieOptions, expires: newTokens.refreshExpiresAt });
            
            this.logger.log(`Cookies refreshed successfully.`, ProactiveRefreshGuard.name);
        }

    } catch (e) {
        // If rotation fails (e.g., refresh token is expired/revoked), 
        // we log the error and allow the request to proceed with the old token.
        // The *next* API request will then properly fail the standard JWT check (step 1).
        this.logger.error(`Rotation failed: ${e.message}`, ProactiveRefreshGuard.name);
    }

    // The token was valid, and the rotation check is done. Proceed with the request.
    return true; 
  }
}