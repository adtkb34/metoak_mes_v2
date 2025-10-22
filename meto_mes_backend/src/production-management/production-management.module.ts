import { Module } from '@nestjs/common';
import { ProductionManagementController } from './production-management.controller';
import { ProductionManagementService } from './production-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { K3cloudModule } from 'src/k3cloud/k3cloud.module';

@Module({
  imports: [PrismaModule, K3cloudModule],
  controllers: [ProductionManagementController],
  providers: [ProductionManagementService],
})
export class ProductionManagementModule {}
