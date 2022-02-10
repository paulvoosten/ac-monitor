export default interface PlaybackState {
  context: { uri: string; metadata: Object };
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
    current_track: TrackInterface;
    next_tracks: Array<TrackInterface>;
    previous_tracks: Array<TrackInterface>;
  };
}
