function getRouteScore(route: string): number {
  return route
    .split('/')
    .filter(Boolean)
    .reduce((acc, seg) => acc * 3 + (seg.startsWith(':') ? 1 : 2), 0);
}

export function compareRoutes(a: string, b: string): number {
  const scoreA = getRouteScore(a);
  const scoreB = getRouteScore(b);

  const aSegs = a.split('/').filter(Boolean);
  const bSegs = b.split('/').filter(Boolean);
  const steps = Math.min(aSegs.length, bSegs.length);

  for (let i = 0; i < steps; i++) {
    const aSeg = aSegs[i];
    const bSeg = bSegs[i];

    if (!aSeg.startsWith(':') && !bSeg.startsWith(':')) {
      const cmp = aSeg.localeCompare(bSeg);

      if (cmp !== 0) {
        return cmp;
      }
    } else if (aSeg.startsWith(':') && bSeg.startsWith(':')) {
      continue;
    } else {
      break;
    }
  }

  return scoreB - scoreA;
}
