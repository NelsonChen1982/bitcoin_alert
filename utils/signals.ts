import type { Signal, SignalLevel } from '~/types/indicators'

export function makeSignal(level: SignalLevel, label: string, description: string): Signal {
  return { level, label, description }
}

// AHR999 signals (value is the raw ratio * 100)
export function getAHR999Signal(value: number | null): Signal {
  if (value === null) return makeSignal('gray', '載入中', '正在獲取資料...')
  // AHR999 raw (not * 100)
  const v = value / 100
  if (v < 0.45) return makeSignal('green', '抄底區', '強烈買入訊號，歷史大底部位')
  if (v < 1.2) return makeSignal('yellow', '定投區', '適合持續定投，風險可控')
  if (v < 2.0) return makeSignal('orange', '偏貴', '市場偏熱，謹慎加倉')
  return makeSignal('red', '高風險', '估值偏高，考慮分批獲利')
}

// MVRV signals
export function getMVRVSignal(value: number | null): Signal {
  if (value === null) return makeSignal('gray', '載入中', '正在獲取資料...')
  if (value < 1) return makeSignal('green', '極度低估', '歷史底部區，市值低於實現市值')
  if (value < 2) return makeSignal('green', '低估區', '仍在合理低估範圍')
  if (value < 3.5) return makeSignal('yellow', '合理估值', '市場中性，觀察趨勢')
  if (value < 5) return makeSignal('orange', '偏貴', '市場偏熱，注意風險')
  return makeSignal('red', '極度高估', '歷史頂部區，謹慎持有')
}

// 200-week MA signals (percentage above MA)
export function getMA200WSignal(currentPrice: number | null, ma: number | null): Signal {
  if (!currentPrice || !ma) return makeSignal('gray', '載入中', '正在計算均線...')
  const ratio = currentPrice / ma
  if (ratio < 1) return makeSignal('green', '低於均線', '罕見底部機會，歷史最強買訊')
  if (ratio < 1.2) return makeSignal('green', '均線附近', '底部支撐區，歷史買入機會')
  if (ratio < 2) return makeSignal('yellow', '合理範圍', '高於均線但在正常範圍')
  if (ratio < 3.5) return makeSignal('orange', '偏高', '明顯高於均線，謹慎追高')
  return makeSignal('red', '極度偏高', '嚴重偏離均線，歷史頂部特徵')
}

// Fear & Greed signals
export function getFearGreedSignal(value: number | null): Signal {
  if (value === null) return makeSignal('gray', '載入中', '正在獲取指數...')
  if (value <= 20) return makeSignal('green', '極度恐懼', '歷史最佳買入時機')
  if (value <= 40) return makeSignal('green', '恐懼', '市場情緒低迷，可考慮布局')
  if (value <= 60) return makeSignal('yellow', '中性', '市場情緒中性，觀察')
  if (value <= 80) return makeSignal('orange', '貪婪', '市場偏樂觀，注意風險')
  return makeSignal('red', '極度貪婪', '歷史頂部常見訊號，謹慎追高')
}

// NUPL signals
export function getNUPLSignal(value: number | null): Signal {
  if (value === null) return makeSignal('gray', '載入中', '正在獲取資料...')
  if (value < 0) return makeSignal('green', '投降階段', '持有者大多虧損，歷史底部')
  if (value < 0.25) return makeSignal('green', '希望/恐懼', '市場從底部緩慢復甦')
  if (value < 0.5) return makeSignal('yellow', '樂觀', '大多數人盈利，市場健康')
  if (value < 0.75) return makeSignal('orange', '信念', '大幅盈利，謹慎過度貪婪')
  return makeSignal('red', '狂熱', '歷史頂部特徵，強烈建議獲利')
}

// Z-Score signals
export function getZScoreSignal(value: number | null): Signal {
  if (value === null) return makeSignal('gray', '載入中', '正在計算 Z-Score...')
  if (value < 0) return makeSignal('green', '低於均值', '價格低於 200 週均線，歷史底部')
  if (value < 3) return makeSignal('yellow', '正常範圍', '偏離不大，市場健康')
  if (value < 6) return makeSignal('orange', '偏高', '高於正常估值範圍')
  return makeSignal('red', '極度偏高', '歷史只出現 3 次，接近週期頂部')
}

// Signal badge CSS classes
export function getSignalClasses(level: SignalLevel): string {
  const map: Record<SignalLevel, string> = {
    green: 'signal-green',
    yellow: 'signal-yellow',
    orange: 'signal-orange',
    red: 'signal-red',
    gray: 'signal-gray',
  }
  return map[level]
}

// Signal dot color
export function getSignalDotColor(level: SignalLevel): string {
  const map: Record<SignalLevel, string> = {
    green: '#00d68f',
    yellow: '#ffb700',
    orange: '#ff7f00',
    red: '#ff4757',
    gray: '#6b7280',
  }
  return map[level]
}

// Overall signal summary (lowest signal = safest overall reading)
export function getOverallRisk(signals: (SignalLevel | null)[]): SignalLevel {
  const validSignals = signals.filter(Boolean) as SignalLevel[]
  if (validSignals.length === 0) return 'gray'

  const priority: Record<SignalLevel, number> = { gray: 0, green: 1, yellow: 2, orange: 3, red: 4 }
  const sorted = [...validSignals].sort((a, b) => priority[b] - priority[a])

  // Weight: if majority is red or orange, overall is red
  const reds = validSignals.filter(s => s === 'red').length
  const oranges = validSignals.filter(s => s === 'orange').length
  const greens = validSignals.filter(s => s === 'green').length

  if (reds >= 3) return 'red'
  if (reds >= 2 || oranges >= 3) return 'orange'
  if (greens >= 4) return 'green'
  if (greens >= 3) return 'yellow'
  return sorted[0]
}
