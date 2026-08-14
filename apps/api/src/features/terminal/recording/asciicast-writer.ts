import fs from "node:fs";
import logger from "../../../core/logger.js";

export class AsciicastV2Writer {
  private readonly stream: fs.WriteStream;
  private readonly startTime: number;
  private broken = false;

  constructor(
    private readonly filePath: string,
    cols: number,
    rows: number,
  ) {
    this.startTime = Date.now();
    this.stream = fs.createWriteStream(filePath, { flags: "w" });

    this.stream.on("error", (err) => {
      logger.error({
        event: "recording.stream_error",
        error: err.message,
        filePath,
      });
      this.broken = true; // stop writing; never throw into the caller, a recording failure must not affect the live terminal proxy
    });

    this.writeHeader(cols, rows);
  }

  private writeHeader(cols: number, rows: number) {
    const header = {
      version: 2,
      width: cols,
      height: rows,
      timestamp: Math.floor(this.startTime / 1000),
    };
    this.safeWrite(JSON.stringify(header));
  }

  private elapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  private safeWrite(line: string) {
    if (this.broken) return;
    try {
      this.stream.write(line + "\n");
    } catch (err) {
      logger.error({
        event: "recording.write_failed",
        error: (err as Error).message,
        filePath: this.filePath,
      });
      this.broken = true;
    }
  }

  writeOutput(data: Buffer | string) {
    this.safeWrite(JSON.stringify([this.elapsed(), "o", data.toString()]));
  }

  writeResize(cols: number, rows: number) {
    this.safeWrite(JSON.stringify([this.elapsed(), "r", `${cols}x${rows}`]));
  }

  writeMarker(label: string) {
    this.safeWrite(JSON.stringify([this.elapsed(), "m", label]));
  }

  async close(): Promise<{
    durationSeconds: number;
    fileSizeBytes: number;
  } | null> {
    const durationSeconds = this.elapsed();
    return new Promise((resolve) => {
      this.stream.end(() => {
        if (this.broken) {
          resolve(null); // caller marks the DB row 'failed', doesn't crash
          return;
        }
        fs.stat(this.filePath, (err, stats) => {
          resolve(err ? null : { durationSeconds, fileSizeBytes: stats.size });
        });
      });
    });
  }
}
