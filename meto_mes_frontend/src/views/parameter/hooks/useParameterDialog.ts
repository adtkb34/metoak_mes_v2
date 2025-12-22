import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  createParamsPreset,
  updateParamsPreset,
  type ParamsPresetPayload
} from "@/api/params";
import { useUserListStore } from "@/store/modules/system";
import { store } from "@/store";
import {
  ParameterDialogMode,
  type ParameterDetailState,
  type ParameterRow
} from "../types";
interface ParameterFormState {
  name: string;
  description: string;
  content: string;
}
interface UseParameterDialogOptions {
  fetchDetail: (row: ParameterRow) => Promise<ParameterDetailState | null>;
  onSuccess: () => Promise<void>;
}
export interface ParameterDialogContext {
  dialogVisible: ReturnType<typeof ref<boolean>>;
  dialogMode: ReturnType<typeof ref<ParameterDialogMode>>;
  formRef: ReturnType<typeof ref<FormInstance | undefined>>;
  formState: ReturnType<typeof ref<ParameterFormState>>;
  formRules: FormRules<ParameterFormState>;
  nameDisabled: ReturnType<typeof computed<boolean>>;
  openCreateDialog: () => void;
  openEditDialog: (row: ParameterRow) => Promise<void>;
  submitDialog: () => Promise<void>;
  closeDialog: () => void;
}
const buildPayload = (
  form: ParameterFormState,
  username: string
): ParamsPresetPayload => ({
  name: form.name,
  description: form.description,
  params: form.content,
  username
});
export function useParameterDialog(
  options: UseParameterDialogOptions
): ParameterDialogContext {
  const dialogVisible = ref(false);
  const dialogMode = ref<ParameterDialogMode>(ParameterDialogMode.Create);
  const formRef = ref<FormInstance>();
  const formState = ref<ParameterFormState>({
    name: "",
    description: "",
    content: "{}"
  });
  const editingId = ref<number | null>(null);
  const userStore = useUserListStore(store);
  const formRules: FormRules<ParameterFormState> = {
    name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
    content: [{ required: true, message: "内容不能为空", trigger: "blur" }]
  };
  const nameDisabled = computed(
    () => dialogMode.value === ParameterDialogMode.Edit
  );
  const resetForm = () => {
    formState.value = { name: "", description: "", content: "{}" };
    formRef.value?.clearValidate();
  };
  const openCreateDialog = () => {
    dialogMode.value = ParameterDialogMode.Create;
    editingId.value = null;
    resetForm();
    dialogVisible.value = true;
  };
  const openEditDialog = async (row: ParameterRow) => {
    dialogMode.value = ParameterDialogMode.Edit;
    editingId.value = row.id ?? null;
    const detail = await options.fetchDetail(row);
    formState.value = {
      name: detail?.name ?? row.name,
      description: detail?.description ?? "",
      content: JSON.stringify(detail?.content ?? {}, null, 2)
    };
    dialogVisible.value = true;
  };
  const closeDialog = () => {
    dialogVisible.value = false;
  };
  const submitDialog = async () => {
    const form = formRef.value;
    if (!form) return;
    const isValid = await form.validate().catch(() => false);
    if (!isValid) return;

    let normalizedContent = "{}";
    try {
      const parsedContent = JSON.parse(formState.value.content || "{}");
      normalizedContent = JSON.stringify(parsedContent);
    } catch {
      ElMessage.error("内容需为合法 JSON");
      return;
    }

    const payload = buildPayload(
      { ...formState.value, content: normalizedContent },
      userStore.getUsername || ""
    );

    try {
      if (dialogMode.value === ParameterDialogMode.Edit && editingId.value) {
        await updateParamsPreset(editingId.value, payload);
        ElMessage.success("更新参数集成功");
      } else {
        await createParamsPreset(payload);
        ElMessage.success("新增参数集成功");
      }
      closeDialog();
      await options.onSuccess();
    } catch (error) {
      ElMessage.error(
        (error as Error)?.message ||
          (dialogMode.value === ParameterDialogMode.Edit
            ? "更新参数集失败"
            : "新增参数集失败")
      );
    }
  };
  return {
    dialogVisible,
    dialogMode,
    formRef,
    formState,
    formRules,
    nameDisabled,
    openCreateDialog,
    openEditDialog,
    submitDialog,
    closeDialog
  };
}
