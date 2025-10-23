import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SnType } from 'src/utils/sn';
import { STEP_NO } from 'src/utils/stepNo';
// import { QualityManagementService } from 'src/quality-management/quality-management.service';

@Injectable()
export class InformationInquiryService {
  constructor(private prisma: PrismaService) {}

  // 组装信息
  async getShellInfo(sn) {
    return this.prisma.mo_tag_shell_info.findFirst({
      where: { shell_sn: sn },
      orderBy: { id: 'desc' },
      select: {
        camera_sn: true,
        station_number: true,
        operator: true,
        operation_time: true,
      },
    });
  }

  async getCameraInfo(sn) {
    return this.prisma.mo_tag_shell_info.findFirst({
      where: { camera_sn: sn },
      orderBy: { id: 'desc' },
      select: {
        camera_sn: true,
        station_number: true,
        operator: true,
        operation_time: true,
      },
    });
  }

  async getAssembleInfo(sn) {
    const shellInfo = await this.getShellInfo(sn);
    return this.prisma.mo_assemble_info.findFirst({
      where: { camera_sn: shellInfo?.camera_sn },
    });
  }

  // 定焦信息
  async getAdjustInfo(camera_sn: string) {
    return this.prisma.mo_assemble_info.findFirst({
      where: { camera_sn },
    });
  }

  // 标定信息
  async getCalibrationInfo(camera_sn: string) {
    if (!camera_sn) return null;

    const result = await this.prisma.mo_calibration.findFirst({
      where: {
        camera_sn,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        station_number: true,
        operator: true,
        start_time: true,
        epr_filename: true,
        yml_filename: true,
        file_path: true,
        error_code: true,
        tool_version: true,
      },
    });

    return result;
  }

  // 终检信息
  async getFQCInfo(camera_sn: string) {
    const check = await this.prisma.mo_final_result.findFirst({
      where: {
        camera_sn,
        check_type: 'FQC',
      },
    });

    if (!check?.camera_sn) return null;

    const result = await this.prisma.mo_final_check.findFirst({
      where: {
        camera_sn: check.camera_sn,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        station_number: true,
        operator: true,
        start_time: true,
        check_result: true,
        image_path: true,
      },
    });
    return result;
  }

  // 出货检信息
  async getOQCInfo(camera_sn: string) {
    const check = await this.prisma.mo_final_result.findFirst({
      where: {
        camera_sn,
        check_type: 'OQC',
      },
    });

    if (!check?.camera_sn) return null;

    const result = await this.prisma.mo_final_result.findFirst({
      where: {
        camera_sn: check.camera_sn,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        station_number: true,
        operator: true,
        check_time: true,
        check_result: true,
        image_path: true,
      },
    });

    return result;
  }

