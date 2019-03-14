import * as winston from 'winston';
import * as admin from "firebase-admin";

export interface KbLogger extends winston.Logger {
  table?: () => any;
}

export interface KbFirebaseOptions extends admin.AppOptions {
  projectId: string;
  collectionName?: string;
}

export interface KbColdDeckOptions {
  path: string;
  createDefaultConsole: boolean;
  firebase?: KbFirebaseOptions;
}

export interface KbLoggerOptions {
  transports?: any[];
  persist?: boolean;
  scope?: string | { msg: string; colors: string; }
}
