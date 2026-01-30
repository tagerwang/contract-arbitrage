# API使用示例

## 基础URL

```
http://localhost:3001/api
```

## 端点列表

### 1. 获取套利机会

**GET /api/opportunities**

查询参数:
- `symbol` - 交易对 (可选)
- `minSpread` - 最小费差 (可选)
- `limit` - 返回数量 (默认50)
- `offset` - 偏移量 (默认0)

示例:
```bash
curl "http://localhost:3001/api/opportunities?symbol=BTCUSDT&minSpread=0.5"
```

响应:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "symbol": "BTCUSDT",
      "long_exchange": "binance",
      "short_exchange": "okx",
      "spread_rate": 0.8,
      "annualized_return": 876.0
    }
  ],
  "timestamp": 1703001234567
}
```

### 2. 最新套利机会

**GET /api/opportunities/latest**

```bash
curl "http://localhost:3001/api/opportunities/latest?limit=10"
```

### 3. 最新资金费率

**GET /api/funding-rates/latest**

```bash
curl "http://localhost:3001/api/funding-rates/latest?limit=50"
```

### 4. 历史费率

**GET /api/funding-rates/history**

参数:
- `symbol` - 交易对 (必需)
- `exchange` - 交易所 (必需)
- `hours` - 小时数 (默认24)

```bash
curl "http://localhost:3001/api/funding-rates/history?symbol=BTCUSDT&exchange=binance&hours=48"
```

### 5. 统计数据

**GET /api/statistics**

```bash
curl "http://localhost:3001/api/statistics?hours=24"
```

响应:
```json
{
  "success": true,
  "data": {
    "totalOpportunities": 150,
    "avgSpread": 0.45,
    "avgAnnualizedReturn": 492.0,
    "topSymbols": [...],
    "exchangePairs": [...]
  }
}
```

### 6. 健康检查

**GET /api/health**

```bash
curl "http://localhost:3001/api/health"
```

## JavaScript示例

```javascript
// 获取最新机会
async function getLatestOpportunities() {
  const response = await fetch('http://localhost:3001/api/opportunities/latest?limit=10');
  const data = await response.json();
  return data.data;
}

// 获取统计数据
async function getStatistics() {
  const response = await fetch('http://localhost:3001/api/statistics');
  const data = await response.json();
  return data.data;
}
```

## Python示例

```python
import requests

# 获取套利机会
def get_opportunities(symbol=None, min_spread=None):
    params = {}
    if symbol:
        params['symbol'] = symbol
    if min_spread:
        params['minSpread'] = min_spread
    
    response = requests.get('http://localhost:3001/api/opportunities', params=params)
    return response.json()['data']

# 使用示例
opportunities = get_opportunities(symbol='BTCUSDT', min_spread=0.5)
for opp in opportunities:
    print(f"{opp['symbol']}: {opp['spread_rate']}%")
```
