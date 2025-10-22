import { Module } from '@nestjs/common';
import { BasicInformationController } from './basic-information.controller';
import { BasicInformationService } from './basic-information.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BasicInformationController],
  providers: [BasicInformationService],
})
export class BasicInformationModule {}
