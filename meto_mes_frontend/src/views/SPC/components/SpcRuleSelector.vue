<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

const props = defineProps<{
  modelValue: string[];
}>();
const emit = defineEmits(['update:modelValue']);

const internalValue = ref<string[]>([...props.modelValue]);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
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
  <el-select
    v-model="model"
    multiple
    placeholder="选择规则"
    style="min-width: 300px;"
  >
    <el-option
      v-for="r in ruleOptions"
      :key="r.value"
      :label="r.label"
      :value="r.value"
    />
  </el-select>
</template>
