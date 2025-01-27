import { Injectable } from '@nestjs/common';
import  { Transporter } from 'nodemailer';
import * as nodemailer from "nodemailer"
import { verificationMailDto } from './dto';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASSWORD, 
      },
    });
  }


async sendMail(dto : verificationMailDto): Promise<void> {
    const mailOptions = {
      from: dto.from,
      to : dto.to ,
      subject : dto.subject ,
      text : `This is your OTP: ${dto.otp}. Please verify your email.`
    };

    return this.transporter.sendMail(mailOptions);
  }
}

