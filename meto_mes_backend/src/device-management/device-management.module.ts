import { Module } from '@nestjs/common';
import { DeviceManagementController } from './device-management.controller';
import { DeviceManagementService } from './device-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceManagementController],
  providers: [DeviceManagementService],
})
export class DeviceManagementModule {}
