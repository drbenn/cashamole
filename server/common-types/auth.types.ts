export interface CreateUserDto {
  email: string,
  provider: 'email',
  password?: string
}

export interface LoginUserDto {
  email: string,
  password: string,
}

export interface VerifyRegistrationDto {
  code: string,
  id: string
}

export interface RequestNewVerificationDto {
  email: string,
}

export interface RequestPasswordResetDto {
  email: string,
}

export interface ResetPasswordDto {
  code: string,
  email: string,
  password: string,
  id: string
}

export type JwtPayload = {
    sub: string; // Subject (User ID)
    email: string;
    jti?: string  // JWT id(unique lookup key)
    type?: string
};

export interface UserJwtGuardPayload {
  userId: string; 
}

export interface User {
  id: string,
  email: string,
  created_at: string,
  updated_at: string,
  profiles: any,
  providers: any,
  settings: any
}



