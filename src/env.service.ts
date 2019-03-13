import dotenv from 'dotenv';
import { resolve } from 'path';

const mode = process.env.NODE_ENV;

const path = resolve(process.cwd(), `.env${ mode ? `.${ mode }` : `` }`);

const initialized = dotenv.config({ path });

export const kbEnv = {
  config: () => initialized
};
