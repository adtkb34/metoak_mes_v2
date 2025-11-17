import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface VersionInfo {
  backendVersion: string;
}

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);
  private readonly versionFilePath = join(process.cwd(), 'config', 'version.json');

  getVersion(): VersionInfo {
    try {
      const content = readFileSync(this.versionFilePath, 'utf-8');
      const data = JSON.parse(content) as Partial<VersionInfo>;

      if (!data.backendVersion || typeof data.backendVersion !== 'string') {
        throw new Error('Invalid version config file');
      }

      return {
        backendVersion: data.backendVersion,
      } satisfies VersionInfo;
    } catch (error) {
      this.logger.error(
        'Failed to load version information',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('无法获取版本信息');
    }
  }
}
