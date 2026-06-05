export function detectFrustrationSignals(eventsArr: any[]) {
  const flags = {
    hasRageClicks: false,
    hasDeadClicks: false,
    hasUTurns: false,
    hasWildScrolling: false,
  };

  const clicks: any[] = [];
  let scrollCount = 0;

  for (let i = 0; i < eventsArr.length; i++) {
    const ev = eventsArr[i];
    
    // IncrementalSnapshot = 3
    if (ev.type === 3 && ev.data) {
      // MouseInteraction = 2, Click = 2
      if (ev.data.source === 2 && ev.data.type === 2) {
        clicks.push(ev);
        
        // Rage Clicks
        const recentClicks = clicks.filter((c: any) => ev.timestamp - c.timestamp < 1000);
        if (recentClicks.length >= 3) {
          const xs = recentClicks.map((c: any) => c.data.x);
          const ys = recentClicks.map((c: any) => c.data.y);
          const maxDist = Math.max(
            Math.max(...xs) - Math.min(...xs),
            Math.max(...ys) - Math.min(...ys)
          );
          if (maxDist < 50) flags.hasRageClicks = true;
        }

        // Dead Clicks: No DOM mutation (source = 0) within 2000ms
        let hasMutation = false;
        for (let j = i + 1; j < eventsArr.length; j++) {
          const nextEv = eventsArr[j];
          if (nextEv.timestamp - ev.timestamp > 2000) break;
          if (nextEv.type === 3 && nextEv.data.source === 0) {
            hasMutation = true;
            break;
          }
        }
        if (!hasMutation) {
          flags.hasDeadClicks = true;
        }
      }

      // Scroll = 3
      if (ev.data.source === 3) {
        scrollCount++;
      }
    }
    
    // U-Turns (Approximation: rapid navigation events)
    // Custom events with tag 'navigation' or Meta events (type = 4)
    if ((ev.type === 5 && ev.data?.tag === 'navigation') || ev.type === 4) {
      for (let j = i + 1; j < eventsArr.length; j++) {
        const nextEv = eventsArr[j];
        if (nextEv.timestamp - ev.timestamp > 5000) break;
        if ((nextEv.type === 5 && nextEv.data?.tag === 'navigation') || nextEv.type === 4) {
          flags.hasUTurns = true;
          break;
        }
      }
    }
  }

  // Wild Scrolling
  if (scrollCount > 20) {
    flags.hasWildScrolling = true;
  }

  return flags;
}
