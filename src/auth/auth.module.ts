import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
    imports : [PrismaModule , PassportModule  , JwtModule.register({
        secret : process.env.SECRET_KEY ,
        signOptions: { expiresIn: '1h' }, 
    })] ,
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {
   
}
