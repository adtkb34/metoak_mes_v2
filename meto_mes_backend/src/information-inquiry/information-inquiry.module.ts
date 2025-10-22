import { Module } from '@nestjs/common';
import { InformationInquiryService } from './information-inquiry.service';
import { InformationInquiryController } from './information-inquiry.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
// import { QualityManagementModule } from 'src/quality-management/quality-management.module';

@Module({
  imports: [PrismaModule],
  providers: [InformationInquiryService],
  controllers: [InformationInquiryController],
})
export class InformationInquiryModule {}
