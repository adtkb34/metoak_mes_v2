<template>
  <el-card>
    <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
      <el-button type="primary" @click="openDialog()">新增用户</el-button>
    </div>

    <el-table
      :data="userList"
      max-height="750"
      style="width: 100%"
      @current-change="handleCurrentChange"
    >
      <el-table-column fixed type="index" label="#" width="50" />
      <el-table-column prop="user_name" label="用户名" />
      <el-table-column prop="real_name" label="真实姓名" />
      <el-table-column prop="user_level" label="用户级别" />
      <el-table-column prop="work_code" label="员工号" />
      <el-table-column v-if="getUserAuth().user_level === 1" fixed="right" label="操作" min-width="180">
        <template #default="scope">
          <!-- <el-button link type="primary" size="small" @click="resetPassword(scope.row)">重置密码</el-button> -->
          <el-button link type="success" size="small" @click="openDialog(scope.row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="deleteUser(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="用户信息" width="400px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="form.user_name" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="员工号">
          <el-input v-model="form.work_code" />
        </el-form-item>
        <el-form-item label="用户级别">
          <el-input-number v-model="form.user_level" :min="0" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.user_password" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUserByName,
  resetUserPassword,
} from '@/api/system'
import type { UserInfo } from 'types/system'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { getUserAuth } from '@/utils/auth'

const userList = ref<UserInfo[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const form = ref<Partial<UserInfo & { user_password?: string }>>({})

const fetchUsers = async () => {
  const result = await getUserList()
  if (result) {
    userList.value = result
  }
}

onMounted(fetchUsers)

const handleCurrentChange = (row: UserInfo) => {
  // 可拓展
}

const openDialog = (user?: UserInfo) => {
  dialogVisible.value = true
  isEdit.value = !!user
  form.value = user ? { ...user } : {}
}

const submitForm = async () => {
  if (isEdit.value && form.value.user_name) {
    await updateUser(form.value.user_name, form.value)
    ElMessage.success('更新成功')
  } else {
    if (!form.value.user_name || !form.value.user_password) {
      ElMessage.warning('用户名和密码不能为空')
      return
    }
    await createUser(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  await fetchUsers()
}

const deleteUser = async (user: UserInfo) => {
  ElMessageBox.confirm(`确认删除用户 ${user.user_name}？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteUserByName(user.user_name)
      ElMessage.success('删除成功')
      await fetchUsers()
    })
}

const resetPassword = async (user: UserInfo) => {
  await resetUserPassword(user.user_name)
  ElMessage.success('密码已重置为默认密码')
}

</script>