export interface CreateUserDto {
  email: string,
  provider: 'email',
  password?: string
}

export interface LoginUserDto {
  email: string,
  password: string,
}


export type JwtPayload = {
    sub: string; // Subject (User ID)
    email: string;
};

export interface UserProfile {

}



