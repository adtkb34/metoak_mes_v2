import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getParamsDetail,
  getParamsVersionList,
  type ParamsContent,
  type ParamsDetail
} from "@/api/params";
import {
  type ParameterDetailResponse,
  type ParameterDetailState,
  type ParameterRow,
  type ParameterVersionResponse,
  type ParameterOption,
  ParameterTypeEnum
} from "../types";
import type { ParameterFilterContext } from "./useParameterFilters";

const formatVersionLabel = (
  item: Pick<ParameterVersionResponse | ParamsDetail, "version" | "versionMajor" | "versionMinor" | "versionPatch">
): string => {
  if (item.version) return item.version;
  const hasMajor =
    item.versionMajor !== undefined ||
    item.versionMinor !== undefined ||
    item.versionPatch !== undefined;
  if (hasMajor) {
    const major = item.versionMajor ?? 0;
    const minor = item.versionMinor ?? 0;
    const patch = item.versionPatch ?? 0;
    return `${major}.${minor}.${patch}`;
  }
  return "";
};

const normalizeParamsContent = (
  raw: ParamsContent | string | null | undefined
): ParamsContent => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsedValue = JSON.parse(raw);
      if (typeof parsedValue === "object" && parsedValue !== null) {
        return Array.isArray(parsedValue) ? {} : (parsedValue as ParamsContent);
      }
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ParamsContent;
  }
  return {};
};

const findRelationName = (
  options: ParameterOption[],
  relationId: string | number | null | undefined
) =>
  options.find(item => item.value === relationId)?.label ??
  options.find(item => String(item.value) === String(relationId ?? ""))?.label ??
  "";

export interface ParameterPresetsContext {
  tableLoading: ReturnType<typeof ref<boolean>>;
  tableData: ReturnType<typeof ref<ParameterRow[]>>;
  detailDialogVisible: ReturnType<typeof ref<boolean>>;
  detailLoading: ReturnType<typeof ref<boolean>>;
  activeDetail: ReturnType<typeof ref<ParameterDetailState | null>>;
  reloadTable: () => Promise<void>;
  openDetail: (row: ParameterRow) => Promise<void>;
  fetchDetail: (row: ParameterRow) => Promise<ParameterDetailState | null>;
}

export function useParameterPresets(
  filters: ParameterFilterContext
): ParameterPresetsContext {
  const tableLoading = ref(false);
  const tableData = ref<ParameterRow[]>([]);
  const detailDialogVisible = ref(false);
  const detailLoading = ref(false);
  const activeDetail = ref<ParameterDetailState | null>(null);
  const detailCache = ref<Record<number, ParameterDetailState>>({});

  const shouldLoadTable = computed(
    () =>
      filters.isProjectType.value ||
      (filters.selectedOption.value !== null && filters.selectedOption.value !== undefined)
  );

  const buildRow = (
    nameOption: ParameterOption,
    version: ParameterVersionResponse,
    relationName: string
  ): ParameterRow => ({
    id: version.id,
    paramsId: nameOption.value,
    type: filters.selectedType.value,
    relationId: filters.selectedOption.value,
    relationName,
    name: nameOption.label,
    description: version.description ?? "",
    versionLabel: formatVersionLabel(version),
    createdBy: version.username ?? "",
    createdAt: version.createdAt ?? version.createTime ?? ""
  });

  const reloadTable = async () => {
    if (!shouldLoadTable.value) {
      tableData.value = [];
      return;
    }
    tableLoading.value = true;
    try {
      const relationName = findRelationName(
        filters.parameterOptions.value,
        filters.selectedOption.value
      );
      const rows: ParameterRow[] = [];
      for (const nameOption of filters.parameterNameOptions.value) {
        const versions = await getParamsVersionList({
          type: filters.selectedType.value,
          relationId:
            filters.selectedType.value === ParameterTypeEnum.Project
              ? undefined
              : filters.selectedOption.value,
          paramsId: nameOption.value
        });
        versions.forEach(version => {
          rows.push(buildRow(nameOption, version, relationName));
        });
      }
      tableData.value = rows;
    } catch (error) {
      ElMessage.error((error as Error)?.message || "获取参数版本失败");
    } finally {
      tableLoading.value = false;
    }
  };

  const fetchDetail = async (
    row: ParameterRow
  ): Promise<ParameterDetailState | null> => {
    if (row.id && detailCache.value[row.id]) {
      return detailCache.value[row.id];
    }
    let detail: ParameterDetailResponse | null = null;
    if (row.id) {
      try {
        detail = await getParamsDetail(row.id);
      } catch (error) {
        ElMessage.error((error as Error)?.message || "获取参数集详情失败");
      }
    }

    const paramsContent = normalizeParamsContent(detail?.params);
    const versionSource: ParameterVersionResponse = detail ?? {
      version: row.versionLabel
    };
    const merged: ParameterDetailState = {
      ...row,
      relationName:
        row.relationName ||
        findRelationName(filters.parameterOptions.value, row.relationId),
      name: detail?.name ?? row.name,
      description: detail?.description ?? row.description,
      versionLabel: row.versionLabel || formatVersionLabel(versionSource),
      createdBy: row.createdBy ?? detail?.username,
      createdAt: row.createdAt ?? detail?.createdAt ?? detail?.createTime,
      content: paramsContent
    };

    if (row.id) {
      detailCache.value[row.id] = merged;
    }
    return merged;
  };

  const openDetail = async (row: ParameterRow) => {
    detailDialogVisible.value = true;
    detailLoading.value = true;
    activeDetail.value = await fetchDetail(row);
    detailLoading.value = false;
  };

  watch(
    () => ({
      type: filters.selectedType.value,
      option: filters.selectedOption.value,
      names: filters.parameterNameOptions.value.map(item => item.value)
    }),
    () => {
      reloadTable();
    }
  );

  return {
    tableLoading,
    tableData,
    detailDialogVisible,
    detailLoading,
    activeDetail,
    reloadTable,
    openDetail,
    fetchDetail
  };
}
