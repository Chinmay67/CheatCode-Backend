import { Injectable } from '@nestjs/common';
import { SignupDTO, loginDTO , OtpDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { MailService } from 'src/mails/mail.service';
import { verificationMailDto } from 'src/mails/dto';
import { verify } from 'crypto';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(dto: SignupDTO) {
    try {
      const hashedPassword = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          userName: dto.username,
          password: hashedPassword,
          firstName: dto.firstname || '',
          lastName: dto.lastname || '',
        },
      });
      const mailResponse = await this.sendVerficiationMail(dto.email);
      if (mailResponse.success===false) {
        return {
          success: false,
          message: 'unable to send mail',
        };
      }
      const otpResponse = await this.storeOtp(mailResponse.otp, dto.email);
      if (!otpResponse.success) {
        return {
          success: false,
          message: 'unable to store otp',
        };
      }
      return {
        success: true,
        message: 'MAIL HAS BEEN SENT SUCCESSFULLY',
      };
    } catch (error) {
      let message = 'An unexpected error occured';

      if (error.code === 'P2002') {
        message = 'This email or username is already taken';
      } else if (error.code === 'P2003') {
        message = 'Invalid reference data.';
      }
      return {
        success: false,
        message,
      };
    }
  }

  async validateUser(dto: loginDTO) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'INVALID CREDENTIALS',
        };
      }

      const isPasswordValid = await argon.verify(user.password, dto.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'INVALID CREDENTIALS',
        };
      }

      delete user.password;

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async login(dto: loginDTO) {
    try {
      const response = await this.validateUser(dto);

      if (response.success == true) {
        const payload = { username: dto.email, password: dto.password };
        return {
          success: true,
          access_token: this.jwtService.sign(payload),
          user: response.user,
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async jwtForGoogle(email: string, googleId: string) {
    try {
      const payload = { email, googleId };
      return {
        success: true,
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
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
      message: 'Google login successful',
      access_token: token,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  generateToken(userId: number, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  async sendVerficiationMail(email: string) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);

      const dto: verificationMailDto = {
        from: process.env.GMAIL_USER,
        to: email,
        otp: otp,
        subject: 'PLEASE VERIFY YOUR EMAIL',
      };

      const response = await this.mailService.sendMail(dto);

      return {
        response: response,
        otp: otp,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async storeOtp(otp: number, email: string) {
    try {
      const response = await this.prisma.otp_verify.upsert({
        where: {
          email: email,
        },
        update: {
          otp: otp,
          createdAt: new Date(),
        },
        create: {
          otp: otp,
          email: email,
          createdAt: new Date(), 
        },
      });
  
  
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  
  async verifyOtp(dto : OtpDto) {
    try {
      const currentOtp = await this.prisma.otp_verify.findFirst({
        where: {
          email: dto.email,
        },
      });


      if (currentOtp) {
        const now = new Date();
        const otpCreationTime = new Date(currentOtp.createdAt);

        

        const timeDifference = now.getTime() - otpCreationTime.getTime();
        if (timeDifference <= 10 * 60 * 10000) {
          if (currentOtp.otp === dto.otp) {
            const user = await this.prisma.user.update({
              where: {
                email: dto.email,
              },
              data: {
                isVerified: true,
              },
            });
            if (!user) {
              return {
                success: false,
                message: 'user not verified',
              };
            }
            return {
              success: true,
              message: 'OTP verified successfully!',
            };
          } else {
            return {
              success: false,
              message: 'Invalid OTP.',
            };
          }
        } else {
          return {
            success: false,
            message: 'OTP has expired.',
          };
        }
      } else {
        return {
          success: false,
          message: 'OTP not sent.',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
