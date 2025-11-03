# query_prd_mo.py
import os
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from k3cloud_webapi_sdk.main import K3CloudApiSdk

api_sdk = K3CloudApiSdk("http://10.10.10.18/k3cloud/")
api_sdk.Init(config_path=f'{ os.path.dirname(os.path.abspath(__file__))}/conf.ini', config_node='config')

    # 2. 根据 FLot 去查批号主数据
lot_result = api_sdk.ExecuteBillQuery({
    "FormId": "SAL_OUTSTOCK",
    "FieldKeys": "FBillNo,FDate,FDocumentStatus,FCustomerID.FName",
    "FilterString": "FDocumentStatus='C' and FDate>= '2025-10-01' and FDate <= '2025-10-26'",
    "OrderString": "FDate DESC",
    "TopRowCount": 0,
    "StartRow": 0,
})
res = json.loads(lot_result)
materialLotMap = {}
for x in res:
    key = f'{x[3]}'
    if key not in materialLotMap:
        materialLotMap[key] = []
    materialLotMap[key].append(x[0])
for k in materialLotMap:
    materialLotMap[k] = materialLotMap[k][:5]
    materialLotMap[k] = list(set(materialLotMap[k]))
    materialLotMap[k].sort(reverse=True)
print(json.dumps(materialLotMap, ensure_ascii=False))  # stdout 方式返回结果