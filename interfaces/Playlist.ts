import Track from './Track';

export default interface Playlist {
  image: string;
  position: number;
  tracks: Track[];
  uri: string;
}
