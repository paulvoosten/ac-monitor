import WebPlaybackTrack from './WebPlaybackTrack';

export default interface WebTrack {
  added_at: string;
  added_by: {
    external_urls: Record<string, string>;
    id: string;
  };
  is_local: false;
  primary_color?: string;
  track: WebPlaybackTrack;
}
