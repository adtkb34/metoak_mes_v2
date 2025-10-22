<script setup lang="ts">
import { ref } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const props = defineProps<{
  chartId: string; // 图表容器 DOM 的 ID
  tableData: number[]; // 数据数组
}>();

const fileName = ref("SPC报表");

const exportPDF = async () => {
  const element = document.getElementById(props.chartId);
  if (!element) return alert("找不到图表区域");

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("landscape", "mm", "a4");

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, pdfHeight);
  pdf.save(`${fileName.value}.pdf`);
};

const exportExcel = () => {
  const worksheet = XLSX.utils.aoa_to_sheet([["序号", "测量值"], ...props.tableData.map((v, i) => [i + 1, v])]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SPC数据");
  XLSX.writeFile(workbook, `${fileName.value}.xlsx`);
};
</script>

<template>
  <div class="export-box">
    <el-input v-model="fileName" size="small" placeholder="请输入文件名" style="width: 200px; margin-right: 10px" />
    <el-button type="primary" size="small" @click="exportPDF">导出 PDF</el-button>
    <el-button type="success" size="small" @click="exportExcel">导出 Excel</el-button>
  </div>
</template>

<style scoped>
.export-box {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
