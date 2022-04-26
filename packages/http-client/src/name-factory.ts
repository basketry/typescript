import { Interface } from 'basketry';
import { buildInterfaceName } from '@basketry/typescript';
import { pascal } from 'case';

function prefix(clientModule: string | undefined, name: string) {
  return clientModule ? `${clientModule}.${name}` : name;
}

export function buildHttpClientName(
  int: Interface,
  clientModule?: string,
): string {
  return prefix(clientModule, pascal(`http_${buildInterfaceName(int)}`));
}
