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
    para = {
        "FormId": "PRD_MO",
        "FieldKeys": "FMaterialID.FNumber,FMaterialID.FName",
        # "FilterString": f"FMaterialID.FNumber like '2%'",

    }
    response = api_sdk.ExecuteBillQuery(para)
    res = json.loads(response)
    print(json.dumps(res, ensure_ascii=False))  # stdout 方式返回结果

PRD_MO_ExecuteBillQuery()
