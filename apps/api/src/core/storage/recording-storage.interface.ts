export interface StorageConfig {
  provider: "local" | "s3" | "azure";
  config: Record<string, any>;
}

export interface RecordingStorage {
  testConnection(config: StorageConfig): Promise<boolean>;
  upload(
    localPath: string,
    destinationKey: string,
    config: StorageConfig,
  ): Promise<void>;
  getPlaybackUrl(storageKey: string, config: StorageConfig): Promise<string>;
  delete(storageKey: string, config: StorageConfig): Promise<void>;
}
