import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './strategy';
import { MailsModule } from 'src/mails/mails.module';

@Module({
    imports : [PrismaModule , PassportModule  , JwtModule.register({
        secret : process.env.SECRET_KEY ,
        signOptions: { expiresIn: '1h' }, 
    }) , MailsModule] ,
    controllers: [AuthController],
    providers: [AuthService , GoogleStrategy],
})
export class AuthModule {
   
}
