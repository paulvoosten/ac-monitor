import Track from './Track';

export default interface Playlist {
  id: string;
  image: string;
  name: string;
  position: number;
  tracks: Track[];
}
