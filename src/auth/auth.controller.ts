import { Body, Post } from "@nestjs/common";
import { loginDTO, SignupDTO } from "./dto";
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard'; 
import { Request, Response } from 'express';


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

    @Get('google')
    @UseGuards(GoogleAuthGuard) 
    async googleLogin() {}

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard) 
    async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user;

    // const jwt = await this.authService.generateToken(user.id, user.email);

    // return res.redirect(`http://your-frontend-app-url?token=${jwt}&user=${JSON.stringify(user)}`);
  }

    
}