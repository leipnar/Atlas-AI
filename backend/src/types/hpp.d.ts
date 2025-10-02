declare module 'hpp' {
  import { RequestHandler } from 'express';

  interface HppOptions {
    whitelist?: string | string[] | { [key: string]: boolean };
  }

  function hpp(options?: HppOptions): RequestHandler;

  export = hpp;
}