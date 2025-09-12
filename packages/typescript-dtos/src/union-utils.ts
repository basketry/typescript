import type { ComplexValue, Service, Type } from '@basketry/ir';
import { getTypeByName } from 'basketry';

export class UnionUtils {
  constructor(private readonly service: Service) {}

  /** Returns an array of unique heuristics for the given member and its related members. */
  getHeuristics(
    member: ComplexValue,
    otherMembers: ComplexValue[],
  ): Heuristic[] {
    return [
      ...this.getRequiredPropertyHeuristics(member, otherMembers),
      ...this.getConstantValueHeuristics(member, otherMembers),
      ...this.getRequiredPropertiesHeuristics(member, otherMembers),
    ];
  }

  getConstantValueHeuristics(
    member: ComplexValue,
    otherMembers: ComplexValue[],
  ): ConstantValueHeuristic[] {
    const type = getTypeByName(this.service, member.typeName.value);
    if (!type) return [];

    const requiredConstantProperties: Map<
      string,
      string | number | boolean | null
    > = new Map();

    for (const prop of type.properties) {
      if (
        prop.value.kind === 'PrimitiveValue' &&
        !prop.value.isOptional &&
        prop.value.constant
      ) {
        requiredConstantProperties.set(
          prop.name.value,
          prop.value.constant.value,
        );
      }
    }

    if (!requiredConstantProperties.size) return [];

    for (const otherMember of otherMembers) {
      const otherType = getTypeByName(this.service, otherMember.typeName.value);
      if (!otherType) continue;

      for (const prop of otherType.properties) {
        if (
          prop.value.kind === 'PrimitiveValue' &&
          !prop.value.isOptional &&
          prop.value.constant
        ) {
          const requiredConstantProperty = requiredConstantProperties.get(
            prop.name.value,
          );
          if (!requiredConstantProperty) continue;
          if (requiredConstantProperty === prop.value.constant.value) {
            requiredConstantProperties.delete(prop.name.value);
          }
        }
      }
    }

    return Array.from(requiredConstantProperties).map(([property, value]) => ({
      kind: 'ConstantValue',
      property,
      value,
    }));
  }

  getRequiredPropertyHeuristics(
    member: ComplexValue,
    otherMembers: ComplexValue[],
  ): RequiredPropertyHeuristic[] {
    const type = getTypeByName(this.service, member.typeName.value);
    if (!type) return [];

    const otherRequiredProperties = new Set(
      otherMembers
        .map((t) => getTypeByName(this.service, t.typeName.value))
        .filter((t): t is Type => !!t)
        .flatMap((t) => t.properties)
        .filter((p) => !p.value.isOptional)
        .map((p) => p.name.value),
    );

    return type.properties
      .filter((p) => !p.value.isOptional)
      .map((p) => p.name.value)
      .filter((n) => !otherRequiredProperties.has(n))
      .map((n) => ({ kind: 'RequiredProperty', property: n }));
  }

  getRequiredPropertiesHeuristics(
    member: ComplexValue,
    otherMembers: ComplexValue[],
  ): RequiredPropertiesHeuristic[] {
    const type = getTypeByName(this.service, member.typeName.value);
    if (!type) return [];

    function getRequiredPropertyNames(t: Type): Set<string> {
      return new Set(
        t.properties
          .filter((p) => !p.value.isOptional)
          .map((p) => p.name.value),
      );
    }

    const otherRequiredProperties = otherMembers
      .map((v) => getTypeByName(this.service, v.typeName.value))
      .filter((t): t is Type => !!t)
      .map(getRequiredPropertyNames);

    const requiredProperties = getRequiredPropertyNames(type);

    const properties = distinguishingSubset(
      requiredProperties,
      otherRequiredProperties,
    );

    if (properties.length === 0) return [];

    return [{ kind: 'RequiredProperties', properties }];
  }
}

/**
 * Smallest subset of `t` that distinguishes `t` from every set in `s`.
 * Returns [] if impossible (i.e., some S_i ⊇ t).
 */
function distinguishingSubset(t: Set<string>, s: Set<string>[]): string[] {
  const T = Array.from(t); // preserve caller's insertion order
  const D: Array<Set<string>> = s.map((Si) => {
    const d = new Set<string>();
    for (const x of t) if (!Si.has(x)) d.add(x);
    return d;
  });

  // Impossible if any D_i is empty
  if (D.some((d) => d.size === 0)) return [];

  // Exact for small |T|, greedy otherwise
  const MAX_EXACT = 16;
  if (T.length <= MAX_EXACT) {
    for (let k = 1; k <= T.length; k++) {
      const combo = firstComboThatHitsAll(T, D, k);
      if (combo) return combo;
    }
    return [];
  }
  return greedyHit(T, D);
}

// ---- helpers ----

