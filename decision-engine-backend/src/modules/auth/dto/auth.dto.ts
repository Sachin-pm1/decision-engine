import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
