import { compareRoutes } from './route-utils';

const sortRoutes = (routes: string[]) => [...routes].sort(compareRoutes);

const expectBefore = (a: string, b: string) => {
  expect(compareRoutes(a, b)).toBeLessThan(0);
  expect(compareRoutes(b, a)).toBeGreaterThan(0);
};

const permutations = <T>(items: T[]): T[][] => {
  if (items.length < 2) return [items];

  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
      (rest) => [item, ...rest],
    ),
  );
};

const expectEveryPermutationSortsTo = (expected: string[]) => {
  for (const input of permutations(expected)) {
    expect(sortRoutes(input)).toEqual(expected);
  }
};

describe('compareRoutes', () => {
  describe('static-vs-parameter specificity', () => {
    it.each<[string, string]>([
      ['/charts/folder-tree', '/charts/:id'],
      ['/charts/folder-tree', '/charts/:id/children'],
      ['/charts/folder-tree/children', '/charts/:id/children'],
      ['/orgs/:orgId/settings', '/orgs/:orgId/:section'],
      ['/orgs/:orgId/settings', '/orgs/:orgId/:section/details'],
      ['/orgs/:orgId/members/me', '/orgs/:orgId/members/:memberId'],
      [
        '/orgs/:orgId/members/me/profile',
        '/orgs/:orgId/members/:memberId/profile',
      ],
    ])(
      'sorts literal route %s before parameterized route %s',
      (literal, parameterized) => {
        expectBefore(literal, parameterized);
      },
    );

    it('prevents the reported /charts/folder-tree route from being shadowed by /charts/:id', () => {
      expect(sortRoutes(['/charts/:id', '/charts/folder-tree'])).toEqual([
        '/charts/folder-tree',
        '/charts/:id',
      ]);
    });
  });

  describe('static sibling ordering', () => {
    it('sorts static sibling routes lexicographically', () => {
      expect(
        sortRoutes([
          '/charts/recent',
          '/charts/folder-tree',
          '/charts/archive',
        ]),
      ).toEqual(['/charts/archive', '/charts/folder-tree', '/charts/recent']);
    });

    it('sorts static sibling branches lexicographically before comparing later segments', () => {
      expect(
        sortRoutes([
          '/charts/b/detail',
          '/charts/a/detail',
          '/charts/c/detail',
        ]),
      ).toEqual(['/charts/a/detail', '/charts/b/detail', '/charts/c/detail']);
    });
  });

  describe('dynamic segment behavior', () => {
    it('treats different parameter names as equivalent route shapes', () => {
      expect(compareRoutes('/charts/:id', '/charts/:chartId')).toBe(0);

      expect(
        compareRoutes(
          '/orgs/:orgId/members/:memberId',
          '/orgs/:teamId/members/:userId',
        ),
      ).toBe(0);
    });

    it('preserves input order for equivalent dynamic route shapes because sort is stable', () => {
      const routes = ['/charts/:id', '/charts/:chartId', '/charts/:slug'];

      expect(sortRoutes(routes)).toEqual(routes);
    });
  });

  describe('nested route ordering', () => {
    it('keeps an exact parent route before its deeper child route', () => {
      expect(sortRoutes(['/users/me/profile', '/users/me'])).toEqual([
        '/users/me',
        '/users/me/profile',
      ]);
    });

    it('keeps parameterized parent routes before their deeper child routes', () => {
      expect(sortRoutes(['/users/:id/profile', '/users/:id'])).toEqual([
        '/users/:id',
        '/users/:id/profile',
      ]);
    });

    it('sorts a mixed user route set deterministically', () => {
      const routes = [
        '/users/:id',
        '/users/me',
        '/users/:id/profile',
        '/users/me/profile',
      ];

      expect(sortRoutes(routes)).toEqual([
        '/users/me',
        '/users/me/profile',
        '/users/:id',
        '/users/:id/profile',
      ]);
    });
  });

  describe('normalization-equivalent paths', () => {
    it('treats trailing slashes as equivalent', () => {
      expect(compareRoutes('/users/me/', '/users/me')).toBe(0);
      expect(compareRoutes('/users/:id/', '/users/:id')).toBe(0);
    });

    it('treats repeated slashes as equivalent after empty segments are filtered', () => {
      expect(compareRoutes('//users//me', '/users/me')).toBe(0);
      expect(compareRoutes('/users//:id', '/users/:id')).toBe(0);
    });
  });

  describe('comparator contract', () => {
    const representativeRoutes = [
      '/',
      '/health',
      '/charts/a',
      '/charts/b/a',
      '/charts/folder-tree',
      '/charts/:id',
      '/charts/:id/a',
      '/orgs/:orgId/members/me',
      '/orgs/:orgId/members/:memberId',
      '/orgs/:orgId/settings',
      '/orgs/:orgId/:section',
      '/users/me',
      '/users/me/profile',
      '/users/:id',
      '/users/:id/profile',
    ];

    it('is antisymmetric for representative routes', () => {
      for (const a of representativeRoutes) {
        for (const b of representativeRoutes) {
          const ab = Math.sign(compareRoutes(a, b));
          const ba = Math.sign(compareRoutes(b, a));

          if (ab === 0 || ba === 0) {
            expect(ab).toBe(0);
            expect(ba).toBe(0);
          } else {
            expect(ab).toBe(-ba);
          }
        }
      }
    });

    it('is transitive for representative routes', () => {
      for (const a of representativeRoutes) {
        for (const b of representativeRoutes) {
          for (const c of representativeRoutes) {
            const ab = compareRoutes(a, b);
            const bc = compareRoutes(b, c);
            const ac = compareRoutes(a, c);

            if (ab <= 0 && bc <= 0) {
              expect(ac).toBeLessThanOrEqual(0);
            }
          }
        }
      }
    });

    it('does not produce input-order-dependent sorting for the known non-transitive shape', () => {
      const expected = ['/charts/a', '/charts/b/a', '/charts/:id/a'];

      expectEveryPermutationSortsTo(expected);
    });
  });
});
