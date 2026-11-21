import { useAudioPlayer } from "expo-audio";

export function useCheckInSound() {
  const success = useAudioPlayer(require("../../../assets/sounds/success.wav"));
  const duplicate = useAudioPlayer(
    require("../../../assets/sounds/duplicate.wav"),
  );
  const failure = useAudioPlayer(require("../../../assets/sounds/failure.wav"));

  return (status?: number) => {
    const player = status === 1 ? success : status === 2 ? duplicate : failure;
    // Audio feedback must never affect the check-in result (including blocked browser audio).
    void (async () => {
      try {
        success.pause();
        duplicate.pause();
        failure.pause();
        await player.seekTo(0);
        player.play();
      } catch {
        /* The visible result remains available when audio cannot play. */
      }
    })();
  };
}
