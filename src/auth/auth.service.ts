import { Injectable } from "@nestjs/common";
import { SignupDTO, loginDTO } from "./dto";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtService } from '@nestjs/jwt';
import * as argon from "argon2"

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async signup(dto: SignupDTO) {
        try {
            const hashedPassword = await argon.hash(dto.password);

            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    userName: dto.username,
                    password: hashedPassword,
                    firstName: dto.firstname || "",
                    lastName: dto.lastname || "",
                }
            })

            const loggedInUser = {
                email: dto.email,
                password: dto.password
            }

            const response = await this.login(loggedInUser);

            if (response.success == true) {
                const payload = { username: dto.email, password: dto.password }
                return {
                    success: true,
                    access_token: this.jwtService.sign(payload),
                    user: response.user
                }
            }

            return response;
        } catch (error) {
            let message = "An unexpected error occured";

            if (error.code === "P2002") {
                message = "This email or username is already taken"
            }
            else if (error.code === "P2003") {
                message = "Invalid reference data.";
            }
            return {
                success: false,
                message
            }
        }
    }

    async validateUser(dto: loginDTO) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email: dto.email
                }
            })

            if (!user) {
                return {
                    success: false,
                    message: "INVALID CREDENTIALS"
                }
            }

            const isPasswordValid = await argon.verify(user.password, dto.password);

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: "INVALID CREDENTIALS"
                }
            }

            delete user.password

            return {
                success: true,
                user
            }

        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async login(dto: loginDTO) {
        try {
            const response = await this.validateUser(dto);

            if (response.success == true) {
                const payload = { username: dto.email, password: dto.password }
                return {
                    success: true,
                    access_token: this.jwtService.sign(payload),
                    user: response.user
                }
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async jwtForGoogle(email: string, googleId: string){
        try{
        const payload= { email, googleId}
        return{
            success: true,
            access_token: this.jwtService.sign(payload)
        }}
        catch(error){
            return{
                success:false,
                message:error.message
            }
        }
    }

    async validateGoogleUser(email: string, firstName: string, lastName: string) {
        let user = await this.prisma.user.findUnique({ where: { email } });
    
        if (!user) {
            const userName = email.split('@')[0];
            user = await this.prisma.user.create({
                data: {
                    userName,
                    email,
                    firstName,
                    lastName,
                },
            });
        }
    
        const token = this.generateToken(user.id, user.email);
    
        return {
            success: true,
            message: "Google login successful",
            access_token: token,
            user: { email: user.email, firstName: user.firstName, lastName: user.lastName },
        };
    }
    
    generateToken(userId: number, email: string): string {
        const payload = { sub: userId, email }; 
        return this.jwtService.sign(payload);
    }
    
    }


