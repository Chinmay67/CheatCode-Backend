import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class verificationMailDto  {

    constructor(num : number , recipient : string){
        this.otp = num
        this.to = recipient
    }

    from : string; 

    @IsNotEmpty()
    @IsString()
    to : string

    subject : string;

    @IsNumber()
    @IsNotEmpty()
    otp : number

}