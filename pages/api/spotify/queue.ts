import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import WebPlaylist from '../../../interfaces/WebPlaylist';
import WebTrack from '../../../interfaces/WebTrack';

const secret: string = process.env.NEXTAUTH_SECRET;
const homoMusicId = ['1128627181'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req, secret });
  if (!token) {
    return res.status(401);
  } else if (!req.query.playlist || typeof req.query.playlist !== 'string') {
    res.status(400).json({ error: 'Invalid `playlist` query parameter.' });
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
  ).catch((error) => {
    console.error(error);
  });
  const playlist: WebPlaylist = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch playlist');
  }
  let tracks = playlist.tracks.items;
  if (playlist.tracks.next) {
    tracks = tracks.concat(await getTracks(token, playlist.tracks.next));
  }
  return {
    image: playlist.images[0].url,
    position: 0,
    tracks: tracks.map(formatTrack),
    uri: playlist.uri,
  };
}

async function getTracks(token: string, url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch((error) => {
    console.error(error);
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch tracks');
  }
  let tracks: WebTrack[] = body.items;
  if (body.next) {
    tracks = tracks.concat(await getTracks(token, body.next));
  }
  return tracks;
}

function formatTrack(track: WebTrack) {
  return {
    album: track.track.album.name,
    artist: track.track.artists?.[0].name,
    duration: track.track.duration_ms,
    image: track.track.album.images[0].url,
    isHomoMusic: homoMusicId.includes(track.added_by.id),
    name: track.track.name,
    state: 'queued',
    uri: track.track.uri,
  };
}
