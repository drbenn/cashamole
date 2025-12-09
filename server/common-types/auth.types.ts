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
}

export interface RequestNewVerificationDto {
  email: string,
}

export type JwtPayload = {
    sub: string; // Subject (User ID)
    email: string;
};

export interface User {
  id: string,
  email: string,
  created_at: string,
  updated_at: string,
  profiles: any,
  providers: any,
  settings: any
}



