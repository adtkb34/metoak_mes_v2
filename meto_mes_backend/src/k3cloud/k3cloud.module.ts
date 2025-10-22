import { Module } from '@nestjs/common';
import { K3CloudController } from './k3cloud.controller';
import { K3CloudService } from './k3cloud.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [K3CloudController],
  providers: [K3CloudService],
  exports: [K3CloudService],
})
export class K3cloudModule {}
