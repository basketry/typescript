export function compareRoutes(a: string, b: string): number {
  const aSegs = a.split('/').filter(Boolean);
  const bSegs = b.split('/').filter(Boolean);

  const steps = Math.max(aSegs.length, bSegs.length);

  for (let i = 0; i < steps; i++) {
    if (i >= aSegs.length) {
      return -1;
    }

    if (i >= bSegs.length) {
      return 1;
    }

    const aSeg = aSegs[i];
    const bSeg = bSegs[i];
    const aParam = aSeg.startsWith(':');
    const bParam = bSeg.startsWith(':');

    if (!aParam && !bParam) {
      const cmp = aSeg.localeCompare(bSeg);

      if (cmp !== 0) {
        return cmp;
      }
    } else if (aParam && bParam) {
      continue;
    } else if (!aParam) {
      return -1;
    } else {
      return 1;
    }
  }

  return 0;
}
