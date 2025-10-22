import { Module } from '@nestjs/common';
import { WarehouseManagementController } from './warehouse-management.controller';
import { WarehouseManagementService } from './warehouse-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WarehouseManagementController],
  providers: [WarehouseManagementService],
})
export class WarehouseManagementModule {}
