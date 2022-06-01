import { JWT } from 'next-auth/jwt';
import NextAuth from 'next-auth/next';
import SpotifyProvider from 'next-auth/providers/spotify';

const SPOTIFY_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function refreshAccessToken(token: JWT) {
  try {
    const url =
      'https://accounts.spotify.com/api/token?' +
      new URLSearchParams({
        client_id: SPOTIFY_ID,
        client_secret: SPOTIFY_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      });
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
    const refreshedToken = await response.json();
    if (!response.ok) throw refreshedToken;
    return {
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpires: Date.now() + refreshedToken.expires_in * 1000 - 30000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export default NextAuth({
  callbacks: {
    async jwt({ account, token, user }) {
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000 - 30000,
          refreshToken: account.refresh_token,
          user,
        };
      }
      if (Date.now() < token.accessTokenExpires) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  providers: [
    SpotifyProvider({
      clientId: SPOTIFY_ID,
      clientSecret: SPOTIFY_SECRET,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
          scope:
            'playlist-read-collaborative streaming user-modify-playback-state user-read-email user-read-private',
        },
      },
    }),
  ],
});
