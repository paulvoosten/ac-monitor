import WebPlaybackTrack from './WebPlaybackTrack';

export default interface WebPlaybackState {
  context: { uri?: string; metadata?: Record<string, string> };
  disallows: {
    pausing?: boolean;
    peeking_next?: boolean;
    peeking_prev?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
  };
  duration: number;
  loading: boolean;
  paused: boolean;
  playback_features: {
    change_playback_speed: boolean;
    hifi_status: string;
  };
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  timestamp: number;
  track_window: {
    current_track: WebPlaybackTrack;
    next_tracks: WebPlaybackTrack[];
    previous_tracks: WebPlaybackTrack[];
  };
}
