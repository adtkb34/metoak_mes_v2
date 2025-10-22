import { http } from "@/utils/http";

export function getSnTraceInfo(sn: string) {
  return http.request("get", "/information-inquiry/product-traceability", {
    params: { sn }
  });
}
export async function getSnTraceInfoV2(sn: string, flowCode: string): Promise<{ data: any[] }> {
  try {
    const res = await http.request<Promise<any>>("get", "/information-inquiry/product-traceability/v2", {
      params: { sn, flowCode }
    });

    const originalData = res?.data || res;

    if (!originalData || typeof originalData !== 'object') {
      console.warn('Invalid data structure received');
      return { data: [] };
    }

    const result = [];


    if (originalData && typeof originalData === 'object') {
      for (const [step, items] of Object.entries(originalData)) {
        const itemArray = Array.isArray(items) ? items : (items ? [items] : []);

        itemArray.forEach(item => {
          if (item && typeof item === 'object') {
            const stepData = {
              step: step,
              data: [] as Array<{ label: string; value: string }>
            };

            for (const [label, value] of Object.entries(item)) {
              stepData.data.push({
                label: label,
                value: value !== null && value !== undefined ? value.toString() : "null"
              });
            }

            result.push(stepData);
          }
        });
      }
    }

    console.log(result);

    return { data: result };
  } catch (error) {
    console.error('Error in getSnTraceInfoV2:', error);
    return { data: [] };
  }
}