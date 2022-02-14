import NextAuth, {
  DefaultAccount,
  DefaultSession,
  DefaultUser,
} from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Account extends DefaultAccount {
    expires_in: number;
  }

  interface Session extends DefaultSession {
    accessToken: string;
    error?: string;
    expires: string;
  }

  interface User extends DefaultUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    accessTokenExpires: number;
    error?: string;
    refreshToken: string;
    user: User;
  }
}
