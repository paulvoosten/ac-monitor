import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import Track from '../../../interfaces/Track';

const secret: string = process.env.NEXTAUTH_SECRET;
const homoMusicId = '1128627181';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req, secret });
  if (!token) {
    return res.status(401);
  } else if (!req.query.playlist) {
    res.status(400).json({ error: 'Missing `playlist` query parameter.' });
    return;
  }

  res.json(await getPlaylist(token.accessToken, req.query.playlist));
}

async function getPlaylist(token: string, playlistId: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const playlist = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch playlist tracks');
  }
  let tracks: object[] = playlist.tracks.items;
  if (playlist.tracks.next) {
    tracks = tracks.concat(await getTracks(token, playlist.tracks.next));
  }
  return {
    img: playlist.images[0],
    tracks: tracks.map(formatTrack),
    uri: playlist.uri,
  };
}

async function getTracks(token: string, url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch tracks');
  }
  let tracks: object[] = body.items;
  if (body.next) {
    tracks = tracks.concat(await getTracks(token, body.next));
  }
  return tracks;
}

function formatTrack(track: { added_by: { id: string }; track: Track }) {
  return {
    album: track.track.album.name,
    artist: track.track.artists?.[0].name,
    duration: track.track.duration_ms,
    image: track.track.album.images[0].url,
    isHomoMusic: track.added_by.id === homoMusicId,
    name: track.track.name,
    state: 'queued',
    uri: track.track.uri,
  };
}
