export default interface Track {
  album: string;
  artist: string;
  duration: number;
  image: string;
  name: string;
  state: 'played' | 'playing' | 'queued';
  uri: string;
}
