export default interface WebPlaybackTrack {
  album: {
    images: { height: number; url: string; width: number }[];
    name: string;
    uri: string;
  };
  artists: { name: string; uri: string }[];
  duration_ms: number;
  id: string;
  is_playable: boolean;
  linked_from: { id?: string; uri?: string };
  media_type: string;
  name: string;
  track_type: string;
  type: string;
  uid: string;
  uri: string;
}
