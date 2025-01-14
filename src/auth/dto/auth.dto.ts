import { IsEmail, IsNotEmpty, IsOptional, isString, IsString, MinLength } from 'class-validator';

export class SignupDTO {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6) // Ensures a minimum password length of 6 characters
  password: string;

  @IsOptional() // Makes the field optional
  @IsString()
  firstname?: string;

  @IsOptional() // Makes the field optional
  @IsString()
  lastname?: string;
}


export class loginDTO{
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    @IsString()
    password:string


}