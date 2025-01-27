import { Body, Post } from "@nestjs/common";
import { loginDTO, SignupDTO } from "./dto";
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';
import { User } from "@prisma/client";


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signUp')
    async signup(@Body() dto: SignupDTO) {
        return this.authService.signup(dto);
    }

    @Post('logIn')
    async login(@Body() dto: loginDTO) {
        return this.authService.login(dto)
    }

    @Get('google')
    // @UseGuards(GoogleAuthGuard) 
    async googleLogin(@Res() res: Response) {
        const clientId = process.env.GOOGLE_CLIENTID;
        const redirectUri = process.env.GOOGLE_CALLBACK_URL;
        const scope = 'email profile';
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

        return res.redirect(googleAuthUrl);
    }

    @Get('google/callback')
    // @UseGuards(GoogleAuthGuard) 
    async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user as User;
        console.log("MAI USER HOON ", req.user)
        const jwt = this.authService.generateToken(user.id, user.email);

        // Redirect to your frontend with the token and user data
        return res.redirect(`http://your-frontend-app-url?token=${jwt}&user=${JSON.stringify(user)}`);
    }


}