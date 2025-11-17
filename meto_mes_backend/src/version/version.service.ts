import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VersionInfo {
  backendVersion: string;
}

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);

  constructor(private readonly configService: ConfigService) {}

  getVersion(): VersionInfo {
    try {
      const backendVersion = this.configService.get<string>('BACKEND_VERSION');

      if (!backendVersion) {
        throw new Error('BACKEND_VERSION env variable is missing');
      }

      return {
        backendVersion,
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
