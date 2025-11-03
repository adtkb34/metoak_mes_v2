import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ProductOrigin } from '../common/enums/product-origin.enum';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly originClients = new Map<ProductOrigin, PrismaClient>();

  constructor() {
    super();
    this.registerOriginClients();
  }

  async onModuleInit() {
    await this.$connect();

    for (const client of this.originClients.values()) {
      await client.$connect();
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();

    for (const client of this.originClients.values()) {
      await client.$disconnect();
    }
  }

  getClientByOrigin(origin?: ProductOrigin | null): PrismaClient {
    if (!origin) {
      return this;
    }

    const client = this.originClients.get(origin);
    console.log(this.originClients)
    if (!client) {
      this.logger.warn(
        `No Prisma client configured for origin ${ProductOrigin[origin] ?? origin}, falling back to default connection.`,
      );
      return this;
    }

    return client;
  }

  private registerOriginClients() {
    const originConfig: Array<[ProductOrigin, string | undefined]> = [
      [ProductOrigin.SUZHOU, process.env.DATABASE_URL_SUZHOU],
      [ProductOrigin.MIANYANG, process.env.DATABASE_URL_MIANYANG],
    ];

    for (const [origin, url] of originConfig) {
      if (!url) {
        this.logger.warn(
          `DATABASE_URL for origin ${ProductOrigin[origin] ?? origin} is not configured; using default connection.`,
        );
        continue;
      }

      this.originClients.set(
        origin,
        new PrismaClient({
          datasources: {
            db: {
              url,
            },
          },
        }),
      );
    }
  }
}
