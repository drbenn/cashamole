import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
// import { AuthService } from '../auth.service'; // Keep this commented out if not doing database lookup
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    // Inject AuthService only if you plan to uncomment the database lookup later
  ) {
    super({
      // 1. EXTRACTOR: Define multiple extraction methods
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Attempt 1: Extract from the 'jwt' cookie
        (request: Request) => {
          // Log the entire cookies object before attempting to extract 'jwt'
          this.logger.error(`Attempting to read cookies. Contents: ${JSON.stringify(request?.cookies)}`, JwtStrategy.name);

          const token = request?.cookies?.jwt;
          console.log(token);
          
          if (!token) {
            console.log('no token? but token is above!!');
            
            // Keep the throw, but the log line above will tell you what the server saw.
            throw new UnauthorizedException('JWT not found in cookies'); 
          }

          if (token) {
            console.log('there is a token');
            
            this.logger.log('Token found in cookie "jwt"', JwtStrategy.name);
            console.log('does JwtStrat name fail??');
            
            return token;
          }
          console.log('rand 1');
          
          // Note: Do NOT throw here, return null to allow fallback to other extractors
          return null; 
        },
        // Attempt 2: Extract from Authorization header (Bearer Token)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'jwt-secret-missing',
    });
  }

  /**
   * Validates the payload structure and returns the verified user identity.
   * This structure will be attached to req.user.
   */
  async validate(payload: any): Promise<any> {
    console.log('in validate');
    
    // 1. Log the payload for verification (Crucial step for debugging)
    this.logger.log(`JWT Validation Payload: ${JSON.stringify(payload)}`, JwtStrategy.name);

    // 2. Identify the user ID key in the payload (often 'sub', 'id', or 'userId')
    const userId = payload.sub || payload.id || payload.userId; 

    if (!userId) {
      this.logger.error('JWT payload is missing a recognizable user ID field.', JwtStrategy.name);
      throw new UnauthorizedException('Invalid token payload: Missing user ID.');
    }

    console.log('{ userId: userId }: ', { userId: userId });
    
    // 3. RETURN the verified identity in a consistent structure.
    // This object will become req.user in the controller.
    // We use 'userId' as the key to be consistent with the controller check.
    return { userId: userId }; 
    
    // If you were doing a database lookup:
    /*
    const user = await this.authService.findOneUserProfileById(userId);
    if (!user) {
        throw new UnauthorizedException('User specified in token not found.');
    }
    return user; // Return the full user object
    */
  }
}