declare namespace Spotify {
  interface Track extends Spotify.Track {
    linked_from: {
      id: string;
      uri: string;
    };
  }
}
