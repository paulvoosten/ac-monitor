export default interface Track {
  album: string;
  artist: string;
  duration: number;
  image: string;
  isHomoMusic: boolean;
  name: string;
  state: 'played' | 'playing' | 'queued';
  uri: string;
}
