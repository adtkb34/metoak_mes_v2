<template>
  <el-upload :show-file-list="false" :before-upload="handleFile" accept=".xlsx, .xls">
    <el-button type="primary">上传 Excel</el-button>
  </el-upload>
</template>

<script setup lang="ts">
import * as XLSX from "xlsx";
import { ElMessage } from "element-plus";

const emit = defineEmits<{
  (e: "update:data", value: number[][]): void;
}>();

function handleFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as (string | number)[][];

      // 转换为 number[][]，非数字的 cell 设置为 null
      const numericRows: (number | null)[][] = rawRows.map(row =>
        row.map(cell => {
          const num = Number(cell);
          return isNaN(num) ? null : num;
        })
      );

      const validValues = numericRows.flat().filter(v => typeof v === 'number');
      if (validValues.length === 0) {
        ElMessage.warning("未能识别任何数值");
      } else {
        // 类型改为二维 emit
        emit("update:data", numericRows as number[][]); // 若你改了 emit 类型声明
      }
    } catch (err) {
      console.error(err);
      ElMessage.error("解析 Excel 文件失败");
    }
  };
  reader.readAsArrayBuffer(file);
  return false;
}
</script>
