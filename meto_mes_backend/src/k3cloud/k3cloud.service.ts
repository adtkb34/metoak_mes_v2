// src/k3cloud/k3cloud.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class K3CloudService {
  private readonly logger = new Logger(K3CloudService.name);
  constructor(private readonly prisma: PrismaService) { }

  async queryPrdMO(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      // const scriptPath = path.join(__dirname, '../../script/query_prd_mo.py');

      // const pyProcess = spawn('python3', [scriptPath]);

      const pyProcess = spawn('python', ['script/query_prd_mo.py']);

      let stdout = '';
      let stderr = '';

      pyProcess.on('error', err => {
        console.error('Spawn failed:', err.message);
        // 这里可以返回 500 给前端，而不是让整个进程挂掉
      });

      pyProcess.stderr.on('data', data => {
        console.error('Python stderr:', data.toString());
      });

      pyProcess.stdout.on('data', data => {
        console.log('Python stdout:', data.toString());
      });
      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pyProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}, stderr: ${stderr}`);
          return reject(new Error(`Python error: ${stderr}`));
        }

        try {
          const result = JSON.parse(stdout);
          const fields = [
            'work_order_code',
            'material_name',
            'produce_count',
            'planned_starttime',
            'planned_endtime',
            'material_code',
            'order_state',
            'order_date',
            'description',
          ];

          const dtos = result.map((row: any[]) =>
            Object.fromEntries(
              row.map((v, i) => {
                // 如果字段是 planned_starttime 或 planned_endtime，并且是字符串，且没有以 Z 结尾，就补上
                const key = fields[i];
                if (
                  (key === 'planned_starttime' || key === 'planned_endtime' || key === 'order_date') &&
                  typeof v === 'string' &&
                  !v.endsWith('Z')
                ) {
                  return [key, v + 'Z'];
                }
                if (key === 'order_state') {
                  return [key, parseInt(v, 10)];
                }
                return [key, v];
              }),
            ),
          );

          for (const dto of dtos) {
            const existing = await this.prisma.mo_produce_order.findFirst({
              where: { work_order_code: dto.work_order_code, material_code: dto.material_code },
            });

            if (existing) {
              await this.prisma.mo_produce_order.update({
                where: { id: existing.id }, // 假设你有唯一标识符 `id`
                data: dto,
              });
            } else {
              await this.prisma.mo_produce_order.create({
                data: dto,
              });
            }
          }

          resolve(result);
        } catch (err) {
          this.logger.error(`JSON parse error: ${err.message}, raw stdout: ${stdout}`);
          reject(new Error('Failed to parse Python output'));
        }
      });
    });
  }

  async queryMaterials(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      // const scriptPath = path.join(__dirname, '../../script/query_product_from_order.py');
      // const pyProcess = spawn('python3', [scriptPath]);

      const pyProcess = spawn('python', ['script/query_product_from_order.py']);

      let stdout = '';
      let stderr = '';

      pyProcess.on('error', err => {
        console.error('Spawn failed:', err.message);
        // 这里可以返回 500 给前端，而不是让整个进程挂掉
      });

      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pyProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}, stderr: ${stderr}`);
          return reject(new Error(`Python error: ${stderr}`));
        }

        try {
          const result = JSON.parse(stdout);
          const fields = [
            'material_code',
            'material_name',
          ];

          const dtosMap = new Map<string, any>();

          result.forEach((row: any[]) => {
            const dto = Object.fromEntries(row.map((v, i) => [fields[i], v]));
            const materialCode = dto["material_code"];  // 或 fields[0] 对应的字段
            if (!dtosMap.has(materialCode)) {
              dtosMap.set(materialCode, dto);
            }
          });

          const dtos = Array.from(dtosMap.values());

          resolve(dtos);
        } catch (err) {
          this.logger.error(`JSON parse error: ${err.message}, raw stdout: ${stdout}`);
          reject(new Error('Failed to parse Python output'));
        }
      });
    });
  }

  async queryJianMaterials(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      // const scriptPath = path.join(__dirname, '../../script/query_product_from_jian_order.py');

      // const pyProcess = spawn('python', [scriptPath]);

      const pyProcess = spawn('python', ['script/query_product_from_jian_order.py']);

      let stdout = '';
      let stderr = '';

      pyProcess.on('error', err => {
        console.error('Spawn failed:', err.message);
        // 这里可以返回 500 给前端，而不是让整个进程挂掉
      });

      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pyProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}, stderr: ${stderr}`);
          return reject(new Error(`Python error: ${stderr}`));
        }

        try {
          const result = JSON.parse(stdout);
          const fields = [
            'material_code',
            'material_name',
          ];

          const dtosMap = new Map<string, any>();

          result.forEach((row: any[]) => {
            const dto = Object.fromEntries(row.map((v, i) => [fields[i], v]));
            const materialCode = dto["material_code"];  // 或 fields[0] 对应的字段

            if (!dtosMap.has(materialCode)) {
              dtosMap.set(materialCode, dto);
            }
          });

          const dtos = Array.from(dtosMap.values());
          resolve(dtos);
        } catch (err) {
          this.logger.error(`JSON parse error: ${err.message}, raw stdout: ${stdout}`);
          reject(new Error('Failed to parse Python output'));
        }
      });
    });
  }

  async queryBomItems(productCode: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // 构建 Python 脚本的路径
      // const scriptPath = path.join(__dirname, '../../script/query_bom_items.py');
      // 使用 spawn 启动 Python 进程
      const pyProcess = spawn('python', ['script/query_bom_items.py', productCode]);

      let stdout = '';
      let stderr = '';

      pyProcess.on('error', err => {
        console.error('Spawn failed:', err.message);
        // 这里可以返回 500 给前端，而不是让整个进程挂掉
      });

      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pyProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}, stderr: ${stderr}`);
          return reject(new Error(`Python error: ${stderr}`));
        }

        // try {
        const result = JSON.parse(stdout);
        console.log(result)
        if (result.length === 0) {
          resolve([]);
        } else {
          resolve(await this.queryMaterialLotNos(this.arrayToString(result)));
        }
        // } catch (err) {
        //   this.logger.error(`JSON parse error: ${err.message}, raw stdout: ${stdout}`);
        //   reject(new Error('Failed to parse Python output'));
        // }
      });
    });
  }

  arrayToString(items: string[]): string {
    if (items.length === 0) {
      return "()";
    }
    return `(${items.map(item => `'${item}'`).join(", ")})`;
  }

  async queryMaterialLotNos(materialCodes: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // 构建 Python 脚本的路径
      // const scriptPath = path.join(__dirname, '../../script/query_lot_no.py');
      // 使用 spawn 启动 Python 进程
      const pyProcess = spawn('python', ['script/query_lot_no.py', materialCodes]);

      let stdout = '';
      let stderr = '';

      pyProcess.on('error', err => {
        console.error('Spawn failed:', err.message);
        // 这里可以返回 500 给前端，而不是让整个进程挂掉
      });

      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pyProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}, stderr: ${stderr}`);
          return reject(new Error(`Python error: ${stderr}`));
        }

        try {
          const result = JSON.parse(stdout);

          resolve(result);
        } catch (err) {
          this.logger.error(`JSON parse error: ${err.message}, raw stdout: ${stdout}`);
          reject(new Error('Failed to parse Python output'));
        }
      });
    });
  }
}