  // 封箱信息
  async getPackingInfo(camera_sn: string) {
    return await this.prisma.mo_packing_info.findFirst({
      where: {
        camera_sn,
      },
      select: {
        packing_code: true,
        station_number: true,
        operator: true,
        start_time: true,
        tool_version: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  // 其他信息
  async getBeamDetail(beamSn: string) {
    // 先查出 produce_order_id
    const shellInfo = await this.getShellInfo(beamSn);
    const order = await this.prisma.mo_tag_shell_info.findFirst({
      where: {
        shell_sn: shellInfo?.camera_sn,
      },
    });

    if (!order?.order_code) {
      return null;
    }

    // 再查出 produce_order 的具体信息
    const orderInfo = await this.prisma.mo_produce_order.findFirst({
      where: {
        work_order_code: order?.order_code,
      },
      select: {
        work_order_code: true,
        material_code: true,
        material_name: true,
        cmos_pn: true,
        lens_sn: true,
        fpga_version: true,
      },
    });

    return {
      ...orderInfo,
    };
  }

  async getRelatedSerialNumber(sn) {
    const beamInfo = await this.prisma.mo_beam_info.findFirst({
      where: {
        beam_sn: sn,
      },
    });
    let relatedSn: string | undefined;
    let inputSnType: SnType;
    let relatedSnType: SnType;
    if (beamInfo) {
      const relatedInfo = await this.prisma.mo_tag_shell_info.findFirst({
        where: { camera_sn: sn },
        orderBy: { id: 'desc' },
        select: {
          shell_sn: true,
        },
      });
      relatedSn = relatedInfo?.shell_sn;
      inputSnType = SnType.BEAM;
      relatedSnType = SnType.SHELL;
    } else {
      const relatedInfo = await this.prisma.mo_tag_shell_info.findFirst({
        where: { shell_sn: sn },
        orderBy: { id: 'desc' },
        select: {
          camera_sn: true,
        },
      });
      relatedSn = relatedInfo?.camera_sn;
      inputSnType = SnType.SHELL;
      relatedSnType = SnType.BEAM;
    }

    return [
      {
        name: sn,
        type: inputSnType,
      },
      {
        name: relatedSn,
        type: relatedSnType,
      },
    ];
  }

  async getWorkCodeBysn(sn, snType) {
    let workCode;
    if (snType === SnType.BEAM) {
      const beamInfo = await this.prisma.mo_beam_info.findFirst({
        where: {
          beam_sn: sn,
        },
      });
      workCode = beamInfo?.work_order_code;
    } else {
      const mo_tag_info = await this.prisma.mo_tag_info.findFirst({
        where: {
          tag_sn: sn,
        },
      });
      workCode = mo_tag_info?.work_order_code;
    }

    return workCode;
  }

  async getProcessFlowByWorkOrder(workOrderCode) {
    const orderInfo = await this.prisma.mo_produce_order.findFirst({
      where: {
        work_order_code: workOrderCode,
      },
    });
    return orderInfo?.flow_code;
  }

  async getProcessStepByFlowCode(flowCode) {
    const flowInfo = await this.prisma.mo_process_flow.findMany({
      where: {
        process_code: flowCode,
      },
    });
    return flowInfo;
  }

  async getStepByStepCode(stageCode) {
    const workStage = await this.prisma.mo_workstage.findFirst({
      where: {
        stage_code: stageCode,
      },
    });
    return workStage;
  }

  async checkTableExists(tableName) {
    const model = this.prisma[tableName];

    return model;
  }
  async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${tableName}
        AND COLUMN_NAME = ${columnName};
    `;

    return result.length > 0;
  }

  async checkFieldExists(model, fieldName) {
    const fieldExists = Object.keys(model).includes(fieldName);

    return fieldExists;
  }

  async getProductInfoV2(sn, flowCode_) {
    let data = new Map<string, Array<Map<string, string>>>();
    const sns = await this.getRelatedSerialNumber(sn);
    for (const element of sns) {
      const curSn = element.name;
      if (curSn) {
        let materials = await this.prisma.mo_material_binding.findMany({
          where: {
            camera_sn: curSn,
          },
        });

        data['基础信息'] = data['基础信息'] || {};
        data['物料'] = data['物料'] || {};
        materials.map((row) => {
          const category = row.category
            ? `${row.id}-${row.category}-${row.position}`
            : `${row.id}-没有命名`;
          const categoryValue = row.material_batch_no
            ? row.material_batch_no
            : row.material_serial_no;
          data['物料'][category] = categoryValue;
        });
        const workCode = await this.getWorkCodeBysn(curSn, element.type);
        data['基础信息']['工单'] = workCode;
        if (workCode || flowCode_) {
          const flowCode = flowCode_
            ? flowCode_
            : await this.getProcessFlowByWorkOrder(workCode);
          if (flowCode) {
            const flowInfo = await this.getProcessStepByFlowCode(flowCode);
            for (const element of flowInfo) {
              const workStage = await this.getStepByStepCode(
                element.stage_code,
              );
              const tableName = workStage?.target_table;
              const stepTypeNo = workStage?.step_type_no;
              let stepName = workStage?.stage_name;
              if (stepTypeNo === STEP_NO.CALIB) {
                let sql = `SELECT * FROM mo_calibration WHERE camera_sn = '${curSn}'`;
                const subData: Array<Map<string, string>> =
                  await this.prisma.$queryRawUnsafe(sql);
                const sqlColumns = `
                  SELECT COLUMN_NAME, COLUMN_COMMENT
                  FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mo_calibration'
                  ORDER BY ORDINAL_POSITION
                `;
                const columns: {
                  COLUMN_NAME: string;
                  COLUMN_COMMENT: string;
                }[] = await this.prisma.$queryRawUnsafe(sqlColumns);
                const columnCommentsMap = new Map<string, string>();
                columns.forEach((column) => {
                  columnCommentsMap.set(
                    column.COLUMN_NAME,
                    column.COLUMN_COMMENT || column.COLUMN_NAME,
                  );
                });
                const transformedData = subData.map((row) => {
                  const newRow = {};
                  for (const [key, value] of Object.entries(row)) {
                    const comment = columnCommentsMap.get(key);
                    if (comment) {
                      newRow[comment] = value;
                    } else {
                      newRow[key] = value;
                    }
                  }

                  return newRow;
                });
                data['双目标定'] = data['双目标定'] || [];
                data['双目标定'].push(
                  ...transformedData.map((o) => {
                    o['不良原因'] = o['错误码'] === 0 ? 'SUCCESS' : '失败';
                    return moveFieldsToFront(o);
                  }),
                );
              } else if (tableName) {
                if (!stepName) continue;
                if (!data[stepName]) {
                  data[stepName] = {};
                }
                const model = await this.checkTableExists(tableName);
                if (model) {
                  for (const snField of [
                    'sn',
                    'camera_sn',
                    'CameraSN',
                    'beam_sn',
                  ]) {
                    const fieldExists = await this.hasColumn(
                      tableName,
                      snField,
                    );

                    if (fieldExists) {
                      let sql;
                      if (
                        stepTypeNo &&
                        (await this.hasColumn(
                          tableName,
                          'mo_process_step_production_result_id',
                        ))
                      ) {
                        sql = `SELECT * FROM ${tableName} left join mo_process_step_production_result on ${tableName}.mo_process_step_production_result_id = mo_process_step_production_result.id where ${snField}  = '${curSn}' and (step_type_no = '${stepTypeNo}' or step_type_no is null)`;
                      } else {
                        sql =
                          'SELECT * FROM ' +
                          tableName +
                          ' where ' +
                          snField +
                          " = '" +
                          curSn +
                          "'";
                      }
                      console.log(sql);
                      const subData: Array<Map<string, string>> =
                        await this.prisma.$queryRawUnsafe(sql);
                      const sqlColumns = `
                        SELECT COLUMN_NAME, COLUMN_COMMENT
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'
                        ORDER BY ORDINAL_POSITION
                      `;
                      const columns: {
                        COLUMN_NAME: string;
                        COLUMN_COMMENT: string;
                      }[] = await this.prisma.$queryRawUnsafe(sqlColumns);
                      const columnCommentsMap = new Map<string, string>();
                      columns.forEach((column) => {
                        columnCommentsMap.set(
                          column.COLUMN_NAME,
                          column.COLUMN_COMMENT || column.COLUMN_NAME,
                        );
                      });
                      const transformedData = subData.map((row) => {
                        const newRow = {};
                        for (const [key, value] of Object.entries(row)) {
                          const comment = columnCommentsMap.get(key);
                          if (comment) {
                            newRow[comment] = value;
                          } else {
                            newRow[key] = value;
                          }
                        }
                        return newRow;
                      });
                      if (
                        !Array.isArray(data[stepName]) &&
                        subData.length > 0
                      ) {
                        data[stepName] = [];
                      }
                      if (
                        subData.length > 0 &&
                        'mo_process_step_production_result_id' in subData[0]
                      ) {
                        data[stepName].push(
                          ...(await this.f(
                            tableName,
                            subData,
                            columns,
                            columnCommentsMap,
                          )),
                        );
                      } else if (subData.length > 0) {
                        if (stepTypeNo === STEP_NO.S315FQC) {
                          data[stepName].push(
                            ...transformedData.map((o) => {
                              data['性能测试'].push(
                                ...transformedData.map((o) => {
                                  o['不良原因'] =
                                    o['检测结果'] === 1 ? 'SUCCESS' : '失败';
                                  return moveFieldsToFront(o);
                                }),
                              );
                            }),
                          );
                        } else {
                          data[stepName].push(...transformedData);
                        }
                      }
                    }
                  }
                } else {
                  return {
                    code: 3,
                    msg: `${tableName}表不存在`,
                  };
                }
              }
            }
          } else {
            return {
              code: 2,
              msg: `${workCode}工单没有工艺编号`,
            };
          }
        } else {
        }
      }
    }

    return {
      code: 0,
      msg: '',
      data: JSON.parse(
        JSON.stringify(data, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      ),
    };
  }

  async f(tableName, rows, columns, columnCommentsMap) {
    // 处理查询结果，将 BigInt 转换为字符串
    const processedRows = new Array();
    await Promise.all(
      rows.map(async (item) => {
        let newItem = {};
        // 遍历原始对象的所有键
        for (const key in item) {
          if (item.hasOwnProperty(key)) {
            const res = await this.prisma.table_config.findFirst({
              where: {
                table_name: tableName,
                table_field: key,
              },
              select: {
                position: true,
                stage: true,
              },
            });
            const stages = res?.stage as string[] | undefined;
            const positions = res?.position as string[] | undefined;
            let newKey;
            if (
              item.position != null &&
              positions?.map(String).includes(item.position.toString())
            ) {
              if (
                item.stage &&
                stages?.map(String).includes(item.stage.toString())
              ) {
                newKey = `${item.position}-${item.stage}-${columnCommentsMap.get(key)}`;
              } else {
                newKey = `${item.position}-${columnCommentsMap.get(key)}`;
              }
            } else {
              if (
                item.stage &&
                stages?.map(String).includes(item.stage.toString())
              ) {
                newKey = `-${item.stage}-${columnCommentsMap.get(key)}`;
              } else {
                newKey = `${columnCommentsMap.get(key)}`;
              }
            }
            if (item[key] !== null) {
              item[key] =
                item[key] === -6259853400000000000 ? '异常值' : item[key];
              newItem[newKey] = item[key].toString();
            } else if (!(newKey in newItem)) {
              newItem[newKey] = null;
            }
          }
        }
        console.log(newItem);
        newItem = moveFieldsToFront(newItem);
        processedRows.push(newItem);
      }),
    );

    const mergedRows = {};
    processedRows.forEach((item) => {
      const productionResultId = item['mo_process_step_production_result_id'];
      if (!mergedRows[productionResultId]) {
        mergedRows[productionResultId] = {};
      }

      for (const key in item) {
        if (key !== 'mo_process_step_production_result_id') {
          if (item.hasOwnProperty(key) && item[key] !== null) {
            mergedRows[productionResultId][key] = item[key];
          }
        }
      }
    });

    // 将合并后的对象转换为数组
    const finalRows = Object.values(mergedRows);
    return finalRows;
  }
}

function moveFieldsToFront(obj) {
  const frontColumns = [
    'id',
    '主键ID',
    '横梁SN',
    '横梁序列号',
    'cameraSN',
    'camera_sn',
    '添加时间',
    '工序开始时间',
    '检测时间',
    'TimeStamp',
    '错误代码',
    '错误码',
    '不良原因',
    '工位编号',
    '工位号',
    '站点',
  ];
  // 复制原对象
  const rest = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
  const front = {};
  for (const key of frontColumns) {
    const lowerKey = key.toLowerCase(); // 将键转换为小写
    for (const objKey in obj) {
      if (objKey.toLowerCase() === lowerKey) {
        // 比较时忽略大小写
        front[objKey] = obj[objKey];
        delete rest[objKey]; // 从副本中删除
        break; // 找到匹配的键后退出内层循环
      }
    }
  }
  return { ...front, ...rest };
}
//S315BB14S00120
