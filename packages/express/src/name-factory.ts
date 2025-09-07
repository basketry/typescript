import { Interface } from 'basketry';
import { camel } from 'case';

export function buildRouterFactoryName(int: Interface): string {
  return camel(`${int.name.value}_routes`);
}
