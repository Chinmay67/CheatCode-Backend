import { PassportStrategy } from "@nestjs/passport";
import {Strategy, VerifyCallback} from 'passport-google-oauth20';
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy,'google'){
    constructor(
        private readonly prisma: PrismaService, // Declare prisma as a class property
        config: ConfigService
    ){
        super({
            clientID: config.get("GOOGLE_CLIENTID"),
            clientSecret : config.get("GOOGLE_SECRET"),
            callbackURL: config.get("CALLBACK_URL"),
            scope: ["email","profile"],
        })
    }

    async validate( access_token: string, refresh_token: string, profile: any, done: VerifyCallback,): Promise<any>{
        try{
            const {emails, name, id} =profile;
        let user= await this.prisma.user.findUnique({
            where: { email: emails[0].value },
        });

        if(!user){
            const userName = emails[0].value.split('@')[0];
            user=await this.prisma.user.create({
                data: {
                    email: emails[0].value || '',
                    firstName: name.givenName || '',
                    lastName: name.familyName || '',
                    userName,
                    googleID: id,
                }
            })
        }
        done(null,user);
    }catch(error){
        return{
            success:false,
            message:error.message,
        }
    }
    }
}