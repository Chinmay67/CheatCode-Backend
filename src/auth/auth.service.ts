import { Injectable } from "@nestjs/common";
import { SignupDTO } from "./dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from "argon2"

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService) { }

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

            delete user.password

            return {
                success : true , 
                user
            }
        } catch (error) {
            let message = "An unexpected error occured";

            if(error.code === "P2002"){
                message = "This email or username is already taken"
            }
            else if (error.code === "P2003") {
                message = "Invalid reference data.";
            }
            return {
                success : false , 
                message 
            }
        }
    }
}