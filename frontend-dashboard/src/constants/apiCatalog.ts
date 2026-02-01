/**
 * 交易所 API 目录配置
 */
export interface APIParam {
  name: string;
  required: boolean;
  type: string;
  desc: string;
}

export interface APIEndpoint {
  id: string;
  category: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  params: APIParam[];
  response: Record<string, unknown> | unknown[];
  websocket: string | null;
}

export interface ExchangeConfig {
  name: string;
  color: string;
  apis: APIEndpoint[];
}

export const API_CATALOG: Record<string, ExchangeConfig> = {
  binance: {
    name: '币安 (Binance)',
    color: 'bg-yellow-500',
    apis: [
      {
        id: 'bn_funding_rate',
        category: '费率数据',
        name: '获取资金费率',
        method: 'GET',
        endpoint: '/fapi/v1/fundingRate',
        description: '获取永续合约的资金费率历史',
        params: [
          { name: 'symbol', required: true, type: 'string', desc: '交易对,如BTCUSDT' },
          { name: 'startTime', required: false, type: 'long', desc: '起始时间戳' },
          { name: 'endTime', required: false, type: 'long', desc: '结束时间戳' },
          { name: 'limit', required: false, type: 'int', desc: '返回数量,默认100,最大1000' }
        ],
        response: {
          symbol: 'BTCUSDT',
          fundingRate: '0.00010000',
          fundingTime: 1640995200000,
          markPrice: '47250.00000000'
        },
        websocket: null
      },
      {
        id: 'bn_premium_index',
        category: '费率数据',
        name: '获取溢价指数',
        method: 'GET',
        endpoint: '/fapi/v1/premiumIndex',
        description: '获取当前溢价指数和预测资金费率',
        params: [
          { name: 'symbol', required: false, type: 'string', desc: '交易对,不传返回所有' }
        ],
        response: {
          symbol: 'BTCUSDT',
          markPrice: '47250.00000000',
          indexPrice: '47248.50000000',
          lastFundingRate: '0.00010000',
          nextFundingTime: 1641024000000
        },
        websocket: 'wss://fstream.binance.com/ws/btcusdt@markPrice'
      },
      {
        id: 'bn_contract_list',
        category: '合约信息',
        name: '交易规则和交易对',
        method: 'GET',
        endpoint: '/fapi/v1/exchangeInfo',
        description: '获取交易规则和所有交易对信息',
        params: [],
        response: {
          symbols: [
            {
              symbol: 'BTCUSDT',
              status: 'TRADING',
              contractType: 'PERPETUAL',
              marginAsset: 'USDT'
            }
          ]
        },
        websocket: null
      },
      {
        id: 'bn_account',
        category: '账户信息',
        name: '账户信息',
        method: 'GET',
        endpoint: '/fapi/v2/account',
        description: '获取当前账户信息,包括保证金余额和持仓',
        params: [],
        response: {
          totalWalletBalance: '10000.00000000',
          totalMarginBalance: '10000.00000000',
          availableBalance: '9500.00000000',
          positions: []
        },
        websocket: 'wss://fstream.binance.com/ws/<listenKey> (需要USER_DATA_STREAM)'
      },
      {
        id: 'bn_new_order',
        category: '交易操作',
        name: '下单',
        method: 'POST',
        endpoint: '/fapi/v1/order',
        description: '创建新订单',
        params: [
          { name: 'symbol', required: true, type: 'string', desc: '交易对,如BTCUSDT' },
          { name: 'side', required: true, type: 'string', desc: 'BUY或SELL' },
          { name: 'type', required: true, type: 'string', desc: '订单类型:LIMIT或MARKET' },
          { name: 'quantity', required: true, type: 'string', desc: '下单数量' },
          { name: 'positionSide', required: false, type: 'string', desc: 'BOTH=单向持仓, LONG=双向做多, SHORT=双向做空。不填则按后端配置' },
          { name: 'price', required: false, type: 'string', desc: '限价单委托价格' }
        ],
        response: {
          orderId: 123456789,
          symbol: 'BTCUSDT',
          status: 'NEW',
          side: 'BUY',
          type: 'LIMIT'
        },
        websocket: null
      }
    ]
  },
  okx: {
    name: 'OKX',
    color: 'bg-blue-500',
    apis: [
      {
        id: 'okx_funding_rate',
        category: '费率数据',
        name: '获取资金费率',
        method: 'GET',
        endpoint: '/api/v5/public/funding-rate',
        description: '获取永续合约的资金费率',
        params: [
          { name: 'instId', required: true, type: 'string', desc: '产品ID,如BTC-USDT-SWAP' }
        ],
        response: {
          instId: 'BTC-USDT-SWAP',
          fundingRate: '0.0001',
          fundingTime: '1640995200000',
          nextFundingRate: '0.00012',
          nextFundingTime: '1641024000000'
        },
        websocket: 'wss://ws.okx.com:8443/ws/v5/public?channel=funding-rate&instId=BTC-USDT-SWAP'
      },
      {
        id: 'okx_funding_history',
        category: '费率数据',
        name: '资金费率历史',
        method: 'GET',
        endpoint: '/api/v5/public/funding-rate-history',
        description: '获取资金费率历史数据',
        params: [
          { name: 'instId', required: true, type: 'string', desc: '产品ID' },
          { name: 'before', required: false, type: 'long', desc: '请求此时间戳之前的数据' },
          { name: 'after', required: false, type: 'long', desc: '请求此时间戳之后的数据' },
          { name: 'limit', required: false, type: 'string', desc: '返回结果数量,最大100' }
        ],
        response: [
          {
            fundingRate: '0.0001',
            fundingTime: '1640995200000',
            instId: 'BTC-USDT-SWAP',
            realizedRate: '0.00009'
          }
        ],
        websocket: null
      },
      {
        id: 'okx_instruments',
        category: '合约信息',
        name: '产品信息',
        method: 'GET',
        endpoint: '/api/v5/public/instruments',
        description: '获取所有可交易产品的信息',
        params: [
          { name: 'instType', required: true, type: 'string', desc: 'SWAP(永续合约)' }
        ],
        response: [
          {
            instId: 'BTC-USDT-SWAP',
            instType: 'SWAP',
            state: 'live',
            ctVal: '0.01',
            settleCcy: 'USDT'
          }
        ],
        websocket: null
      },
      {
        id: 'okx_account_balance',
        category: '账户信息',
        name: '账户余额',
        method: 'GET',
        endpoint: '/api/v5/account/balance',
        description: '获取账户余额信息',
        params: [],
        response: {
          totalEq: '10000.5',
          details: [
            {
              ccy: 'USDT',
              eq: '10000.5',
              availBal: '9500.5'
            }
          ]
        },
        websocket: 'wss://ws.okx.com:8443/ws/v5/private (需要登录)'
      },
      {
        id: 'okx_place_order',
        category: '交易操作',
        name: '下单',
        method: 'POST',
        endpoint: '/api/v5/trade/order',
        description: '下单交易',
        params: [
          { name: 'instId', required: true, type: 'string', desc: '产品ID,如BTC-USDT-SWAP' },
          { name: 'tdMode', required: true, type: 'string', desc: '交易模式:cross,isolated' },
          { name: 'side', required: true, type: 'string', desc: 'buy或sell' },
          { name: 'ordType', required: true, type: 'string', desc: '订单类型:limit,market' },
          { name: 'sz', required: true, type: 'string', desc: '委托数量(张)' },
          { name: 'px', required: false, type: 'string', desc: '限价单委托价格' }
        ],
        response: {
          ordId: '312269865356374016',
          clOrdId: 'b1',
          sCode: '0',
          sMsg: ''
        },
        websocket: null
      }
    ]
  },
  bybit: {
    name: 'Bybit',
    color: 'bg-orange-500',
    apis: [
      {
        id: 'bybit_funding_rate',
        category: '费率数据',
        name: '获取资金费率',
        method: 'GET',
        endpoint: '/v5/market/funding/history',
        description: '查询资金费率历史',
        params: [
          { name: 'category', required: true, type: 'string', desc: 'linear(USDT永续)' },
          { name: 'symbol', required: true, type: 'string', desc: '交易对,如BTCUSDT' },
          { name: 'startTime', required: false, type: 'long', desc: '起始时间戳(毫秒)' },
          { name: 'endTime', required: false, type: 'long', desc: '结束时间戳(毫秒)' },
          { name: 'limit', required: false, type: 'int', desc: '数量限制,默认200' }
        ],
        response: {
          symbol: 'BTCUSDT',
          fundingRate: '0.0001',
          fundingRateTimestamp: '1640995200000'
        },
        websocket: 'wss://stream.bybit.com/v5/public/linear (topic: tickers.BTCUSDT)'
      },
      {
        id: 'bybit_tickers',
        category: '费率数据',
        name: '最新行情信息',
        method: 'GET',
        endpoint: '/v5/market/tickers',
        description: '获取最新价格和资金费率',
        params: [
          { name: 'category', required: true, type: 'string', desc: 'linear' },
          { name: 'symbol', required: false, type: 'string', desc: '交易对,可选' }
        ],
        response: {
          symbol: 'BTCUSDT',
          lastPrice: '47250.00',
          fundingRate: '0.0001',
          nextFundingTime: '1641024000000',
          markPrice: '47248.50'
        },
        websocket: 'wss://stream.bybit.com/v5/public/linear'
      },
      {
        id: 'bybit_instruments',
        category: '合约信息',
        name: '查询产品信息',
        method: 'GET',
        endpoint: '/v5/market/instruments-info',
        description: '获取交易对基本信息',
        params: [
          { name: 'category', required: true, type: 'string', desc: 'linear' },
          { name: 'symbol', required: false, type: 'string', desc: '交易对' }
        ],
        response: {
          symbol: 'BTCUSDT',
          contractType: 'LinearPerpetual',
          status: 'Trading',
          baseCoin: 'BTC',
          quoteCoin: 'USDT'
        },
        websocket: null
      },
      {
        id: 'bybit_wallet_balance',
        category: '账户信息',
        name: '钱包余额',
        method: 'GET',
        endpoint: '/v5/account/wallet-balance',
        description: '获取钱包资金余额',
        params: [
          { name: 'accountType', required: true, type: 'string', desc: 'CONTRACT(合约账户)' }
        ],
        response: {
          accountType: 'CONTRACT',
          totalEquity: '10000.50',
          totalAvailableBalance: '9500.50',
          coin: [
            {
              coin: 'USDT',
              equity: '10000.50',
              availableToWithdraw: '9500.50'
            }
          ]
        },
        websocket: 'wss://stream.bybit.com/v5/private (需要认证)'
      },
      {
        id: 'bybit_place_order',
        category: '交易操作',
        name: '创建订单',
        method: 'POST',
        endpoint: '/v5/order/create',
        description: '下单交易',
        params: [
          { name: 'symbol', required: true, type: 'string', desc: '交易对,如BTCUSDT' },
          { name: 'side', required: true, type: 'string', desc: 'Buy或Sell' },
          { name: 'orderType', required: true, type: 'string', desc: 'Market或Limit' },
          { name: 'qty', required: true, type: 'string', desc: '订单数量' },
          { name: 'price', required: false, type: 'string', desc: '限价单委托价格' }
        ],
        response: {
          orderId: '1234567890123456789',
          orderLinkId: 'test-001'
        },
        websocket: null
      }
    ]
  }
};

export const CATEGORIES = ['全部', '费率数据', '合约信息', '账户信息', '交易操作'];
