import { Body, Controller, Post } from "@nestjs/common";
import { loginDTO, SignupDTO } from "./dto";
import { AuthService } from "./auth.service";


@Controller('auth')
export class AuthController{
    constructor(private authService : AuthService){}

    @Post('signUp')
    async signup(@Body() dto : SignupDTO){
        return this.authService.signup(dto);
    }

    @Post('logIn')
    async login(@Body() dto : loginDTO){
        return this.authService.login(dto)
    }

    

    
}