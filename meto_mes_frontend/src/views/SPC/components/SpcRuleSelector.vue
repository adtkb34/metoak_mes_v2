<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

// 接收父组件传入的 modelValue
const props = defineProps<{
  modelValue: string[];
}>();

// 发出更新事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

// 本地响应式值，用于维护选中状态
const internalValue = ref<string[]>([]);

// 当外部传入的值变化时，同步更新内部
watch(
  () => props.modelValue,
  (val) => {
    if (JSON.stringify(val) !== JSON.stringify(internalValue.value)) {
      internalValue.value = val ? [...val] : [];
    }
  },
  { immediate: true }
);

// 当内部值变化时，通知父组件更新
watch(internalValue, (val) => {
  emit('update:modelValue', val);
});

const ruleOptions = [
  { label: '1点超 USL/LSL', value: 'rule_1' },
  { label: '连续6点上升/下降', value: 'rule_2' },
  { label: '连续9点在均值一侧', value: 'rule_3' },
  { label: '连续14点交替升降', value: 'rule_4' },
  { label: '连续2点中有1点超±2σ', value: 'rule_5' },
  { label: '连续3点中2点超±1σ', value: 'rule_6' },
  { label: '连续15点落在±1σ以内', value: 'rule_7' },
  { label: '连续8点落在±1σ以外', value: 'rule_8' },
];
</script>

<template>
  <el-select v-model="internalValue" multiple placeholder="选择规则" style="min-width: 320px;">
    <el-option v-for="r in ruleOptions" :key="r.value" :label="r.label" :value="r.value" />
  </el-select>
</template>
