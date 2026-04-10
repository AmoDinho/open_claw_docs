declare module "node:fs/promises" {
  export function access(path: string): Promise<void>;
  export function appendFile(path: string, data: string): Promise<void>;
  export function mkdir(
    path: string,
    options?: {
      recursive?: boolean;
    },
  ): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, data: string): Promise<void>;
}

declare module "node:path" {
  export function join(...paths: string[]): string;
}
