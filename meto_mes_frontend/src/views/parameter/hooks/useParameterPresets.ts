import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { ParamsContent, ParamsDetail } from "@/api/params";
import {
  type ParameterDetailState,
  type ParameterListItem,
  type ParameterListQuery,
  type ParameterRow,
  type ParameterOption,
  ParameterRelationField,
  ParameterTypeEnum
} from "../types";
import {
  getParameterDetailContent,
  getParameterList
} from "../services/parameter.api";
import type { ParameterFilterContext } from "./useParameterFilters";

enum ParameterPresetMessage {
  TableLoadFailed = "获取参数清单失败",
  DetailFetchFailed = "获取参数集详情失败",
  InvalidDetailId = "参数ID无效"
}

const formatVersionLabel = (
  item: Pick<
    ParameterListItem | ParamsDetail,
    "version" | "versionMajor" | "versionMinor" | "versionPatch"
  >
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
  options.find(item => String(item.value) === String(relationId ?? ""))
    ?.label ??
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
  const detailCache = ref<Record<string, ParameterDetailState>>({});

  const buildRelationId = (): string | number | null =>
    filters.isProjectType.value ? null : (filters.selectedOption.value ?? null);

  const buildListQuery = (): ParameterListQuery => {
    const relationId = buildRelationId();
    if (filters.selectedType.value === ParameterTypeEnum.Craft) {
      return {
        type: filters.selectedType.value,
        [ParameterRelationField.FlowNo]: relationId
      };
    }
    if (filters.selectedType.value === ParameterTypeEnum.WorkOrder) {
      return {
        type: filters.selectedType.value,
        [ParameterRelationField.OrderId]: relationId
      };
    }
    if (filters.selectedType.value === ParameterTypeEnum.Process) {
      return {
        type: filters.selectedType.value,
        [ParameterRelationField.StepTypeNo]: relationId
      };
    }
    return {
      type: filters.selectedType.value
    };
  };

  const resolveRelationName = (item: ParameterListItem): string => {
    if (item.relation) return item.relation;
    const relationId =
      item.relationId ??
      (filters.isProjectType.value ? null : buildRelationId());
    return findRelationName(filters.parameterOptions.value, relationId);
  };

  const buildRow = (item: ParameterListItem): ParameterRow => ({
    id: item.id,
    baseId: item.baseId,
    detailId: item.detailId,
    paramsId: item.paramsId ?? item.id,
    type: filters.selectedType.value,
    relationId:
      item.relationId ??
      (filters.isProjectType.value ? null : buildRelationId()),
    relationName: resolveRelationName(item),
    name: item.name,
    description: item.description ?? "",
    versionLabel: formatVersionLabel(item),
    createdBy: item.createdBy ?? item.username ?? "",
    createdAt: item.createdAt ?? item.createTime ?? ""
  });

  const reloadTable = async () => {
    tableLoading.value = true;
    try {
      const query = buildListQuery();
      const list = await getParameterList(query);
      tableData.value = list.map(item => buildRow(item));
    } catch (error) {
      ElMessage.error(
        (error as Error)?.message ?? ParameterPresetMessage.TableLoadFailed
      );
    } finally {
      tableLoading.value = false;
    }
  };

  const fetchDetail = async (
    row: ParameterRow
  ): Promise<ParameterDetailState | null> => {
    console.log(row)
    const cacheKey =
      row.id !== undefined && row.id !== null ? String(row.id) : null;
    if (cacheKey && detailCache.value[cacheKey]) {
      return detailCache.value[cacheKey];
    }
    const detailId =  Number(row.detailId);
    let paramsContent: ParamsContent = {};
    if (detailId !== null && !Number.isNaN(detailId)) {
      try {
        const detail = await getParameterDetailContent(detailId);
        paramsContent = normalizeParamsContent(detail?.params);
      } catch (error) {
        ElMessage.error(
          (error as Error)?.message ?? ParameterPresetMessage.DetailFetchFailed
        );
      }
    } else if (cacheKey) {
      ElMessage.error(ParameterPresetMessage.InvalidDetailId);
    }

    const versionSource: ParameterListItem = {
      name: row.name,
      version: row.versionLabel
    };
    const merged: ParameterDetailState = {
      ...row,
      relationName:
        row.relationName ||
        findRelationName(filters.parameterOptions.value, row.relationId),
      name: row.name,
      description: row.description,
      versionLabel: row.versionLabel || formatVersionLabel(versionSource),
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      content: paramsContent
    };

    if (cacheKey) {
      detailCache.value[cacheKey] = merged;
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
      option: filters.selectedOption.value
    }),
    () => {
      reloadTable();
    },
    {
      immediate: true
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
