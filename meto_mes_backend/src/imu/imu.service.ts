import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SkuProductionProcessDto2 } from './AttrKeyValueDto';



@Injectable()
export class ImuCalibService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getCalibResults(sn: string) {
    try {
      // 查询最新的 mo_calibration id
      const latestCalib = await this.prisma.mo_calibration.findFirst({
        where: { camera_sn: sn },
        orderBy: { end_time: 'desc' },
        select: { id: true, start_time: true },
      });

      if (!latestCalib) {
        throw new Error('No calibration record found');
      }

      const calibId = latestCalib.id;
      const calibTimeUTC = latestCalib.start_time;

      console.log('UTC:', calibTimeUTC.toISOString());

      // 先按 calibration_id 查
      const results = await this.prisma.mo_imu_calib_results.findMany({
        where: { sn, mo_calibration_id: calibId },
        orderBy: { id: 'asc' },
      });
      

      if (results.length === 0) {
        // 再按 create_time 查，大于北京时间
        const res = await this.prisma.mo_imu_calib_results.findMany({
          orderBy: { id: 'asc' },
          where: {
            sn,
            create_time: { gt: calibTimeUTC },
          },
        });
        console.log(res.map(item => item.create_time?.toISOString()));
        
        res.forEach(item => {
          if (item.mo_calibration_id) {
            item.mo_calibration_id = null;
          }
        });
        return res;
      }

        results.forEach(item => {
          if (item.mo_calibration_id) {
            item.mo_calibration_id = null;
          }
        });
      return results;
    } catch (error) {
      throw new Error(`Failed to fetch calibration results: ${error.message}`);
    }
  }


  async addResult(dto: SkuProductionProcessDto2) {
    if (dto.productionProcessNo !== 'Step 28') {
      return { success: false, message: '非Step 28不处理' };
    }

    const productSn = dto.productSn;
    const task = dto.taskResults[0];
    const attrKeyValues = task.attrKeyValues;
    const errorNo = task.productionProcessErrorNo;
    const status = errorNo === '0' ? 0 : -1;
    const calibresult_id = dto.calibresult_id;

    const resultMap: Record<number, any> = {};

    for (const item of attrKeyValues) {
      const position = item.position;
      if (!resultMap[position]) {
        resultMap[position] = {
          camera_sn: productSn,
          position,
          calibresult_id: calibresult_id,
          status,
          error_no: errorNo,
          create_time: new Date(),
          update_time: new Date(),
        };
      }

      const val = parseFloat(item.val);
      if (isNaN(val)) continue;

      const result = resultMap[position];
      switch (item.no) {
        case 'calib001': result.r_roll = val; break;
        case 'calib002': result.r_pitch = val; break;
        case 'calib003': result.r_yaw = val; break;
        case 'calib004': result.t_x = val; break;
        case 'calib005': result.t_y = val; break;
        case 'calib006': result.t_z = val; break;
        case 'calib007': result.accelerometer_error_mean = val; break;
        case 'calib008': result.accelerometer_error_std = val; break;
        case 'calib009': result.gyroscope_error_mean = val; break;
        case 'calib010': result.gyroscope_error_std = val; break;
        case 'calib011': result.reprojection_error_mean = val; break;
        case 'calib012': result.reprojection_error_std = val; break;
        case 'calib013': result.accelerometer_noise_density = val; break;
        case 'calib014': result.accelerometer_random_walk = val; break;
        case 'calib015': result.gyroscope_noise_density = val; break;
        case 'calib016': result.gyroscope_random_walk = val; break;
      }
    }

    // 插入所有构造的结果
    for (const pos in resultMap) {
      const result = resultMap[pos];
      await this.prisma.mo_imu_result.create({ data: result });
    }

    return { success: true };
  }
}
