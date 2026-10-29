# 金融日报执行流程

目标：北京时间每天10:00更新main分支data/YYYY-MM-DD.json并核实GitHub Pages发布。用户授权覆盖同一天数据；保留其他历史文件。不处理Google Sheets，不发送Slack。

## 开始
读取本文件、app.js和最近日报。日期使用Asia/Shanghai。原Claude抓取脚本未在仓库内，用户电脑的~/Documents路径不可使用。通过GitHub连接读写仓库，上传完整JSON并检查内容SHA，避免覆盖并发改动。

## 行情与验证
沿用app.js内所有股票（含存储股），5组外汇，4组美债，已有8种商品（含取暖油）。Yahoo chart API路径为https://query1.finance.yahoo.com/v8/finance/chart/{URL编码ticker}?interval=1d&range=5d，保留meta.regularMarketTime为as_of。请求头可用普通Mozilla/5.0；并发控制为4，设置超时。首次429后不要无限重试；本次urllib GET成功。
股票和指数优先meta.regularMarketChangePercent；缺失时仅使用可核实对应前交易日收盘价计算，勿误用5日窗口chartPreviousClose。所有新报价记source、source_url、as_of，缺失不补0。休市取最近交易日并注明。
期货必须使用meta.regularMarketChangePercent这一当前合约字段，不得拿连续K线前一根收盘价计算！2026-10-29天然气连续K线会得到+7.56%，当前合约实际-0.066%；换月可让价格方向反转。若无同合约prev_close/change_abs，将其置null，不反推伪装成来源值。
美债使用Investing.com的u.s.-{30/10/5/2}-year-bond-yield页面。按data-test=\"instrument-price-last\"、\"instrument-price-change\"、\"instrument-price-change-percent\"元素内部文字读取，不能在附近HTML全文正则取第一个数字（CSS含-0.5会误读）。核验收益率合理范围、差值与前收盘价一致。变化单位百分点；1个百分点=100bp。不得将2YY=F收益率期货充当2年现金国债收益率。

## ETF
优先SoSoValue BTC/ETH/SOL现货ETF，字段net_inflow、volume、total_assets、market_cap_pct、date。遇安全验证阻断即停止该站，不绕过。当前浏览器2026-10-29被Cloudflare硬阻断。
资金流备用https://farside.co.uk/btc/、eth/、sol/；表格单位US$m，括号为负数，横线表示未报不能当0；检查当日完整度。2026-10-28已核实BTC+137.3M、ETH-21.4M、SOL-5.7M（Farside一位小数）。原报BTC+1.32M和ETH+23.41M被修正。
SoSoValue无法复核的成交额、总资产，本次沿用同一天原报但显示“原报值，未复核”；后续不得给旧值改截至日期冒充新值，不能获取时使用“—”并说明。市值占比抓取缺失必须显示“—”，不得用0.00%占位。来源不同请逐字段注明。

## 新闻
7条顺序：美股、美债、原油、黄金白银、加密市场、加密ETF、加密股票。今天或昨天，新闻正文<=60字，1至2个数字仅在可核实时加入，保留category/content/source/url/date。直接原文链接去UTM，不使用Google RSS跳转。核查发布与更新时间、原文和JSON数字一致。原报“加密股票”错写成存储股，已纠正。用搜索找新闻后可用普通HTTP GET验证全文及链接；本次7条原文均HTTP200。

## 发布
JSON必须完整可解析、数字有限、无必填行情缺失、7条新闻及对应分类正确。保留data_notes在页面显示缺失与真实截至日期。仅发布验证完成的字段；不把部分抓取成功说成全部完成。
通过GitHub create_tree/create_commit/update_ref(expected_sha，不force)原子发布多文件；或单文件update_file带最新blob SHA。检查Actions的pages build and deployment，直到终态；HTTP GET线上当天JSON比较内容。失败如实报告。

## 2026-10-29试跑
28条股票/指数ETF、5组外汇、4组现券美债、8种商品均抓取成功；ETF流量使用Farside，其他ETF指标本次未全部核实。网站日期修正为北京时间，显示data_notes并移除导出文字中的Google Sheets。
