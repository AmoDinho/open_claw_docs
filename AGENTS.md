import axios from "axios";

const API_KEY = "ac224442cb414717b67819eb1ac65120";

const instruments = [
{ symbol: "XAU/USD", name: "Gold" },
];

interface Quote {
close: string;
percent_change: string;
high: string;
low: string;
open: string;
}

interface RSIValue {
rsi: string;
datetime: string;
}

interface RSIResponse {
values: RSIValue[];
}

interface MACDValue {
macd: string;
macd_signal: string;
macd_hist: string;
}

interface MACDResponse {
values: MACDValue[];
}

interface InstrumentAnalysis {
name: string;
symbol: string;
price: string;
change: string;
high: string;
low: string;
rsi: string;
macd: string;
signal: string;
trend: string;
outlook: string;
}

function getTrend(change: number, rsi: number): string {
if (change > 0.2 && rsi > 55) return "📈 Bullish";
if (change < -0.2 && rsi < 45) return "📉 Bearish";
return "➡️ Sideways";
}

function getOutlook(rsi: number, macdHist: number): string {
if (rsi > 70) return "⚠️ Overbought - potential pullback";
if (rsi < 30) return "⚠️ Oversold - potential bounce";
if (macdHist > 0) return "🟢 Momentum building to upside";
if (macdHist < 0) return "🔴 Momentum building to downside";
return "⚡ Neutral - wait for confirmation";
}

async function fetchQuote(symbol: string): Promise<Quote> {
const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`;
const response = await axios.get(url);
return response.data;
}

async function fetchRSI(symbol: string): Promise<RSIResponse> {
const url = `https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1h&time_period=14&apikey=${API_KEY}`;
const response = await axios.get(url);
return response.data;
}

async function fetchMACD(symbol: string): Promise<MACDResponse> {
const url = `https://api.twelvedata.com/macd?symbol=${symbol}&interval=1h&apikey=${API_KEY}`;
const response = await axios.get(url);
return response.data;
}

async function analyzeInstrument(
symbol: string,
name: string
): Promise<InstrumentAnalysis> {
const [quote, rsiData, macdData] = await Promise.all([
fetchQuote(symbol),
fetchRSI(symbol),
fetchMACD(symbol),
]);

const rsi = parseFloat(rsiData.values?.[0]?.rsi ?? "50");
const macdHist = parseFloat(macdData.values?.[0]?.macd_hist ?? "0");
const change = parseFloat(quote.percent_change);

return {
name,
symbol,
price: parseFloat(quote.close).toFixed(5),
change: change.toFixed(2),
high: parseFloat(quote.high).toFixed(5),
low: parseFloat(quote.low).toFixed(5),
rsi: rsi.toFixed(2),
macd: parseFloat(macdData.values?.[0]?.macd ?? "0").toFixed(5),
signal: parseFloat(macdData.values?.[0]?.macd_signal ?? "0").toFixed(5),
trend: getTrend(change, rsi),
outlook: getOutlook(rsi, macdHist),
};
}

function formatReport(analyses: InstrumentAnalysis[]): string {
const date = new Date().toLocaleString("en-ZA", {
timeZone: "Africa/Johannesburg",
});

let report = `🌍 *MARKET ANALYSIS REPORT*\n`;
report += `📅 ${date} (SAST)\n`;
report += `${"─".repeat(30)}\n\n`;

for (const a of analyses) {
report += `*${a.name}* (${a.symbol})\n`;
report += `💰 Price: ${a.price}\n`;
report += `📊 Change: ${a.change}%\n`;
report += `⬆️ High: ${a.high} | ⬇️ Low: ${a.low}\n`;
report += `📉 RSI (14): ${a.rsi}\n`;
report += `📈 MACD: ${a.macd} | Signal: ${a.signal}\n`;
report += `Trend: ${a.trend}\n`;
report += `Outlook: ${a.outlook}\n`;
report += `${"─".repeat(30)}\n\n`;
}

return report;
}

async function main(): Promise<void> {
console.log("Fetching market data...");

const analyses = await Promise.all(
instruments.map((i) => analyzeInstrument(i.symbol, i.name))
);

const report = formatReport(analyses);
console.log(report);

}

main().catch(console.error);
