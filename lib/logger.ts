// Minimal structured logger (server-side). In production emits one-line JSON to
// stdout — Vercel log drains and Docker collectors capture it natively. In dev
// it prints a readable line. Zero dependencies on purpose; if log volume ever
// justifies pino, this wrapper is the only file to swap.

type Level = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
  err?: unknown;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

function emit(level: Level, msg: string, ctx?: LogContext): void {
  const isProd = process.env.NODE_ENV === "production";
  const payload: Record<string, unknown> = ctx ? { ...ctx } : {};
  if (payload.err !== undefined) payload.err = serializeError(payload.err);

  if (isProd) {
    const line = JSON.stringify({
      level,
      time: new Date().toISOString(),
      msg,
      ...payload,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  const extra = Object.keys(payload).length ? ` ${JSON.stringify(payload)}` : "";
  const line = `[careloop] ${level} ${msg}${extra}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};
