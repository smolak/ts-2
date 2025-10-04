import pino from "pino";
import { env } from "@/env";

export const logger = pino({ nestedKey: "payload", browser: { asObject: true }, level: env.LOG_LEVEL });
export type Logger = typeof logger;
