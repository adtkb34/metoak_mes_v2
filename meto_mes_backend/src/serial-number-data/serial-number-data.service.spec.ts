import { SerialNumberDataService } from './serial-number-data.service';

describe('SerialNumberDataService - AA base info adapters', () => {
  let service: SerialNumberDataService;

  beforeEach(() => {
    service = new SerialNumberDataService();
  });

  it('normalizes array payloads using default field mapping', async () => {
    const serialNumber = 'SN123456';
    const dbConfig = {
      data: [
        {
          serialNumber,
          status: 'PASS',
          operator: 'Alice',
          add_time: '2024-01-01T02:03:04Z',
        },
      ],
    };

    const result = await service.getSuzhouShunyuAaBaseInfo(serialNumber, dbConfig, (value) => value);

    expect(result).toEqual({
      serialNumber,
      process: '苏州顺宇 AA',
      timestamp: '2024-01-01T02:03:04Z',
      result: 'PASS',
      operator: 'Alice',
    });
  });

  it('leverages parser output and honours custom process name', async () => {
    const serialNumber = 'SN001';
    const rows = [{ serialNumber, status: 'RAW' }];
    const dbConfig = {
      records: rows,
      processName: '自定义AA',
    };

    const parseResult = jest.fn().mockReturnValue({
      SN001: {
        result: 'OK',
        user_name: 'Bob',
        operation_time: new Date('2024-03-01T10:20:30Z'),
      },
    });

    const info = await service.getSuzhouGuanghaojieAaBaseInfo(serialNumber, dbConfig, parseResult);

    expect(parseResult).toHaveBeenCalledWith(rows);
    expect(info).toEqual({
      serialNumber,
      process: '自定义AA',
      timestamp: '2024-03-01T10:20:30.000Z',
      result: 'OK',
      operator: 'Bob',
    });
  });

  it('falls back to configured defaults when no matching record is found', async () => {
    const serialNumber = 'SN999';
    const dbConfig = {
      fallbackResult: 'UNKNOWN',
      fallbackOperator: '未配置',
      fallbackTimestamp: '2025-01-01T00:00:00Z',
      processName: '绵阳艾维视 AA',
    };

    const parser = jest.fn().mockReturnValue([]);

    const info = await service.getMianyangAiweishiAaBaseInfo(serialNumber, dbConfig, parser);

    expect(parser).toHaveBeenCalledWith(undefined);
    expect(info).toEqual({
      serialNumber,
      process: '绵阳艾维视 AA',
      timestamp: '2025-01-01T00:00:00Z',
      result: 'UNKNOWN',
      operator: '未配置',
    });
  });
});
