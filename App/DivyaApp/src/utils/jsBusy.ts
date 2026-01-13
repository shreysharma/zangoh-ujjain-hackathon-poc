export type BusyMonitor = {
  start: () => void;
  stop: () => void;
};

export const createJsBusyMonitor = (
  onBusyChange: (busy: boolean) => void,
  {
    sampleMs = 1000,
    busyThresholdMs = 250,
  }: { sampleMs?: number; busyThresholdMs?: number } = {},
): BusyMonitor => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let last = Date.now();
  let busy = false;
  let busyStreak = 0;
  let idleStreak = 0;

  const tick = () => {
    const now = Date.now();
    const lag = now - last - sampleMs;
    last = now;
    const isBusy = lag > busyThresholdMs;
    if (isBusy) {
      busyStreak += 1;
      idleStreak = 0;
      if (!busy && busyStreak >= 2) {
        busy = true;
        onBusyChange(true);
      }
    } else {
      idleStreak += 1;
      busyStreak = 0;
      if (busy && idleStreak >= 2) {
        busy = false;
        onBusyChange(false);
      }
    }
    timer = setTimeout(tick, sampleMs);
  };

  return {
    start() {
      if (timer) return;
      last = Date.now();
      timer = setTimeout(tick, sampleMs);
    },
    stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
};
