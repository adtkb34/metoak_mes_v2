import { Module } from '@nestjs/common';
import { QualityManagementController } from './quality-management.controller';
import { QualityManagementService } from './quality-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpcModule } from 'src/spc/spc.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, SpcModule, ConfigModule],
  controllers: [QualityManagementController],
  providers: [QualityManagementService],
  // exports: [QualityManagementService]
})
export class QualityManagementModule {}
