# query_prd_mo.py
import os
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from k3cloud_webapi_sdk.main import K3CloudApiSdk

api_sdk = K3CloudApiSdk("http://10.10.10.18/k3cloud/")
api_sdk.Init(config_path=f'{ os.path.dirname(os.path.abspath(__file__))}/conf.ini', config_node='config')

# FStatus
def PRD_MO_ExecuteBillQuery():
    mo_number = "MO000748"

# 调用 ExecuteBillQuery
    response = api_sdk.ExecuteBillQuery({
        "FormId": "PRD_PickMtrl",   # 生产领料单
        "FieldKeys": "FMaterialId.FName,FLot",
        "FilterString": f"FMoBillNo='{mo_number}'",
        "OrderString": "FDate DESC",
        "TopRowCount": 0,
        "StartRow": 0,
        "Limit": 0
    })
    # response = api_sdk.ExecuteBillQuery(para)
    res = json.loads(response)
    for x in json.dumps(res, ensure_ascii=False).split(']'):  # stdout 方式返回结果
        print(x.replace(', [', '').replace('[[', ''))

PRD_MO_ExecuteBillQuery()
