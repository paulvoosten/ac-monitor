import type { NextPage } from 'next';
import {useEffect} from 'react';
import { signIn, useSession } from 'next-auth/react';
import Player from '../components/spotify/Player';

const Spotify: NextPage = () => {
  const { data: session } = useSession();
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
  return <Player session={session} />;
};

export default Spotify;
