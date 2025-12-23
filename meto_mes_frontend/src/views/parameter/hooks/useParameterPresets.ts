import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { ParamsContent, ParamsDetail } from "@/api/params";
import {
  type ParameterDetailContent,
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

const normalizeRelationValue = (
  value?: string | number | null
): string | number | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
};

const resolveRelationIdByType = (
  type: ParameterTypeEnum,
  source: {
    flowNo?: string | number | null;
    orderId?: string | number | null;
    stepTypeNo?: string | number | null;
    relationId?: string | number | null;
  }
): string | number | null => {
  if (type === ParameterTypeEnum.Craft) {
    return normalizeRelationValue(source.flowNo);
  }
  if (type === ParameterTypeEnum.WorkOrder) {
    return normalizeRelationValue(source.orderId);
  }
  if (type === ParameterTypeEnum.Process) {
    return normalizeRelationValue(source.stepTypeNo);
  }
  return normalizeRelationValue(source.relationId);
};

const resolveBaseId = (item: ParameterListItem): string | number | null => {
  const candidates = [item.baseId, item.paramsId, item.id, item.detailId];
  const matched = candidates.find(
    candidate =>
      candidate !== undefined && candidate !== null && candidate !== ""
  );
  return matched ?? null;
};

const resolveDetailId = (item: ParameterListItem): string | number | null => {
  const candidates = [item.detailId, item.id, item.paramsId];
  const matched = candidates.find(
    candidate =>
      candidate !== undefined && candidate !== null && candidate !== ""
  );
  return matched ?? null;
};

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
    filters.selectedOption.value ?? null;

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
    if (filters.selectedType.value === ParameterTypeEnum.Project) {
      return {
        type: filters.selectedType.value,
        [ParameterRelationField.Name]:
          relationId !== null && relationId !== undefined
            ? String(relationId)
            : undefined
      };
    }
    return {
      type: filters.selectedType.value,
      [ParameterRelationField.Name]:
        relationId !== null && relationId !== undefined
          ? String(relationId)
          : undefined
    };
  };

  const resolveRelationName = (
    item: ParameterListItem,
    relationId: string | number | null
  ): string =>
    item.relation ||
    findRelationName(filters.parameterOptions.value, relationId) ||
    findRelationName(filters.parameterOptions.value, buildRelationId());

  const buildRow = (item: ParameterListItem): ParameterRow => {
    const relationId = resolveRelationIdByType(filters.selectedType.value, {
      flowNo: item.flowNo,
      orderId: item.orderId,
      stepTypeNo: item.stepTypeNo,
      relationId: item.relationId ?? item.relation ?? item.name
    });
    const baseId = resolveBaseId(item);
    const detailId = resolveDetailId(item);
    return {
      id: item.id ?? baseId ?? detailId ?? item.paramsId,
      baseId,
      detailId,
      paramsId: item.paramsId ?? item.id,
      type: filters.selectedType.value,
      flowNo: item.flowNo ?? null,
      orderId: item.orderId ?? null,
      stepTypeNo: item.stepTypeNo ?? null,
      relationId: relationId ?? buildRelationId(),
      relationName: resolveRelationName(item, relationId),
      name: item.name,
      description: item.description ?? "",
      versionLabel: formatVersionLabel(item),
      createdBy: item.createdBy ?? item.username ?? "",
      createdAt: item.createdAt ?? item.createTime ?? ""
    };
  };

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
    const cacheKey =
      row.id !== undefined && row.id !== null ? String(row.id) : null;
    if (cacheKey && detailCache.value[cacheKey]) {
      return detailCache.value[cacheKey];
    }
    const detailIdentifier =
      row.detailId ?? row.id ?? row.paramsId ?? row.baseId ?? null;
    let paramsContent: ParamsContent = {};
    let detailData: ParameterDetailContent | null = null;
    if (detailIdentifier !== null && detailIdentifier !== undefined) {
      try {
        const detail = await getParameterDetailContent(detailIdentifier);
        paramsContent = normalizeParamsContent(detail?.params);
        detailData = detail;
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
    const relationId = resolveRelationIdByType(row.type, {
      flowNo: detailData?.flowNo ?? row.flowNo ?? row.relationId,
      orderId: detailData?.orderId ?? row.orderId ?? row.relationId,
      stepTypeNo: detailData?.stepTypeNo ?? row.stepTypeNo ?? row.relationId,
      relationId: detailData?.relationId ?? row.relationId
    });
    const resolvedBaseId =
      detailData?.baseId ?? row.baseId ?? row.paramsId ?? row.id ?? null;
    const resolvedDetailId =
      detailData?.detailId ?? detailData?.id ?? row.detailId ?? row.id ?? null;

    const merged: ParameterDetailState = {
      ...row,
      ...detailData,
      baseId: resolvedBaseId ?? undefined,
      detailId: resolvedDetailId ?? undefined,
      flowNo: detailData?.flowNo ?? row.flowNo ?? null,
      orderId: detailData?.orderId ?? row.orderId ?? null,
      stepTypeNo: detailData?.stepTypeNo ?? row.stepTypeNo ?? null,
      relationId,
      relationName:
        detailData?.relationName ||
        row.relationName ||
        findRelationName(filters.parameterOptions.value, relationId),
      name: detailData?.name ?? row.name,
      description: detailData?.description ?? row.description,
      versionLabel:
        detailData?.versionLabel ??
        (row.versionLabel || formatVersionLabel(versionSource)),
      createdBy: detailData?.createdBy ?? row.createdBy,
      createdAt: detailData?.createdAt ?? row.createdAt,
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
