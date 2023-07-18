import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export default async function handler(
  req: NextApiRequest & { query: { playlist: string } },
  res: NextApiResponse,
) {
  const token = await getToken({ req, secret });
  if (!token) return res.status(401);
  try {
    res.json(await getPlaylist(token.accessToken, req.query.playlist));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
}

async function getPlaylist(token: string, playlistId: string) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const playlist: SpotifyApi.PlaylistObjectFull = await response.json();
  if (!response.ok) throw playlist;
  let tracks = playlist.tracks.items;
  if (playlist.tracks.next) {
    tracks = tracks.concat(await getTracks(token, playlist.tracks.next));
  }
  return {
    id: playlist.id,
    image: playlist.images[0].url,
    name: playlist.name,
    position: 0,
    playingTrack: 0,
    tracks: tracks.map(formatTrack),
  };
}

async function getTracks(token: string, url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const body: SpotifyApi.PlaylistTrackResponse = await response.json();
  if (!response.ok) throw body;
  let tracks = body.items;
  if (body.next) {
    tracks = tracks.concat(await getTracks(token, body.next));
  }
  return tracks;
}

function formatTrack(track: SpotifyApi.PlaylistTrackObject) {
  return {
    album: track.track.album.name,
    artist: track.track.artists[0].name,
    duration: track.track.duration_ms,
    image: track.track.album.images[0].url,
    name: track.track.name,
    uri: track.track.uri,
  };
}
