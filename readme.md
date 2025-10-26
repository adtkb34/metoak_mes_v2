flowchart TD

    A[开始 buildParetoBreakdown()] --> B{rows 是否为空?}


    B -- 是 --> Z[返回空数组]


    B -- 否 --> C[初始化 Map counter]


    C --> D[遍历 rows]


    D --> E{row.error_code 是否成功?}


    E -- 是 --> D


    E -- 否 --> F[调用 setNgReason(row)]


    F -->|出错| G[记录 warning 日志]


    F -->|成功| H[提取 row.ng_reason]


    G --> H


    H --> I{ng_reason 是否有效字符串?}


    I -- 否 --> D


    I -- 是 --> J[计数器累加 counter[reason]++]


    J --> D


    D --> K[遍历结束]


    K --> L[按 count 降序排序]


    L --> M[映射为 {reason, count}]


    M --> N[返回结果数组]
