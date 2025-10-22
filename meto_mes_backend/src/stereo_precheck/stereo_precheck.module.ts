import { Module } from '@nestjs/common';
import { StereoPrecheckController } from './stereo_precheck.controller';
import { StereoPrecheckService } from './stereo_precheck.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StereoPrecheckController],
  providers: [StereoPrecheckService]
})
export class Stereo_PrecheckModule {}
