import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class OtpDto{
    @IsNumber()
    @IsNotEmpty()
    otp : number

    @IsString()
    @IsNotEmpty()
    email : string
}