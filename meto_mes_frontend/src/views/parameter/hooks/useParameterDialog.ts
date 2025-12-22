import { computed, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { updateParamsPreset, type ParamsPresetPayload } from "@/api/params";
import { useUserListStore } from "@/store/modules/system";
import { store } from "@/store";
import {
  PARAMETER_TYPE_LABELS,
  PARAMETER_TYPE_OPTIONS,
  ParameterDialogMode,
  ParameterRelationField,
  ParameterTypeEnum,
  type ParameterDialogDefaults,
  type ParameterDetailState,
  type ParameterFormState,
  type ParameterOption,
  type ParameterRow,
  type ParameterTypeOption
} from "../types";
import {
  createParameterBase,
  createParameterDetail,
  type CreateParameterBasePayload,
  type CreateParameterDetailPayload
} from "../services/parameter.api";
import { useParameterOptionsLoader } from "./useParameterOptionsLoader";

enum ParameterDialogMessage {
  JsonInvalid = "内容需为合法 JSON",
  CreateSuccess = "新增参数集成功",
  UpdateSuccess = "更新参数集成功",
  CreateFailed = "新增参数集失败",
  UpdateFailed = "更新参数集失败"
}

enum ParameterDialogValidationMessage {
  NameRequired = "名称不能为空",
  DescriptionRequired = "描述不能为空",
  ContentRequired = "内容不能为空",
  TypeRequired = "参数集类型不能为空",
  RelationRequired = "关联项不能为空"
}

interface UseParameterDialogOptions {
  fetchDetail: (row: ParameterRow) => Promise<ParameterDetailState | null>;
  onSuccess: () => Promise<void>;
  getDefaultSelection?: () => ParameterDialogDefaults | null;
}

interface RelationPreset {
  relationId: string | number | null;
  relationName?: string;
  relationOptions?: ParameterOption[];
}

export interface ParameterDialogContext {
  dialogVisible: ReturnType<typeof ref<boolean>>;
  dialogMode: ReturnType<typeof ref<ParameterDialogMode>>;
  formRef: ReturnType<typeof ref<FormInstance | undefined>>;
  formState: ReturnType<typeof ref<ParameterFormState>>;
  formRules: FormRules<ParameterFormState>;
  typeOptions: ParameterTypeOption[];
  relationOptions: ReturnType<typeof ref<ParameterOption[]>>;
  relationLoading: ReturnType<typeof ref<boolean>>;
  relationLabel: ReturnType<typeof computed<string>>;
  relationPlaceholder: ReturnType<typeof computed<string>>;
  nameDisabled: ReturnType<typeof computed<boolean>>;
  typeDisabled: ReturnType<typeof computed<boolean>>;
  relationDisabled: ReturnType<typeof computed<boolean>>;
  updateFormState: (state: ParameterFormState) => void;
  openCreateDialog: () => Promise<void>;
  openEditDialog: (row: ParameterRow) => Promise<void>;
  submitDialog: () => Promise<void>;
  closeDialog: () => void;
}

const buildUpdatePayload = (
  form: ParameterFormState,
  username: string
): ParamsPresetPayload => ({
  name: form.name,
  description: form.description,
  params: form.content,
  username
});

const buildBasePayload = (
  form: ParameterFormState,
  createdBy: string
): CreateParameterBasePayload => {
  const relationId = form.relationId ?? null;
  return {
    name: form.name,
    type: form.type,
    createdBy,
    [ParameterRelationField.FlowNo]:
      form.type === ParameterTypeEnum.Craft ? relationId : null,
    [ParameterRelationField.OrderId]:
      form.type === ParameterTypeEnum.WorkOrder ? relationId : null,
    [ParameterRelationField.StepTypeNo]:
      form.type === ParameterTypeEnum.Process ? relationId : null
  };
};

const buildDetailPayload = (
  baseId: number | string,
  form: ParameterFormState,
  normalizedContent: string
): CreateParameterDetailPayload => ({
  baseId,
  description: form.description,
  params: normalizedContent
});

const createRelationPreset = (
  defaults: ParameterDialogDefaults | null | undefined
): RelationPreset | null =>
  defaults
    ? {
        relationId: defaults.relationId,
        relationName: defaults.relationName,
        relationOptions: defaults.relationOptions
      }
    : null;

export function useParameterDialog(
  options: UseParameterDialogOptions
): ParameterDialogContext {
  const { loadOptions } = useParameterOptionsLoader();
  const dialogVisible = ref(false);
  const dialogMode = ref<ParameterDialogMode>(ParameterDialogMode.Create);
  const formRef = ref<FormInstance>();
  const formState = ref<ParameterFormState>({
    name: "",
    description: "",
    content: "{}",
    type: ParameterTypeEnum.Process,
    relationId: null
  });
  const relationOptions = ref<ParameterOption[]>([]);
  const relationLoading = ref(false);
  const editingId = ref<number | null>(null);
  const userStore = useUserListStore(store);
  const typeOptions = PARAMETER_TYPE_OPTIONS;
  const pendingRelation = ref<RelationPreset | null>(null);
  const shouldSkipTypeWatcher = ref(false);

  const isProjectType = computed(
    () => formState.value.type === ParameterTypeEnum.Project
  );

  const relationLabel = computed(
    () => PARAMETER_TYPE_LABELS[formState.value.type] ?? "关联项"
  );
  const relationPlaceholder = computed(() => `请选择${relationLabel.value}`);

  const formRules: FormRules<ParameterFormState> = {
    name: [
      {
        required: true,
        message: ParameterDialogValidationMessage.NameRequired,
        trigger: "blur"
      }
    ],
    description: [
      {
        required: true,
        message: ParameterDialogValidationMessage.DescriptionRequired,
        trigger: "blur"
      }
    ],
    content: [
      {
        required: true,
        message: ParameterDialogValidationMessage.ContentRequired,
        trigger: "blur"
      }
    ],
    type: [
      {
        required: true,
        message: ParameterDialogValidationMessage.TypeRequired,
        trigger: "change"
      }
    ],
    relationId: [
      {
        validator: (_, value, callback) => {
          if (isProjectType.value) {
            callback();
            return;
          }
          if (value === null || value === undefined || value === "") {
            callback(
              new Error(ParameterDialogValidationMessage.RelationRequired)
            );
            return;
          }
          callback();
        },
        trigger: "change"
      }
    ]
  };

  const nameDisabled = computed(
    () => dialogMode.value === ParameterDialogMode.Edit
  );
  const typeDisabled = computed(
    () => dialogMode.value === ParameterDialogMode.Edit
  );
  const relationDisabled = computed(
    () => typeDisabled.value || isProjectType.value
  );

  const resetFormState = (defaults?: ParameterDialogDefaults | null) => {
    formState.value = {
      name: "",
      description: "",
      content: "{}",
      type: defaults?.type ?? ParameterTypeEnum.Process,
      relationId: defaults?.relationId ?? null
    };
  };

  const refreshRelationOptions = async (type: ParameterTypeEnum) => {
    if (isProjectType.value) {
      relationLoading.value = false;
      relationOptions.value = [];
      formState.value.relationId = null;
      return;
    }
    relationLoading.value = true;
    const preset = pendingRelation.value;
    pendingRelation.value = null;
    const presetOptions =
      preset?.relationOptions && preset.relationOptions.length > 0
        ? preset.relationOptions
        : null;
    const fetchedOptions = presetOptions ?? (await loadOptions(type));
    const normalizedOptions = [...fetchedOptions];
    if (
      preset?.relationId !== null &&
      preset?.relationId !== undefined &&
      !normalizedOptions.some(
        option => String(option.value) === String(preset.relationId)
      )
    ) {
      normalizedOptions.push({
        label: preset?.relationName ?? relationLabel.value,
        value: preset.relationId
      });
    }
    relationOptions.value = normalizedOptions;
    formState.value.relationId =
      preset?.relationId !== undefined && preset?.relationId !== null
        ? preset.relationId
        : null;
    relationLoading.value = false;
  };

  const applyDefaults = async () => {
    const defaults = options.getDefaultSelection?.() ?? null;
    resetFormState(defaults);
    pendingRelation.value = createRelationPreset(defaults);
    await refreshRelationOptions(formState.value.type);
    formRef.value?.clearValidate();
  };

  const openCreateDialog = async () => {
    dialogMode.value = ParameterDialogMode.Create;
    editingId.value = null;
    shouldSkipTypeWatcher.value = true;
    await applyDefaults();
    shouldSkipTypeWatcher.value = false;
    dialogVisible.value = true;
  };

  const openEditDialog = async (row: ParameterRow) => {
    dialogMode.value = ParameterDialogMode.Edit;
    editingId.value = row.id ?? null;
    shouldSkipTypeWatcher.value = true;
    const detail = await options.fetchDetail(row);
    const relationId = detail?.relationId ?? row.relationId ?? null;
    const relationName = detail?.relationName ?? row.relationName;
    formState.value = {
      name: detail?.name ?? row.name,
      description: detail?.description ?? "",
      content: JSON.stringify(detail?.content ?? {}, null, 2),
      type: detail?.type ?? row.type,
      relationId
    };
    pendingRelation.value = {
      relationId,
      relationName
    };
    await refreshRelationOptions(formState.value.type);
    shouldSkipTypeWatcher.value = false;
    formRef.value?.clearValidate();
    dialogVisible.value = true;
  };

  const closeDialog = () => {
    dialogVisible.value = false;
  };

  const updateFormState = (state: ParameterFormState) => {
    formState.value = state;
  };

  const normalizeContent = (raw: string): string | null => {
    try {
      const parsedContent = JSON.parse(raw || "{}");
      return JSON.stringify(parsedContent);
    } catch {
      ElMessage.error(ParameterDialogMessage.JsonInvalid);
      return null;
    }
  };

  const submitDialog = async () => {
    const form = formRef.value;
    if (!form) return;
    const isValid = await form.validate().catch(() => false);
    if (!isValid) return;

    const normalizedContent = normalizeContent(formState.value.content);
    if (!normalizedContent) return;

    const currentUsername = userStore.getUsername ?? "";
    try {
      if (dialogMode.value === ParameterDialogMode.Edit && editingId.value) {
        const payload = buildUpdatePayload(
          { ...formState.value, content: normalizedContent },
          currentUsername
        );
        await updateParamsPreset(editingId.value, payload);
        ElMessage.success(ParameterDialogMessage.UpdateSuccess);
      } else {
        const basePayload = buildBasePayload(
          formState.value,
          currentUsername
        );
        const baseId = await createParameterBase(basePayload);
        const detailPayload = buildDetailPayload(
          baseId,
          formState.value,
          normalizedContent
        );
        await createParameterDetail(detailPayload);
        ElMessage.success(ParameterDialogMessage.CreateSuccess);
      }
      closeDialog();
      await options.onSuccess();
    } catch (error) {
      ElMessage.error(
        (error as Error)?.message ||
          (dialogMode.value === ParameterDialogMode.Edit
            ? ParameterDialogMessage.UpdateFailed
            : ParameterDialogMessage.CreateFailed)
      );
    }
  };

  watch(
    () => formState.value.type,
    async value => {
      if (shouldSkipTypeWatcher.value) return;
      pendingRelation.value = null;
      await refreshRelationOptions(value);
    }
  );

  return {
    dialogVisible,
    dialogMode,
    formRef,
    formState,
    formRules,
    typeOptions,
    relationOptions,
    relationLoading,
    relationLabel,
    relationPlaceholder,
    nameDisabled,
    typeDisabled,
    relationDisabled,
    updateFormState,
    openCreateDialog,
    openEditDialog,
    submitDialog,
    closeDialog
  };
}
