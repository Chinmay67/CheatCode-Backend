import { Body, Controller } from "@nestjs/common";
import { SignupDTO } from "./dto";
import { AuthService } from "./auth.service";


@Controller('auth')
export class AuthController{
    constructor(private authService : AuthService){}

    async signup(@Body() dto : SignupDTO){
        return this.authService.signup(dto);
    }

    
}