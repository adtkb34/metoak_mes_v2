# query_prd_mo.py
import os
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from k3cloud_webapi_sdk.main import K3CloudApiSdk

api_sdk = K3CloudApiSdk("http://10.10.10.18/k3cloud/")
api_sdk.Init(config_path=f'{ os.path.dirname(os.path.abspath(__file__))}/conf.ini', config_node='config')
import json
import sys

def PRD_MO_ExecuteBillQuery(mo_number):
    # 调用 ExecuteBillQuery
    response = api_sdk.ExecuteBillQuery({
        "FormId": "ENG_BOM",   # 生产领料单
        "FieldKeys": "FMATERIALIDCHILD.Fname, FMATERIALIDCHILD.Fnumber",
        "FilterString": f"FMaterialId.Fnumber='{mo_number}' ",  # 使用传入的 mo_number and FIsDefault='0'
        "TopRowCount": 0,
        "StartRow": 0,
        "Limit": 0
    })
    res = json.loads(response)
    for x in list(set([f'{item[0]}: {item[1]}' for item in res])):
        print(x)
    materials = list(set([item[1] for item in res]))
    print(json.dumps(materials, ensure_ascii=False))  # stdout 方式返回结果

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <mo_number>")
        sys.exit(1)
    
    mo_number = sys.argv[1]
    PRD_MO_ExecuteBillQuery(mo_number)
