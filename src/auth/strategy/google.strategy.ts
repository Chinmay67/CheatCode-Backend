import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService, // Inject AuthService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENTID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, name } = profile;

    const email = emails && emails[0]?.value;
    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';

    // Call AuthService to handle user validation or creation
    const user = await this.authService.validateGoogleUser(
      email,
      firstName,
      lastName,
    );

    done(null, user); // Pass the user to the request object
  }
}
