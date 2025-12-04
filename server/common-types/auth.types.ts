export interface CreateUserDto {
  email: string,
  provider: 'email',
  password?: string
}

export interface LoginUserDto {
  email: string,
  password: string,
}

export interface UserProfile {

}



