import { Body, Controller, Post } from "@nestjs/common";
import { SignupDTO } from "./dto";
import { AuthService } from "./auth.service";


@Controller('auth')
export class AuthController{
    constructor(private authService : AuthService){}

    @Post('signUp')
    async signup(@Body() dto : SignupDTO){
        return this.authService.signup(dto);
    }

    
}