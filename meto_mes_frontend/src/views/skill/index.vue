<template>
  <el-card class="m-3">

    <el-tabs v-model="activeTab">
      <!-- 技能培训模块 -->
      <el-tab-pane label="技能培训管理" name="skills">
        <el-card>
          <div class="toolbar">
            <el-button type="primary" @click="openSkillDialog()">新增技能</el-button>
          </div>
          <el-table :data="skills" style="width: 100%" border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="技能名称" />
            <el-table-column prop="level" label="等级" />
            <el-table-column prop="employees" label="绑定人员">
              <template #default="scope">
                <el-tag v-for="emp in scope.row.employees" :key="emp" class="mr-1">{{ emp }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button size="small" type="primary" @click="openSkillDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteSkill(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 出勤管理模块 -->
      <el-tab-pane label="出勤管理" name="attendance">
        <el-card>
          <el-table :data="attendance" style="width: 100%" border>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="checkIn" label="上班时间" width="120" />
            <el-table-column prop="checkOut" label="下班时间" width="120" />
            <el-table-column prop="hours" label="总时长 (小时)" />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

  </el-card>
  <!-- 技能编辑弹窗 -->
  <el-dialog v-model="skillDialogVisible" title="技能信息" width="500px">
    <el-form :model="form" label-width="80px">
      <el-form-item label="技能名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="等级">
        <el-select v-model="form.level" placeholder="请选择">
          <el-option label="初级" value="初级" />
          <el-option label="中级" value="中级" />
          <el-option label="高级" value="高级" />
        </el-select>
      </el-form-item>
      <el-form-item label="绑定人员">
        <el-select v-model="form.employees" multiple placeholder="选择人员">
          <el-option v-for="emp in employees" :key="emp" :label="emp" :value="emp" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="skillDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveSkill">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue"

// tabs 切换
const activeTab = ref("skills")

// mock 员工
const employees = ["AAA"]

// mock 技能数据
const skills = ref([
  { id: 1, name: "锁附", level: "初级", employees: ["AAA"] },
  { id: 2, name: "点胶", level: "中级", employees: [] }
])

// mock 出勤数据
const attendance = ref([
  { date: "2025-09-01", name: "aaa", checkIn: "09:00", checkOut: "18:00", hours: 9 },
  { date: "2025-09-01", name: "bbb", checkIn: "08:45", checkOut: "17:30", hours: 8.75 },
  { date: "2025-09-01", name: "ccc", checkIn: "09:15", checkOut: "18:30", hours: 9.25 }
])

// 弹窗状态
const skillDialogVisible = ref(false)
const form = reactive({
  id: null as number | null,
  name: "",
  level: "",
  employees: [] as string[]
})

// 打开弹窗
function openSkillDialog(skill?: any) {
  if (skill) {
    Object.assign(form, skill)
  } else {
    form.id = null
    form.name = ""
    form.level = ""
    form.employees = []
  }
  skillDialogVisible.value = true
}

// 保存技能
function saveSkill() {
  if (form.id) {
    // 更新
    const index = skills.value.findIndex(s => s.id === form.id)
    if (index !== -1) skills.value[index] = { ...form }
  } else {
    // 新增
    form.id = Date.now()
    skills.value.push({ ...form })
  }
  skillDialogVisible.value = false
}

// 删除技能
function deleteSkill(id: number) {
  skills.value = skills.value.filter(s => s.id !== id)
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 10px;
}

.mr-1 {
  margin-right: 5px;
}
</style>
