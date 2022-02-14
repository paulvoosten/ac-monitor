import Track from './WebTrack';

export default interface WebPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: Record<string, string>;
  followers: {
    href?: string;
    total: number;
  };
  href: string;
  id: string;
  images: Array<{ height: number; url: string; width: number }>;
  name: string;
  owner: {
    display_name: string;
    external_urls: Record<string, string>;
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  primary_color: null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    items: Track[];
    next?: string;
  };
  uri: string;
}
