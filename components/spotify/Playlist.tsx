import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/Spotify.module.css';
import Track from './Track';
import Playlist from '../../interfaces/Playlist';
import { usePlayer } from './providers/Player';
import { usePlaybackState } from './providers/PlaybackState';
import { useDevice } from './providers/Device';
import { usePlaylist } from './providers/Playlist';
import { getRandomNumber } from '../../helpers/number';
import { useSession } from 'next-auth/react';

const Playlist = () => {
  const homoMusicRef = useRef<NodeJS.Timeout>();
  const device = useDevice();
  const player = usePlayer();
  const playbackState = usePlaybackState(100);
  const [playHomoMusic, setPlayHomoMusic] = useState(false);
  const { data: playlist, error, mutate: mutatePlaylist } = usePlaylist();
  const { data: session } = useSession();
  useEffect(() => {
    if (!playbackState) {
      return;
    }
    let currentUri =
      playbackState.track_window.current_track.linked_from.uri ??
      playbackState.track_window.current_track.uri;
    mutatePlaylist(async (playlist) => {
      if (!playlist) {
        return playlist;
      }
      const currentIndex = playlist.tracks.findIndex(
        (track) => track.uri === currentUri
      );
      if (currentIndex === -1) {
        return playlist;
      }
      return {
        ...playlist,
        position: playbackState.position,
        tracks: playlist.tracks.map((track, index) => {
          if (index === currentIndex) {
            if (track.state !== 'playing') {
              if (homoMusicRef.current) {
                clearTimeout(homoMusicRef.current);
              }
              if (track.isHomoMusic) {
                homoMusicRef.current = setTimeout(() => {
                  setPlayHomoMusic(true);
                  homoMusicRef.current = undefined;
                }, getRandomNumber(Math.min(30000, track.duration * 0.25), Math.min(90000, track.duration * 0.5)));
              }
            }
            track.state = 'playing';
          } else if (index < currentIndex) {
            track.state = 'played';
          } else {
            track.state = 'queued';
          }
          return track;
        }),
      };
    }, false);
  }, [mutatePlaylist, playbackState]);
  if (error) {
    console.error('>>> Failed to load playlist <<<', error);
    return <>Failed to load playlist</>;
  } else if (!session) {
    return <>Loading session...</>;
  } else if (!player || !device) {
    return <>Initialising player...</>;
  } else if (!playlist) {
    return <>Loading playlist...</>;
  }
  const queue = playlist.tracks.filter((track) => track.state !== 'played');
  let position = playlist.position;
  if (playbackState && playbackState.position !== 0) {
    position = playbackState.position;
  }
  return (
    <>
      {playHomoMusic && (
        <audio autoPlay onEnded={() => setPlayHomoMusic(false)}>
          <source src="/static/audio/Homo muziek.wav" type="audio/wav" />
        </audio>
      )}
      <div className={styles.player}>
        <div className={styles.tracks}>
          {queue.map((track, index) => {
            const isCurrent = index === 0;
            const currentIndex = index + playlist.tracks.length - queue.length;
            return (
              <Track
                key={track.uri}
                isCurrent={isCurrent}
                paused={playbackState?.paused ?? true}
                position={position}
                setPosition={(position) => {
                  fetch(
                    `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
                    {
                      method: 'PUT',
                      body: JSON.stringify({
                        offset: { position: currentIndex },
                        position_ms: position,
                        uris: playlist.tracks.map((track) => track.uri),
                      }),
                      headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                      },
                    }
                  ).catch((error) => {
                    console.error(
                      '>>> Failed to set track position <<<',
                      error
                    );
                  });
                }}
                togglePlay={
                  isCurrent
                    ? () => {
                        if (playbackState) {
                          player.togglePlay();
                          return;
                        }
                        fetch(
                          `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
                          {
                            method: 'PUT',
                            body: JSON.stringify({
                              offset: { position: currentIndex },
                              position_ms: playlist.position,
                              uris: playlist.tracks.map((track) => track.uri),
                            }),
                            headers: {
                              Authorization: `Bearer ${session.accessToken}`,
                            },
                          }
                        ).catch((error) => {
                          console.error(
                            '>>> Failed to start playlist <<<',
                            error
                          );
                        });
                      }
                    : () => {
                        const newPlaylist = {
                          ...playlist,
                          tracks: playlist.tracks.map((track, index) => {
                            if (index < currentIndex) {
                              track.state = 'played';
                            } else {
                              track.state = 'queued';
                            }
                            return track;
                          }),
                        };
                        fetch(
                          `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
                          {
                            method: 'PUT',
                            body: JSON.stringify({
                              offset: { position: currentIndex },
                              uris: newPlaylist.tracks.map(
                                (track) => track.uri
                              ),
                            }),
                            headers: {
                              Authorization: `Bearer ${session.accessToken}`,
                            },
                          }
                        )
                          .then(() => {
                            mutatePlaylist(newPlaylist, false);
                          })
                          .catch((error) => {
                            console.error(
                              '>>> Failed to start track <<<',
                              error
                            );
                          });
                      }
                }
                track={track}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Playlist;
