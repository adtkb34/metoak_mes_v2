import { Module } from '@nestjs/common';
import { StereoPrecheckController } from './stereo_precheck.controller';
import { StereoPrecheckService } from './stereo_precheck.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InformationInquiryService } from 'src/information-inquiry/information-inquiry.service';

@Module({
  imports: [PrismaModule],
  controllers: [StereoPrecheckController],
  providers: [StereoPrecheckService, InformationInquiryService]
})
export class StereoPrecheckModule {}
