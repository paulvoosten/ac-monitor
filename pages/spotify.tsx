import type { NextPage } from 'next';
import { useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Player from '../components/spotify/Player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

// TODO: styling
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
  return (
    <>
      <div>
        Signed in as: {session.user?.email}
        <FontAwesomeIcon
          icon={faArrowRightFromBracket}
          onClick={() => signOut()}
          width={25}
        />
      </div>
      <Player token={session.accessToken} />
    </>
  );
};

export default Spotify;
