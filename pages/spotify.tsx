import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { getSession, signIn, useSession } from 'next-auth/react';
import { SDKProvider } from '../components/spotify/providers/SDK';
import Playlist from '../components/spotify/Playlist';
import Menu from '../components/spotify/Menu';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '../helpers/swr';
import { PlaylistProvider } from '../components/spotify/providers/Playlist';

export const INITIAL_VOLUME = 50;

const Spotify: NextPage = () => {
  const [playlistId, setPlaylistId] = useState('6cdEgnaFIU4dIPGeB4bM5v');
  const { data: session } = useSession();
  const getOAuthToken: Spotify.PlayerInit['getOAuthToken'] = async (
    callback
  ) => {
    const session = await getSession();
    if (!session) {
      throw new Error('Session not available');
    }
    callback(session.accessToken);
  };
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signIn('spotify');
    }
  }, [session]);
  if (!session) {
    return (
      <>
        <h1>Not signed in yet</h1>
        <button onClick={() => signIn('spotify')}>Sign in</button>
      </>
    );
  }
  return (
    <SWRConfig value={{ provider: localStorageProvider('spotify') }}>
      <SDKProvider
        getOAuthToken={getOAuthToken}
        name="AdCalls Dev-hok"
        volume={INITIAL_VOLUME / 100}
      >
        <PlaylistProvider id={playlistId}>
          <Menu setPlaylistId={setPlaylistId} />
          <Playlist />
        </PlaylistProvider>
      </SDKProvider>
    </SWRConfig>
  );
};

export default Spotify;