function firstComboThatHitsAll(
  T: string[],
  D: Array<Set<string>>,
  k: number,
): string[] | null {
  const pick: number[] = [];
  const n = T.length;

  function backtrack(start: number): string[] | null {
    if (pick.length === k) {
      const chosen = new Set(pick.map((i) => T[i]));
      for (const d of D) {
        let hit = false;
        for (const x of d)
          if (chosen.has(x)) {
            hit = true;
            break;
          }
        if (!hit) return null;
      }
      return Array.from(chosen);
    }
    for (let i = start; i < n; i++) {
      pick.push(i);
      const res = backtrack(i + 1);
      if (res) return res;
      pick.pop();
    }
    return null;
  }

  return backtrack(0);
}

function greedyHit(T: string[], D: Array<Set<string>>): string[] {
  const remaining = new Set(D.keys());
  const result: string[] = [];

  // For each element e, which D_i contain e
  const carries = new Map<string, Set<number>>();
  for (const e of T) carries.set(e, new Set<number>());
  D.forEach((d, i) => {
    for (const e of d) if (carries.has(e)) carries.get(e)!.add(i);
  });

  while (remaining.size > 0) {
    let best: string | null = null;
    let bestScore = -1;

    for (const e of T) {
      const hitSet = carries.get(e)!;
      let score = 0;
      for (const i of hitSet) if (remaining.has(i)) score++;
      if (score > bestScore || (score === bestScore && best === null)) {
        best = e;
        bestScore = score;
      }
    }

    if (!best || bestScore <= 0) return []; // safety guard

    result.push(best);
    for (const i of carries.get(best)!) remaining.delete(i);
  }

  return result;
}

/** Flattens a condition by merging nested AndClauses and OrClauses */
export function flatten<T extends Condition>(condition: T): T {
  if (condition.kind === 'AndClause') {
    // Recursively flatten all clauses first
    const flattenedClauses = condition.clauses.map(flatten);
    // Then flatten any nested AndClauses
    const resultClauses = flattenedClauses.flatMap((c) =>
      c.kind === 'AndClause' ? c.clauses : [c],
    );
    return { kind: 'AndClause', clauses: resultClauses } as T;
  } else if (condition.kind === 'OrClause') {
    // Recursively flatten all clauses first
    const flattenedClauses = condition.clauses.map(flatten);
    // Then flatten any nested OrClauses
    const resultClauses = flattenedClauses.flatMap((c) =>
      c.kind === 'OrClause' ? c.clauses : [c],
    );
    return { kind: 'OrClause', clauses: resultClauses } as T;
  }
  return condition;
}

/** Removes duplicate expressions (first instances are preserved) */
export function dedup(conditions: Condition[]): Condition[] {
  const seen = new Set<string>();
  return conditions.filter((c) => {
    const rendered = render(c);
    if (seen.has(rendered)) return false;
    seen.add(rendered);
    return true;
  });
}

export function render(condition: Condition): string {
  switch (condition.kind) {
    case 'Expression':
      return condition.value;
    case 'AndClause': {
      const clauses = flatten(condition);
      const deduped = dedup(clauses.clauses);

      if (deduped.length === 1) {
        return render(deduped[0]);
      } else {
        return `(${deduped.map(render).join(' && ')})`;
      }
    }
    case 'OrClause': {
      const clauses = flatten(condition);
      const deduped = dedup(clauses.clauses);

      if (deduped.length === 1) {
        return render(deduped[0]);
      } else {
        return `(${deduped.map(render).join(' || ')})`;
      }
    }
  }
}

export type Heuristic =
  | ConstantValueHeuristic
  | RequiredPropertyHeuristic
  | RequiredPropertiesHeuristic;

/** Represents a property with a constant value that can be used to discriminate a union member */
export type ConstantValueHeuristic = {
  kind: 'ConstantValue';
  property: string;
  value: string | number | boolean | null;
};

/** Represents a required property only found on a single type */
export type RequiredPropertyHeuristic = {
  kind: 'RequiredProperty';
  property: string;
};

/** Represents a set of required properties only found on a single type */
export type RequiredPropertiesHeuristic = {
  kind: 'RequiredProperties';
  properties: string[];
};
export type Expression = { kind: 'Expression'; value: string };
export type AndClause = {
  kind: 'AndClause';
  clauses: Condition[];
};
export type OrClause = {
  kind: 'OrClause';
  clauses: Condition[];
};
export type Condition = Expression | AndClause | OrClause;
export type ConditionalBlock = {
  condition: Condition;
  statements: Iterable<string>;
};

export function and(...clauses: Condition[]): AndClause {
  return { kind: 'AndClause', clauses };
}

export function or(...clauses: Condition[]): OrClause {
  return { kind: 'OrClause', clauses };
}

export function expr(value: string): Expression {
  return { kind: 'Expression', value };
}
