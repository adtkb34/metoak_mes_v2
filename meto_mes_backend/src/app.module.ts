import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { HomeModule } from './home/home.module';
import { ProductionManagementModule } from './production-management/production-management.module';
import { QualityManagementModule } from './quality-management/quality-management.module';
import { InformationInquiryModule } from './information-inquiry/information-inquiry.module';
import { WarehouseManagementModule } from './warehouse-management/warehouse-management.module';
import { ReportCenterModule } from './report-center/report-center.module';
import { DataAnalysisModule } from './data-analysis/data-analysis.module';
import { BasicInformationModule } from './basic-information/basic-information.module';
import { TagModule } from './tag/tag.module';
import { SpcModule } from './spc/spc.module';
import { ImuController } from './imu/imu.controller';
import { ImuModule } from './imu/imu.module';
import { StereoPrecheckModule } from './stereo-precheck/stereo_precheck.module';
import { K3cloudModule } from './k3cloud/k3cloud.module';
import { M55hModule } from './m55h/m55h.module';
import { AdjustFocusModule } from './adjust-focus/adjust_focus.module';
import { StereoPostcheckModule } from './stereo-postcheck/stereo-postcheck.module';
import { Stereo_PrecheckModule } from './stereo_precheck/stereo_precheck.module';
import { TransferBoxModule } from './transfer-box/transfer-box.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SerialNumberDataModule } from './serial-number-data/serial-number-data.module';
import { TraceabilityModule } from './traceability/traceability.module';

@Module({
  imports: [
    UserModule,
    HomeModule,
    ProductionManagementModule,
    QualityManagementModule,
    InformationInquiryModule,
    WarehouseManagementModule,
    ReportCenterModule,
    DataAnalysisModule,
    BasicInformationModule,
    TagModule,
    SpcModule,
    ImuModule,
    StereoPrecheckModule,
    K3cloudModule,
    M55hModule,
    AdjustFocusModule,
    StereoPostcheckModule,
    Stereo_PrecheckModule,
    TransferBoxModule,
    DashboardModule,
    SerialNumberDataModule,
    TraceabilityModule,
  ],
  controllers: [AppController, ImuController],
  providers: [AppService],
})
export class AppModule {}
