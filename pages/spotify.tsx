import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { SDKProvider } from '../components/spotify/providers/SDK';
import Playlist from '../components/spotify/Playlist';
import Menu from '../components/spotify/Menu';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '../helpers/swr';
import { PlaylistProvider } from '../components/spotify/providers/Playlist';

export const INITIAL_VOLUME = 50;

const Spotify: NextPage = () => {
  const [playlistId, setPlaylistId] = useState('6cdEgnaFIU4dIPGeB4bM5v');
  const { data: session, status } = useSession<true>({
    required: true,
    onUnauthenticated: () => signIn('spotify'),
  });
  const getOAuthToken: Spotify.PlayerInit['getOAuthToken'] = useCallback(
    callback => {
      if (session) callback(session.accessToken);
    },
    [session],
  );
  useEffect(() => {
    if (!session) return;
    if (session.error === 'RefreshAccessTokenError') {
      signIn('spotify');
      return;
    }
    const id = window.setTimeout(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    }, session.accessTokenExpiresAt - Date.now());
    return () => window.clearTimeout(id);
  }, [session]);
  if (status === 'loading') {
    return <>Loading or unauthenticated</>;
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
