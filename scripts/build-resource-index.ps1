param(
    [string]$Output = (Join-Path $PSScriptRoot '..\RESOURCE_LINKS.md'),
    [string]$LeslieRepo = 'C:\Users\Administrator\AppData\Local\Temp\loon-plugin-research-fc8c2582564b4a22a97bf423caf0d7b2',
    [string]$MoliRepo = 'C:\Users\Administrator\AppData\Local\Temp\moli-x-resources-codex-20260719',
    [string]$AleotoRepo = 'C:\Users\Administrator\AppData\Local\Temp\loon-link-index\aleoto',
    [string]$ExternalRoot = 'C:\Users\Administrator\AppData\Local\Temp\external-resource-repos'
)

$ErrorActionPreference = 'Stop'
$script:TreeCaches = @{}

function Get-TreeCache([string]$repo) {
    if (-not $script:TreeCaches.ContainsKey($repo)) {
        $cache = [System.Collections.Generic.Dictionary[string,string]]::new([System.StringComparer]::Ordinal)
        foreach ($line in @(git -c core.quotepath=false -C $repo ls-tree -r HEAD)) {
            if ($line -match '^\d+\s+blob\s+([0-9a-f]+)\t(.+)$') {
                $cache[$Matches[2]] = $Matches[1]
            }
        }
        $script:TreeCaches[$repo] = $cache
    }
    return $script:TreeCaches[$repo]
}

function Get-FileHint([string]$repo, [string]$path) {
    $relativePath = ($path -replace '\\', '/').Replace('/', [string][IO.Path]::DirectorySeparatorChar)
    $fullPath = Join-Path $repo $relativePath
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) { return '' }

    try {
        $hintLines = [System.Collections.Generic.List[string]]::new()
        $lineNumber = 0
        foreach ($line in [System.IO.File]::ReadLines($fullPath)) {
            $lineNumber++
            if ($lineNumber -gt 40 -or $hintLines.Count -ge 12) { break }
            if (
                $line -match '^\s*(#|//|/\*|\*)' -and
                $line -match '(?i)\b(name|desc|description|category|cookie|subtitle|rewrite|adblock|block|unlock|premium|vip)\b|功能|用途|作用|广告|净化|会员|订阅|解锁|签到|字幕|歌词|重定向|check.?in'
            ) {
                [void]$hintLines.Add($line)
            }
        }
        return (($hintLines -join ' ') -replace '\s+', ' ').Trim()
    } catch {
        return ''
    }
}

function Get-LastCommit([string]$repo, [string]$path) {
    $value = git -c core.quotepath=false -C $repo log -1 --format=%cI -- ":(literal)$path"
    if (-not $value) { throw "No commit date found for $repo/$path" }
    return [DateTimeOffset]::Parse($value.Trim())
}

function Get-LastCommitMap([string]$repo, [string[]]$paths) {
    $dates = [System.Collections.Generic.Dictionary[string,DateTimeOffset]]::new([System.StringComparer]::Ordinal)
    $orderedPaths = @($paths | Where-Object { $_ } | ForEach-Object { $_ -replace '\\', '/' } | Select-Object -Unique)
    if ($orderedPaths.Count -eq 0) { return $dates }

    # Git starts once per chunk instead of once per file; the first appearance
    # of a path in the reverse-chronological log is its latest commit.
    $chunkSize = 40
    for ($offset = 0; $offset -lt $orderedPaths.Count; $offset += $chunkSize) {
        $last = [Math]::Min($offset + $chunkSize - 1, $orderedPaths.Count - 1)
        $chunk = @($orderedPaths[$offset..$last])
        $chunkSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
        foreach ($path in $chunk) { [void]$chunkSet.Add($path) }

        $pathspecs = @('--') + @($chunk | ForEach-Object { ":(literal)$_" })
        $logLines = @(git -c core.quotepath=false -C $repo log --format='COMMIT_DATE:%cI' --name-only --no-renames @pathspecs 2>$null)
        if ($LASTEXITCODE -ne 0) { continue }

        $currentDate = $null
        foreach ($line in $logLines) {
            $text = [string]$line
            if ($text.StartsWith('COMMIT_DATE:', [System.StringComparison]::Ordinal)) {
                $rawDate = $text.Substring('COMMIT_DATE:'.Length).Trim()
                try { $currentDate = [DateTimeOffset]::Parse($rawDate) } catch { $currentDate = $null }
                continue
            }
            if ($null -ne $currentDate -and $chunkSet.Contains($text) -and -not $dates.ContainsKey($text)) {
                $dates[$text] = $currentDate
            }
        }
    }

    # Keep the old single-path lookup as a narrow fallback for unusual Git
    # output or paths that have no visible entry in a batched response.
    foreach ($path in $orderedPaths) {
        if (-not $dates.ContainsKey($path)) { $dates[$path] = Get-LastCommit $repo $path }
    }
    return $dates
}

$functionCategories = [ordered]@{
    1 = '广告过滤与隐私'
    2 = '账号、签到与自动任务'
    3 = '会员、订阅与授权解锁'
    4 = '应用增强与功能重写'
    5 = '影音、音乐与字幕'
    6 = 'AI、学习与阅读'
    7 = '社交与资讯'
    8 = '电商、价格与生活服务'
    9 = '图片、摄影与创作'
    10 = '网络、DNS 与订阅'
    11 = '工具、面板与系统'
    12 = '游戏与娱乐'
    13 = '通用框架与格式转换'
    14 = '其他应用功能'
}

function Get-FunctionCategory([string]$source, [string]$path, [string]$hint = '') {
    $camelSplit = $path -creplace '([a-z0-9])([A-Z])', '$1 $2'
    $text = "$source $camelSplit $hint".ToLowerInvariant()
    $tokens = ($text -replace '[^a-z0-9]+', ' ').Trim()
    $compactPath = ($camelSplit.ToLowerInvariant() -replace '[^a-z0-9]+', '')
    $text = "$text $compactPath"

    $order = if (
        $text -match 'script-hub|boxjs|chavy\.box|rewrite-parser|script-converter|moduletool|sub-store|substore|loon_to_surge|qx_to_|resource-parser' -or
        $tokens -match '\b(parser|converter|toolkit|environment|framework|allinone)\b'
    ) { 13 }
    elseif (
        $text -match 'adblock|block.?ads|remove.?ads|anti.?ads|advert|adguard|privacy|tracker|tracking|splash|launch.?ad|1blocker|cleanup|去广告|广告|净化' -or
        $tokens -match '\b(ad|ads|advertising|reject)\b'
    ) { 1 }
    elseif (
        $text -match 'daily.?bonus|check.?in|sign.?in|get.?cookie|cookie|account|login|task|points|exchange|capture|auth|签到|积分|自动任务|获取.?cookie' -or
        $tokens -match '\b(daily|bonus|signin|checkin|token)\b'
    ) { 2 }
    elseif (
        $text -match 'revenuecat|premium|membership|entitlement|receipt|subscription.?unlock|crack|会员|订阅|权益|解锁' -or
        $tokens -match '\b(vip|pro|unlock|upgrade|license|iap)\b'
    ) { 3 }
    elseif (
        $text -match 'photo|camera|picsart|lightroom|meitu(?!an)|beauty|bazaart|vsco|oldroll|fimo|doka|retake|photoroom|scanner|wink|snow|b612|pixel|image|collart'
    ) { 9 }
    elseif (
        $text -match 'youtube|bilibili|spotify|netflix|disney|tiktok|douyin|soundcloud|ximalaya|xmly|kuwo|kugou|qqmusic|neteasemusic|music|audio|podcast|emby|mgtv|iqiyi|video|movie|anime|bangumi|manga|subtitle|dualsub|porn|stream|player|live|汽水音乐|喜马拉雅|哔哩哔哩|字幕|短剧' -or
        $tokens -match '\b(tv|bili|media)\b'
    ) { 5 }
    elseif (
        $text -match 'chatgpt|openai|claude|gemini|deepseek|duolingo|baicizhan|memrise|dictionary|translate|translation|english|language|lingo|learn|study|education|reader|reading|novel|yomu|wordduck|book|读不舍手|番茄小说|小说|阅读|词典|学习' -or
        $tokens -match '\b(ai|gpt|read|word)\b'
    ) { 6 }
    elseif (
        $text -match 'wechat|weixin|weibo|xiaohongshu|redbook|reddit|telegram|twitter|facebook|instagram|tieba|zhihu|v2ex|ithome|news|social|nicegram|soul|appraven|百度贴吧|linux\.do|社区|资讯'
    ) { 7 }
    elseif (
        $text -match 'taobao|tmall|pinduoduo|cainiao|meituan|eleme|didi|alipay|jingdong|jdprice|shopping|commerce|finance|bank|mall|travel|hotel|rail|train|flight|airport|coffee|food|coupon|xianyu|smzdm|京东|淘宝|拼多多|菜鸟|美团|慢慢买|什么值得买|闲鱼|比价|价格|库存监控' -or
        $tokens -match '\b(jd|pdd|price|shop|cart|12306)\b'
    ) { 8 }
    elseif (
        $text -match 'httpdns|speedtest|connectivity|network|proxy|server|cloudflare|redirect|mitm|wifi|github|geo.?location|node.?unlock' -or
        $tokens -match '\b(dns|ip|ping|vpn|url|http|sub|rule|network|airport)\b'
    ) { 10 }
    elseif (
        $text -match 'clipboard|document|fileball|notes|pdf|calendar|weather|maps?|location|spoofer|widget|shortcut|search|install|testflight|device|system|panel|tool|health|hrv|qr|download|upload|battery|clock'
    ) { 11 }
    elseif (
        $text -match 'game|steam|epic|playstation|xbox|mihoyo|genshin|honkai|superkickoff|sheep|pet|puzzle'
    ) { 12 }
    elseif ($source -eq 'app2smile/rules') { 1 }
    elseif ($source -in @('chavyleung/scripts', 'lowking/Scripts', 'NobyDa/Script')) { 2 }
    elseif ($source -in @('deezertidal/Surge_Module', 'cc63/Surge')) { 11 }
    elseif ($source -in @('KOP-XIAO/QuantumultX', 'SukkaW/Surge')) { 10 }
    elseif ($source -in @(
        'aleotoidayy/nghluan',
        'deezertidal/QuantumultX-Rewrite',
        'fmz200/wool_scripts',
        'Leslie159357/loon-plugin',
        'Maasea/sgmodule',
        'Moli-X/Resources',
        'VirgilClyne/GetSomeFries',
        'Yu9191/Rewrite'
    )) { 4 }
    elseif ($path -match '(?i)\.(plugin|sgmodule|lpx|snippet|conf|js)$') { 4 }
    else { 14 }

    $name = ($functionCategories.GetEnumerator() | Where-Object { [int]$_.Key -eq $order } | Select-Object -First 1).Value
    return [pscustomobject]@{ Order = $order; Name = $name }
}

function Get-TargetApp([string]$source, [string]$path) {
    $normalized = $path -replace '\\', '/'
    $parts = $normalized -split '/'
    $fileStem = [IO.Path]::GetFileNameWithoutExtension($parts[-1])
    $parent = if ($parts.Count -gt 1) { $parts[-2] } else { '' }
    $pathContext = (($parts | Select-Object -Last 6) -join ' ')
    $split = "$pathContext $parent $fileStem" -creplace '([a-z0-9])([A-Z])', '$1 $2'
    $split = $split -replace '[_\-.]+', ' '
    $split = $split -replace '\b(qx|sg|sgmodule|plugin|lpx|conf|snippet|mitm|response|request|body|header|script|js|beta|lite|task|daily|bonus|ads?|vip|crack|unlock|helper|remove|enhance|rewrite|module)\b', ' '
    $split = ($split -replace '\s+', ' ').Trim()
    $tokens = ($split -replace '[^a-zA-Z0-9]+', ' ').Trim().ToLowerInvariant()
    $compact = ($split.ToLowerInvariant() -replace '[^a-z0-9]+', '')
    $haystack = "$normalized $tokens $compact"

    if ($source -eq 'chxm1023/Rewrite' -and $normalized -eq 'Reheji.js') { return '多应用 RevenueCat（含读不舍手）' }
    if ($source -eq '89996462/Quantumult-X' -and $normalized -eq 'ycdz/DBSS.js') { return '读不舍手' }
    if ($source -eq 'ArrowJustDoIt/quantumultx' -and $normalized -eq 'jd/jd.js') { return '京东商品库存监控' }
    if ($normalized -match '(?i)(^|/)(jd[_ -]?(price|helper)|jdprice|JD_Helper|tb[_ -]?jdprices)([^/]*)(/|\.|$)' -or $normalized -match '京东比价') { return '京东商品比价 / 价格监控' }
    if ($source -eq 'zirawell/R-Store' -and $normalized -match '^Res/Scripts/AntiAd/wechatApplet\.') { return '微信小程序' }
    if ($normalized -match '(?i)bilibili.*(manga|comic)|bili.*comic|哔哩哔哩漫画') { return '哔哩哔哩漫画' }
    if ($normalized -match '(?i)fanqie.*(duanju|short.?drama)|番茄短剧') { return '番茄短剧' }
    if ($normalized -match '(?i)tiktok') { return 'TikTok' }
    if ($normalized -match '(?i)douyin|抖音') { return '抖音' }

    # R-Store carries the actual app/site name in a stable directory segment.
    # Use that metadata before broad terms such as Wechat or Alipay can win.
    if ($source -eq 'zirawell/R-Store' -and $normalized -match '^Rule/(?:QuanX|Surge)/Adblock/') {
        if ($normalized -match '^Rule/(?:QuanX|Surge)/Adblock/App/[^/]+/([^/]+)/') {
            $name = $Matches[1]
            if ($name -in @('功能类', '广告联盟')) { return "通用应用广告过滤：$name" }
            return $name
        }
        if ($normalized -match '^Rule/(?:QuanX|Surge)/Adblock/Applet/(Wechat|Alipay)/[^/]+/([^/]+)/') {
            $platform = if ($Matches[1] -eq 'Wechat') { '微信小程序' } else { '支付宝小程序' }
            $name = $Matches[2]
            if ($name -eq '通用类') { return "$platform：通用规则" }
            return "$platform：$name"
        }
        if ($normalized -match '^Rule/(?:QuanX|Surge)/Adblock/All/') { return '多应用广告过滤合集' }
        if ($normalized -match '^Rule/(?:QuanX|Surge)/Adblock/Web/[^/]+/([^/]+)/') { return "网站：$($Matches[1])" }
        if ($normalized -match '^Rule/(?:QuanX|Surge)/Adblock/Applet/Wechat/') { return '微信小程序通用广告规则' }
        if ($normalized -match '^Rule/(?:QuanX|Surge)/Adblock/Applet/Alipay/') { return '支付宝小程序通用广告规则' }
    }

    $targetRules = @(
        @{ Pattern = 'youtube|you tube'; Name = 'YouTube' }
        @{ Pattern = 'bilibili|bili bili|\bbili\b'; Name = '哔哩哔哩（Bilibili）' }
        @{ Pattern = 'duolingo'; Name = 'Duolingo' }
        @{ Pattern = 'spotify'; Name = 'Spotify' }
        @{ Pattern = 'netflix'; Name = 'Netflix' }
        @{ Pattern = 'disney'; Name = 'Disney+' }
        @{ Pattern = 'tiktok|tik tok|douyin|抖音'; Name = 'TikTok / 抖音' }
        @{ Pattern = 'soundcloud|sound cloud'; Name = 'SoundCloud' }
        @{ Pattern = 'ximalaya|xmly|喜马拉雅'; Name = '喜马拉雅' }
        @{ Pattern = 'kuwo|kugou|qq music|qqmusic|netease music|neteasemusic'; Name = '音乐服务（酷我/酷狗/网易云等）' }
        @{ Pattern = 'mgtv|iqiyi|emby|pornhub|porn|manga|anime|movie'; Name = '视频/影视服务' }
        @{ Pattern = 'wechat|weixin'; Name = '微信' }
        @{ Pattern = 'weibo'; Name = '微博' }
        @{ Pattern = 'xiaohongshu|redbook|xiao hong shu'; Name = '小红书' }
        @{ Pattern = 'reddit'; Name = 'Reddit' }
        @{ Pattern = 'telegram|nicegram'; Name = 'Telegram / Nicegram' }
        @{ Pattern = 'linux[._-]?do|linux\.do'; Name = 'linux.do（网站）' }
        @{ Pattern = 'twitter|facebook|instagram|v2ex|zhihu'; Name = '社交/社区网站' }
        @{ Pattern = 'tieba|baidutieba|百度贴吧'; Name = '百度贴吧' }
        @{ Pattern = 'baiducloud|baidunetdisk|baidupan|baiduyun|百度网盘'; Name = '百度网盘' }
        @{ Pattern = 'amap|gaode|高德地图'; Name = '高德地图' }
        @{ Pattern = 'cainiao|菜鸟'; Name = '菜鸟' }
        @{ Pattern = 'hongguo|hong guo|红果短剧|红果免费短剧'; Name = '红果短剧' }
        @{ Pattern = 'dubusheshou|dbss|reheji|读不舍手|com\.valo\.reader'; Name = '读不舍手' }
        @{ Pattern = 'fanqie|番茄小说'; Name = '番茄小说' }
        @{ Pattern = 'jingdong|\bjd\b|jdbj|京东'; Name = '京东' }
        @{ Pattern = 'taobao|tmall|淘宝|天猫'; Name = '淘宝 / 天猫' }
        @{ Pattern = 'pinduoduo|\bpdd\b|拼多多'; Name = '拼多多' }
        @{ Pattern = 'meituan|美团'; Name = '美团' }
        @{ Pattern = 'eleme|didi|alipay|12306|rail|train|flight|hotel|travel'; Name = '生活服务/出行平台' }
        @{ Pattern = 'manmanbuy|manmanmai|man man mai|慢慢买'; Name = '慢慢买' }
        @{ Pattern = 'qishuimusic|qi shui music|soda.?music|\bqishui\b|汽水音乐'; Name = '汽水音乐' }
        @{ Pattern = 'duolingo|baicizhan|memrise|dictionary|yomu|lingo|english|word|词典'; Name = '学习/词典应用' }
        @{ Pattern = 'coolapk|酷安'; Name = '酷安' }
        @{ Pattern = '(^|[/ _.-])keep([/ _.-]|$)|Keep去广告'; Name = 'Keep' }
        @{ Pattern = '(^|[/ _.-])soul([/ _.-]|$)|Soul去广告'; Name = 'Soul' }
        @{ Pattern = 'smzdm|什么值得买'; Name = '什么值得买' }
        @{ Pattern = 'xianyu|goofish|闲鱼'; Name = '闲鱼' }
        @{ Pattern = '10000|(^|[/ _.-])telecom([/ _.-]|$)|china.?telecom|中国电信'; Name = '中国电信' }
        @{ Pattern = '10010|(^|[/ _.-])unicom([/ _.-]|$)|china.?unicom|中国联通'; Name = '中国联通' }
        @{ Pattern = 'chatgpt|openai|\bgpt\b|\bai\b|claude|gemini|deepseek'; Name = 'AI 服务' }
        @{ Pattern = 'picsart|lightroom|meitu|beauty|vsco|fimo|doka|camera|photoroom|oldroll|b612|photoshop|pdfexpert'; Name = '图片/摄影/创作应用' }
        @{ Pattern = 'dns|httpdns|adguard|speedtest|ipcheck|ipinfo|network|proxy|substore|subscription|boxjs'; Name = '网络/代理/订阅工具' }
        @{ Pattern = 'github'; Name = 'GitHub' }
        @{ Pattern = 'itunes|app store|testflight|apple'; Name = 'Apple / App Store' }
        @{ Pattern = 'amap|gaode|baidumap|map'; Name = '地图/位置服务' }
        @{ Pattern = 'weather|caiyun|weatherkit'; Name = '天气服务' }
        @{ Pattern = 'notion'; Name = 'Notion' }
        @{ Pattern = 'xmind'; Name = 'XMind' }
    )
    foreach ($rule in $targetRules) {
        if ($haystack -match $rule.Pattern) { return $rule.Name }
    }

    if ($source -eq 'BOBOLAOSHIV587/Rules' -and $normalized -match '^(?:JS|Task)/([^/]+)/') {
        $name = ($Matches[1] -creplace '([a-z0-9])([A-Z])', '$1 $2') -replace '[_\-.]+', ' '
        $name = ($name -replace '\s+', ' ').Trim()
        if ($name -and $name -notin @('JS', 'Task', 'Tasks')) { return $name }
    }

    $generic = @('index', 'main', 'request', 'response', 'script', 'scripts', 'env', 'util', 'core', 'config', 'configuration', 'plugin', 'plugins', 'module', 'modules', 'conf', 'file', 'js', 'rewrite', 'filter', 'adblock', 'app', 'applet', 'quanx', 'quantumultx', 'surge', 'loon', 'rule', 'src', 'beta', 'official')
    $candidateSegments = @($fileStem) + @($parts[($parts.Count - 2)..0])
    $candidateMatches = @($candidateSegments | Where-Object {
        $_ -and $_.Length -gt 1 -and $_ -notmatch '^[A-Za-z0-9]$' -and $generic -notcontains $_.ToLowerInvariant()
    } | Sort-Object @{ Expression = { if ($_ -match '[\p{IsCJKUnifiedIdeographs}]') { 0 } else { 1 } } })
    $candidate = if ($candidateMatches.Count -gt 0) { [string]$candidateMatches[0] } else { '' }
    $candidate = ($candidate -creplace '([a-z0-9])([A-Z])', '$1 $2') -replace '[_\-.]+', ' '
    $candidate = ($candidate -replace '\s+', ' ').Trim()
    $candidate = ($candidate -replace '(去广告|广告过滤器|每日签到|签到|多地区解锁|解锁|配置管理|时间线修复|歌词翻译|歌词增强|重定向)$', '').Trim()
    if ($candidate) { return $candidate }
    return '通用脚本/多平台'
}

function Normalize-TargetName([string]$target) {
    if (-not $target) { return '通用脚本/多平台' }
    $value = ($target -replace '\s+', ' ').Trim()
    switch ($value.ToLowerInvariant()) {
        'soul' { return 'Soul' }
        'spotify' { return 'Spotify' }
        'soda music' { return '汽水音乐' }
        'tkdy' { return '抖音' }
        'amp dache' { return '高德打车' }
        '哔哩哔哩' { return '哔哩哔哩（Bilibili）' }
        'bilibili' { return '哔哩哔哩（Bilibili）' }
        'duolingo' { return 'Duolingo' }
        default { return $value }
    }
}

function Get-Purpose([string]$category, [string]$path, [string]$type, [string]$source, [string]$hint = '') {
    $split = (("$path $hint" -replace '\\', '/') -creplace '([a-z0-9])([A-Z])', '$1 $2').ToLowerInvariant()
    if ($split -match 'linuxdo-ios16') { return '修复 iOS 16.2 WebKit 对 linux.do 新语法的兼容问题' }
    if ($split -match 'hongguo.*(adblock|ad)|红果') { return '拦截红果短剧广告请求并避免播放器反复重试' }
    if ($source -eq 'ArrowJustDoIt/quantumultx' -and $split -match '(^|/)jd/jd\.js$') { return '监控脚本内指定的京东 SKU 库存并发送通知' }
    if ($split -match 'jd[_ -]?(price|helper)|jdprice|京东比价') { return '京东商品历史价格、比价或价格监控' }
    if ($split -match 'reheji|dbss|读不舍手') { return '读不舍手订阅权益与 RevenueCat 响应处理' }
    if ($split -match 'cookie|get.?cookie') { return '获取或管理 Cookie / 登录凭据' }
    if ($split -match 'request|header') { return '请求头重写或请求拦截' }
    if ($split -match 'response|body') { return '响应内容重写或接口数据处理' }
    $hasTask = $split -match 'daily|bonus|check.?in|sign.?in|signin|签到'
    $hasAdBlock = $split -match '(^|[^a-z])ads?([^a-z]|$)|advert|adblock|remove.?ads|privacy|tracker|tracking|去广告|广告|净化'
    if ($hasAdBlock -and $hasTask) { return '去广告、拦截追踪与隐私保护，并含签到或自动任务' }
    if ($hasAdBlock) { return '去广告、拦截追踪与隐私保护' }
    if ($hasTask) { return '签到、领取奖励或自动任务' }
    if ($split -match 'revenuecat|receipt|entitlement|vip|premium|unlock|crack|iap|会员|订阅|权益|解锁') { return '会员权益或高级功能解锁' }

    switch ($category) {
        '广告过滤与隐私' { return '去广告、拦截追踪与隐私保护' }
        '账号、签到与自动任务' { return '账号、积分、签到或自动化任务' }
        '会员、订阅与授权解锁' { return '会员权益、订阅或授权功能处理' }
        '应用增强与功能重写' {
            if ($type -eq 'Loon') { return 'Loon 应用插件与接口重写' }
            if ($type -eq 'Surge') { return 'Surge 模块与应用接口重写' }
            if ($type -like 'QX*') { return 'Quantumult X 重写配置或脚本' }
            return '应用接口重写与功能增强'
        }
        '影音、音乐与字幕' { return '影音播放、音频、字幕或媒体接口增强' }
        'AI、学习与阅读' { return 'AI、学习、词典或阅读功能增强' }
        '社交与资讯' { return '社交、资讯内容处理或接口重写' }
        '电商、价格与生活服务' { return '价格、优惠、生活服务或电商接口增强' }
        '图片、摄影与创作' { return '图片编辑、摄影或创作功能增强' }
        '网络、DNS 与订阅' {
            if ($split -match 'dns|httpdns') { return 'DNS / HTTPDNS 处理与隐私保护' }
            if ($split -match 'sub|subscription|substore') { return '订阅管理、转换或资源聚合' }
            if ($split -match 'speed|ping|ip|network|connectivity') { return '网络检测、测速或状态查询' }
            return '网络、代理或请求规则处理'
        }
        '工具、面板与系统' { return '面板、系统状态、文件或通用工具功能' }
        '游戏与娱乐' { return '游戏或娱乐应用功能增强' }
        '通用框架与格式转换' { return '脚本框架、规则解析或格式转换' }
        default { return '应用脚本或接口功能处理' }
    }
}

function Add-Entry([System.Collections.Generic.List[object]]$entries, [string]$source, [string]$branch, [string]$base, [string]$repo, [string]$path, [string]$type, [object]$date = $null) {
    $normalized = $path -replace '\\', '/'
    $encodedPath = (($normalized -split '/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    $url = "$base/$encodedPath"
    $tree = Get-TreeCache $repo
    $blob = if ($tree.ContainsKey($normalized)) { $tree[$normalized] } else { '' }
    $commitDate = if ($null -eq $date) { Get-LastCommit $repo $path } else { [DateTimeOffset]$date }
    $entries.Add([pscustomobject]@{
        Date = $commitDate
        Source = $source
        Type = $type
        Path = $normalized
        Url = $url
        Blob = $blob
        Repo = $repo
    })
}

function Add-RepoEntries(
    [System.Collections.Generic.List[object]]$entries,
    [string]$repo,
    [string]$source,
    [string]$base,
    [scriptblock]$include,
    [scriptblock]$typeResolver
) {
    if (-not (Test-Path (Join-Path $repo '.git'))) {
        Write-Warning "Skipping unavailable audit repository: $source ($repo)"
        return
    }
    $allPaths = @(git -c core.quotepath=false -C $repo ls-tree -r --name-only HEAD)
    $paths = [System.Collections.Generic.List[string]]::new()
    foreach ($path in $allPaths) {
        if (& $include $path) { [void]$paths.Add([string]$path) }
    }
    $dates = Get-LastCommitMap $repo ([string[]]$paths)
    foreach ($path in $paths) {
        $type = & $typeResolver $path
        $date = if ($dates.ContainsKey($path)) { $dates[$path] } else { $null }
        Add-Entry $entries $source '' $base $repo $path $type $date
    }
}

$entries = [System.Collections.Generic.List[object]]::new()

# Leslie: native Loon plugins, Surge modules, QX configs/scripts, and related JS.
$lesliePaths = git -c core.quotepath=false -C $LeslieRepo ls-tree -r --name-only HEAD | Where-Object {
    $_ -match '\.(plugin|sgmodule|qx|conf|js)$' -and
    $_ -notmatch '(^|/)(README|test|tests|create_gist)([^/]*|/)' -and
    $_ -notmatch '(^|/)scripts/'
}
$leslieDates = Get-LastCommitMap $LeslieRepo ([string[]]$lesliePaths)
foreach ($path in $lesliePaths) {
    $type = if ($path -match '\.plugin$') { 'Loon' } elseif ($path -match '\.sgmodule$') { 'Surge' } elseif ($path -match '\.(qx|conf)$' -or $path -match '(?i)_qx\.js$') { 'QX' } else { 'JS' }
    Add-Entry $entries 'Leslie159357/loon-plugin' 'main' 'https://raw.githubusercontent.com/Leslie159357/loon-plugin/main' $LeslieRepo $path $type $leslieDates[[string]$path]
}

# Moli: files in the explicitly relevant platform directories.
$moliPaths = git -c core.quotepath=false -C $MoliRepo ls-tree -r --name-only HEAD | Where-Object {
    (($_ -match '^Loon/.+\.plugin$') -or
     ($_ -match '^QuantumultX/Rewrite/.+\.conf$') -or
     ($_ -match '^QuantumultX/Rewrite/Script/.+\.js$') -or
     ($_ -match '^Rewrite/.+\.conf$') -or
     ($_ -match '^Script/.+\.js$') -or
     ($_ -match '^Surge/Module/.+\.sgmodule$')) -and
    $_ -notmatch '(^|/)(README|test|tests)([^/]*|/)' -and
    $_ -notmatch '(?i)(^|/)(convert|parser|script-converter)'
}
$moliDates = Get-LastCommitMap $MoliRepo ([string[]]$moliPaths)
foreach ($path in $moliPaths) {
    $type = if ($path -match '^Loon/') { 'Loon' } elseif ($path -match '^Surge/Module/') { 'Surge' } elseif ($path -match '^QuantumultX/Rewrite/Script/') { 'QX JS' } elseif ($path -match '\.conf$') { 'QX' } else { 'JS' }
    Add-Entry $entries 'Moli-X/Resources' 'main' 'https://raw.githubusercontent.com/Moli-X/Resources/main' $MoliRepo $path $type $moliDates[[string]$path]
}

# aleotoidayy: all native Surge modules and JS response/request scripts, plus the QX aggregate rewrite.
$aleotoPaths = git -c core.quotepath=false -C $AleotoRepo ls-tree -r --name-only HEAD | Where-Object {
    ($_ -match '\.sgmodule$' -or $_ -match '\.js$' -or $_ -eq 'cutcho.conf') -and
    $_ -notmatch '\.(stoverride|jpg|jpeg|png|json)$' -and
    $_ -notmatch '(^|/)(README|test|tests)([^/]*|/)'
}
$aleotoDates = Get-LastCommitMap $AleotoRepo ([string[]]$aleotoPaths)
foreach ($path in $aleotoPaths) {
    $type = if ($path -match '\.sgmodule$') { 'Surge' } elseif ($path -eq 'cutcho.conf') { 'QX' } else { 'JS' }
    Add-Entry $entries 'aleotoidayy/nghluan' 'aleoo' 'https://raw.githubusercontent.com/aleotoidayy/nghluan/aleoo' $AleotoRepo $path $type $aleotoDates[[string]$path]
}

# Additional public repositories discovered through GitHub search and audited by tree/history.
# Keep platform entry points and runnable scripts; exclude rule-only, archive, build, and test trees.
Add-RepoEntries $entries (Join-Path $ExternalRoot 'Repcz__Tool-audit') 'Repcz/Tool' 'https://raw.githubusercontent.com/Repcz/Tool/X' {
    param($p)
    $p -match '^Loon/Loon\.conf$' -or
    $p -match '^QuantumultX/QuantumultX\.conf$' -or
    $p -match '^QuantumultX/Rewrite/.+\.snippet$' -or
    $p -match '^Surge/Module/.+\.sgmodule$' -or
    $p -match '^Surge/Script/.+\.js$'
} {
    param($p)
    if ($p -match '^Loon/') { 'Loon' } elseif ($p -match '^Surge/Module/') { 'Surge' } elseif ($p -match '^QuantumultX/') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Keywos__rule-audit') 'Keywos/rule' 'https://raw.githubusercontent.com/Keywos/rule/main' {
    param($p)
    ($p -match '^(loon|module|script|JS)/.+\.(plugin|sgmodule|lpx|snippet|conf|js)$' -or $p -match '^rename\.js$') -and
    $p -notmatch '(?i)(^|/)(mocks|old|test|tests|backup)(/|$)' -and
    $p -notmatch '(?i)(_dev|\.beta)\.(js|conf)$'
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } elseif ($p -match '\.sgmodule$') { 'Surge' } elseif ($p -match '\.(snippet|conf)$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'chavyleung__scripts-audit') 'chavyleung/scripts' 'https://raw.githubusercontent.com/chavyleung/scripts/master' {
    param($p)
    $p -match '(?i)\.(plugin|sgmodule|conf|js)$' -and
    $p -notmatch '(?i)(^|/)(achived|archive|box/scripts|box/switcher|debug|test|tests)(/|$)' -and
    $p -notmatch '(?i)\.har\.sgmodule$' -and
    $p -notmatch '(?i)\.min\.js$'
} {
    param($p)
    if ($p -match '(?i)\.plugin$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)^QuantumultX|\.quanx\.conf$') { 'QX' } elseif ($p -match '(?i)^Loon\.') { 'Loon' } elseif ($p -match '(?i)\.conf$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Yu9191__Rewrite-audit') 'Yu9191/Rewrite' 'https://raw.githubusercontent.com/Yu9191/Rewrite/main' {
    param($p)
    $p -match '(?i)\.(plugin|sgmodule|lpx|snippet|conf|js)$' -and
    $p -notmatch '(?i)(^|/)(src|archive|test|tests|backup|token)(/|$)' -and
    $p -notmatch '(?i)(^|/)(rollup\.config\.js|package-lock\.json)$'
} {
    param($p)
    if ($p -match '(?i)\.(lpx|plugin)$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.(snippet|conf)$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'NobyDa__Script-audit') 'NobyDa/Script' 'https://raw.githubusercontent.com/NobyDa/Script/master' {
    param($p)
    $p -match '(?i)\.(plugin|sgmodule|snippet|conf|js)$' -and
    $p -notmatch '(?i)(^|/)(Debug|Rule-Storage|TestFlight|Time-based-One-Time-Password|test|tests)(/|$)' -and
    $p -notmatch '(?i)\.min\.js$'
} {
    param($p)
    if ($p -match '(?i)\.plugin$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.(snippet|conf)$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Script-Hub-Org__Script-Hub-audit') 'Script-Hub-Org/Script-Hub' 'https://raw.githubusercontent.com/Script-Hub-Org/Script-Hub/main' {
    param($p)
    ($p -match '^(modules/.+\.(plugin|sgmodule|conf)|scripts/.+\.js|[^/]+\.js)$') -and
    $p -notmatch '(?i)(^|/)(test|tests|node_modules|dist)(/|$)' -and
    $p -notmatch '(?i)(^|/)(\.prettierrc\.js|ignored-build-step\.js)$'
} {
    param($p)
    if ($p -match '(?i)\.plugin$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.conf$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'VirgilClyne__GetSomeFries-audit') 'VirgilClyne/GetSomeFries' 'https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main' {
    param($p)
    $p -match '(?i)^(modules|plugin|sgmodule|snippet|js)/.+\.(plugin|sgmodule|snippet|conf|js)$' -and
    $p -notmatch '(?i)(^|/)(archive|src|function|test|tests)(/|$)' -and
    $p -notmatch '(?i)\.beta\.'
} {
    param($p)
    if ($p -match '(?i)\.plugin$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.(snippet|conf)$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'app2smile__rules-audit') 'app2smile/rules' 'https://raw.githubusercontent.com/app2smile/rules/master' {
    param($p)
    $p -match '(?i)^(module|plugin|js)/.+\.(plugin|sgmodule|conf|js)$' -and
    $p -notmatch '(?i)(test|backup|bak)'
} {
    param($p)
    if ($p -match '(?i)\.plugin$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.conf$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'yichahucha__surge-audit') 'yichahucha/surge' 'https://raw.githubusercontent.com/yichahucha/surge/master' {
    param($p)
    $p -match '(?i)\.(sgmodule|conf|js)$'
} {
    param($p)
    if ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.conf$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'KOP-XIAO__QuantumultX-audit') 'KOP-XIAO/QuantumultX' 'https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master' {
    param($p)
    $p -match '^Scripts/.+\.js$' -or $p -eq 'HotKids-JS/scripts.conf'
} {
    param($p)
    if ($p -match '\.conf$') { 'QX' } else { 'QX JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'SukkaW__Surge-audit') 'SukkaW/Surge' 'https://raw.githubusercontent.com/SukkaW/Surge/master' {
    param($p)
    $p -match '^Modules/.+\.sgmodule$'
} {
    param($p)
    'Surge'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'deezertidal__QuantumultX-Rewrite') 'deezertidal/QuantumultX-Rewrite' 'https://raw.githubusercontent.com/deezertidal/QuantumultX-Rewrite/master' {
    param($p)
    $p -match '^rewrite/.+\.(conf|js)$' -and
    $p -notmatch '(?i)(^|/)(test|tests|archive|backup)(/|$)'
} {
    param($p)
    if ($p -match '\.js$') { 'QX JS' } else { 'QX' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'deezertidal__Surge_Module') 'deezertidal/Surge_Module' 'https://raw.githubusercontent.com/deezertidal/Surge_Module/master' {
    param($p)
    $p -match '^files/.+\.js$'
} {
    param($p)
    'JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'fmz200__wool_scripts-audit') 'fmz200/wool_scripts' 'https://raw.githubusercontent.com/fmz200/wool_scripts/main' {
    param($p)
    (($p -match '^Loon/plugin/[^/]+\.(plugin|lpx)$') -or
     ($p -match '^QuantumultX/rewrite/.+\.(conf|snippet)$') -or
     ($p -match '^QuantumultX/scripts/.+\.js$') -or
     ($p -match '^Scripts/.+\.(js|snippet)$')) -and
    $p -notmatch '(?i)(^|/)(split|archive|test|tests|template)(/|$)' -and
    $p -notmatch '(?i)(_dev|\.min)\.js$' -or
    $p -match '^Loon/plugin/split/partQ/QiShuiMusic\.lpx$' -or
    $p -match '^QuantumultX/rewrite/split/partQ/QiShuiMusic\.snippet$' -or
    $p -match '^Surge/module/split/partQ/QiShuiMusic\.sgmodule$'
} {
    param($p)
    if ($p -match '^Loon/') { 'Loon' } elseif ($p -match '^Surge/') { 'Surge' } elseif ($p -match '^QuantumultX/scripts/') { 'QX JS' } elseif ($p -match '^QuantumultX/') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Maasea__sgmodule-audit') 'Maasea/sgmodule' 'https://raw.githubusercontent.com/Maasea/sgmodule/master' {
    param($p)
    (($p -match '^[^/]+\.sgmodule$') -or
     ($p -match '^Script/(Bilibili|Keep|Tools|WeRead|Youtube)/.+\.js$')) -and
    $p -notmatch '(?i)(^|/)(src|lib|build|test|tests)(/|$)'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'cc63__Surge-audit') 'cc63/Surge' 'https://raw.githubusercontent.com/cc63/Surge/main' {
    param($p)
    $p -match '^Module/.+\.(sgmodule|js)$' -and
    $p -notmatch '(?i)(test|beta|_TF)'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'lowking__Scripts-audit') 'lowking/Scripts' 'https://raw.githubusercontent.com/lowking/Scripts/master' {
    param($p)
    $p -match '(?i)\.(sgmodule|js)$' -and
    $p -notmatch '(?i)(^|/)(Scriptable|tempermonkey|example|test|tests)(/|$)' -and
    $p -notmatch '(?i)(removed|\.min\.js$)'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'blackmatrix7__ios_rule_script-audit') 'blackmatrix7/ios_rule_script' 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master' {
    param($p)
    ((($p -match '^rewrite/Loon/.+\.plugin$') -or
     ($p -match '^rewrite/QuantumultX/.+\.conf$') -or
     ($p -match '^rewrite/Surge/.+\.sgmodule$') -or
     ($p -match '^script/(applestore|luka|quora|startup|tieba|zheye)/.+\.(js|sgmodule|plugin|conf|snippet)$')) -and
    $p -notmatch '(?i)(^|/)(archive|test|tests)(/|$)') -or
    $p -match '^script/archive/manmanbuy/.+\.(js|qxrewrite|sgmodule|lnscript)$'
} {
    param($p)
    if ($p -match '(?i)\.(plugin|lnscript)$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } elseif ($p -match '(?i)\.(conf|snippet|qxrewrite)$') { 'QX' } else { 'JS' }
}

# Additional original or independently maintained ecosystems discovered during the wider audit.
Add-RepoEntries $entries (Join-Path $ExternalRoot 'ddgksf2013__Rewrite-audit') 'ddgksf2013/Rewrite' 'https://raw.githubusercontent.com/ddgksf2013/Rewrite/master' {
    param($p)
    $p -match '^(AdBlock|Function|Html)/.+\.conf$'
} {
    param($p)
    'QX'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'ddgksf2013__Scripts-audit') 'ddgksf2013/Scripts' 'https://raw.githubusercontent.com/ddgksf2013/Scripts/master' {
    param($p)
    $p -match '^[^/]+\.js$' -and $p -notmatch '(?i)^(demo|sample)\.js$'
} {
    param($p)
    'JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'QingRex__LoonKissSurge-audit') 'QingRex/LoonKissSurge' 'https://raw.githubusercontent.com/QingRex/LoonKissSurge/main' {
    param($p)
    $p -match '^Surge/[^/]+\.sgmodule$'
} {
    param($p)
    'Surge'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'zirawell__R-Store-audit') 'zirawell/R-Store' 'https://raw.githubusercontent.com/zirawell/R-Store/main' {
    param($p)
    (($p -match '^Rule/QuanX/(Adblock/.+/rewrite/.+\.conf|Plugin/.+\.conf)$') -or
     ($p -match '^Rule/Surge/(Adblock/.+\.sgmodule|Plugin/.+\.sgmodule|Redirect/.+\.sgmodule|Revision/.+\.sgmodule)$') -or
     ($p -match '^Res/Scripts/.+\.js$')) -and
    $p -notmatch '(?i)(^|/)(archive|test|tests|backup)(/|$)' -and
    $p -notmatch '(?i)(\.dev|\.min)\.js$'
} {
    param($p)
    if ($p -match '^Rule/QuanX/') { 'QX' } elseif ($p -match '^Rule/Surge/') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'limbopro__Adblock4limbo-audit') 'limbopro/Adblock4limbo' 'https://raw.githubusercontent.com/limbopro/Adblock4limbo/main' {
    param($p)
    (($p -match '^QuantumultX/rewrite/.+\.conf$') -or
     ($p -match '^Surge/rewrite/.+\.sgmodule$') -or
     ($p -match '^Adguard/(Adblock4limbo|contentFarm|skipVideoAds|WebDebugger|ScriptFind)[^/]*\.js$')) -and
    $p -notmatch '(?i)(^|/)sample\.(conf|sgmodule)$'
} {
    param($p)
    if ($p -match '^QuantumultX/') { 'QX' } elseif ($p -match '^Surge/') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'ClydeTime__Surge-audit') 'ClydeTime/Surge' 'https://raw.githubusercontent.com/ClydeTime/Surge/main' {
    param($p)
    $p -match '^(Script|Task)/.+\.(sgmodule|js)$' -and
    $p -notmatch '(?i)(^|/)protobuf(/|$)' -and
    $p -notmatch '(?i)(\.dev|\.min)\.js$'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Tartarus2014__For-own-use-audit') 'Tartarus2014/For-own-use' 'https://raw.githubusercontent.com/Tartarus2014/For-own-use/master' {
    param($p)
    $p -match '^Loon/Plugin/.+\.lpx$' -or $p -match '^Surge/Module/.+\.sgmodule$'
} {
    param($p)
    if ($p -match '^Loon/') { 'Loon' } else { 'Surge' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Peng-YM__QuanX-audit') 'Peng-YM/QuanX' 'https://raw.githubusercontent.com/Peng-YM/QuanX/master' {
    param($p)
    $p -match '^(Rewrites|Tasks|Tools)/.+\.(plugin|sgmodule|js)$' -and
    $p -notmatch '(?i)(^|/)(test|tests|example)(/|\.|$)' -and
    $p -notmatch '(?i)(\.dev|\.min)\.js$'
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } elseif ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'Sliverkiss__QuantumultX-audit') 'Sliverkiss/QuantumultX' 'https://raw.githubusercontent.com/Sliverkiss/QuantumultX/main' {
    param($p)
    ($p -match '^(AdBlock|Crack|Script)/.+\.(snippet|conf|sgmodule|js)$' -or
     $p -match '^quantumultX_.+\.js$') -and
    $p -notmatch '(?i)(\.dev|\.min)\.js$'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } elseif ($p -match '\.(snippet|conf)$') { 'QX' } else { 'QX JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'wf021325__qx-audit') 'wf021325/qx' 'https://raw.githubusercontent.com/wf021325/qx/main' {
    param($p)
    $p -match '^(js|task)/.+\.js$' -and $p -notmatch '(?i)xxtea'
} {
    param($p)
    'QX JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'DualSubs__Universal-audit') 'DualSubs/Universal' 'https://raw.githubusercontent.com/DualSubs/Universal/main' {
    param($p)
    $p -match '^modules/.+\.sgmodule$' -or
    ($p -match '^src/(Composite\.Subtitles|External\.Lyrics|External\.Subtitles|Manifest|Translate)\.response\.js$')
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'DualSubs__YouTube-audit') 'DualSubs/YouTube' 'https://raw.githubusercontent.com/DualSubs/YouTube/main' {
    param($p)
    $p -match '^modules/.+\.sgmodule$' -or $p -match '^src/(request|response)\.js$'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'DualSubs__Spotify-audit') 'DualSubs/Spotify' 'https://raw.githubusercontent.com/DualSubs/Spotify/main' {
    param($p)
    (($p -match '^modules/.+\.(plugin|sgmodule|snippet)$') -or
     ($p -match '^js/.+\.response\.js$')) -and
    $p -notmatch '(?i)beta'
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } elseif ($p -match '\.sgmodule$') { 'Surge' } elseif ($p -match '\.snippet$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'BiliUniverse__ADBlock-audit') 'BiliUniverse/ADBlock' 'https://raw.githubusercontent.com/BiliUniverse/ADBlock/main' {
    param($p)
    $p -match '^src/(request|response)\.js$'
} {
    param($p)
    'JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'BiliUniverse__Enhanced-audit') 'BiliUniverse/Enhanced' 'https://raw.githubusercontent.com/BiliUniverse/Enhanced/main' {
    param($p)
    $p -eq 'src/response.js' -or $p -match '^unreleased/.+\.(plugin|sgmodule|snippet|js)$'
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } elseif ($p -match '\.sgmodule$') { 'Surge' } elseif ($p -match '\.snippet$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'BiliUniverse__Global-audit') 'BiliUniverse/Global' 'https://raw.githubusercontent.com/BiliUniverse/Global/main' {
    param($p)
    $p -match '^src/(request|response)\.js$' -or $p -match '^unreleased/.+\.(plugin|sgmodule|snippet|js)$'
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } elseif ($p -match '\.sgmodule$') { 'Surge' } elseif ($p -match '\.snippet$') { 'QX' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'BiliUniverse__Redirect-audit') 'BiliUniverse/Redirect' 'https://raw.githubusercontent.com/BiliUniverse/Redirect/main' {
    param($p)
    $p -match '^modules/.+\.sgmodule$' -or $p -match '^src/(request|response)\.js$'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'BiliUniverse__Roaming-audit') 'BiliUniverse/Roaming' 'https://raw.githubusercontent.com/BiliUniverse/Roaming/main' {
    param($p)
    $p -match '^(js/.+\.js|modules/.+\.sgmodule)$'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'yakkoelgento__loon-linuxdo-ios16-fix-audit') 'yakkoelgento/loon-linuxdo-ios16-fix' 'https://raw.githubusercontent.com/yakkoelgento/loon-linuxdo-ios16-fix/main' {
    param($p)
    $p -in @('linuxdo-ios16-fix.plugin', 'linuxdo-ios16-staticblock-fix.js')
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'githubdulong__Script-audit') 'githubdulong/Script' 'https://raw.githubusercontent.com/githubdulong/Script/master' {
    param($p)
    (($p -match '^Surge/.+\.sgmodule$') -or
     ($p -match '^QuantumultX/.+\.conf$') -or
     ($p -match '^Loon/.+\.conf$') -or
     ($p -match '^[^/]+\.(js|sgmodule)$')) -and
    $p -notmatch '(?i)^(mock|index)\.js$'
} {
    param($p)
    if ($p -match '\.sgmodule$') { 'Surge' } elseif ($p -match '^QuantumultX/') { 'QX' } elseif ($p -match '^Loon/') { 'Loon' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'mw418__Loon-audit') 'mw418/Loon' 'https://raw.githubusercontent.com/mw418/Loon/main' {
    param($p)
    ($p -match '^plugin/.+\.plugin$' -or $p -match '^script/.+\.js$') -and
    $p -notmatch '(?i)(^|/)(test|bak)[^/]*\.js$'
} {
    param($p)
    if ($p -match '\.plugin$') { 'Loon' } else { 'JS' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'chxm1023__Rewrite-main-audit') 'chxm1023/Rewrite' 'https://raw.githubusercontent.com/chxm1023/Rewrite/main' {
    param($p)
    $p -eq 'Reheji.js'
} {
    param($p)
    'QX JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot '89996462__Quantumult-X-audit') '89996462/Quantumult-X' 'https://raw.githubusercontent.com/89996462/Quantumult-X/main' {
    param($p)
    $p -eq 'ycdz/DBSS.js'
} {
    param($p)
    'QX JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'ziyuxingyuan__Script-audit') 'ziyuxingyuan/Script' 'https://raw.githubusercontent.com/ziyuxingyuan/Script/main' {
    param($p)
    $p -eq 'HongguoShortDramaAdBlock.js'
} {
    param($p)
    'JS'
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'ArrowJustDoIt__quantumultx-audit') 'ArrowJustDoIt/quantumultx' 'https://raw.githubusercontent.com/ArrowJustDoIt/quantumultx/main' {
    param($p)
    $p -eq 'jd/jd.js'
} {
    param($p)
    'QX JS'
}

# Active multi-platform collections found in the wider repository audit. Keep
# only importable entry files; their referenced helper scripts remain internal.
Add-RepoEntries $entries (Join-Path $ExternalRoot 'BOBOLAOSHIV587__Rules-audit') 'BOBOLAOSHIV587/Rules' 'https://raw.githubusercontent.com/BOBOLAOSHIV587/Rules/main' {
    param($p)
    (($p -match '^(JS|Task)/[^/]+/.+\.(plugin|sgmodule|conf)$') -or
     ($p -match '^Loon/.+\.plugin$') -or
     ($p -match '^QuantumultX/.+\.conf$') -or
     ($p -match '^Surge/.+\.(sgmodule|plugin|conf)$')) -and
    $p -notmatch '(?i)(^|/)(archive|backup|bak|old|test|tests|example|template|node_modules|dist|src)(/|$)' -and
    $p -notmatch '(?i)(\.dev|\.beta)\.'
} {
    param($p)
    if ($p -match '(?i)\.plugin$') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } else { 'QX' }
}

Add-RepoEntries $entries (Join-Path $ExternalRoot 'baiitang__Sakura-audit') 'baiitang/Sakura' 'https://raw.githubusercontent.com/baiitang/Sakura/main' {
    param($p)
    (($p -match '^Loon/(Online|Plugin)/.+\.plugin$') -or
     ($p -eq 'Loon/Loon.conf') -or
     ($p -match '^Quanx/Rewrites/.+\.(conf|snippet)$') -or
     ($p -eq 'Quanx/QuantumultX.conf') -or
     ($p -match '^Surge/(Local|Module|Online|Signin)/.+\.sgmodule$')) -and
    $p -notmatch '(?i)(^|/)(archive|backup|bak|old|test|tests|example|template)(/|$)'
} {
    param($p)
    if ($p -match '(?i)\.plugin$' -or $p -eq 'Loon/Loon.conf') { 'Loon' } elseif ($p -match '(?i)\.sgmodule$') { 'Surge' } else { 'QX' }
}

# Exact URLs are always duplicate. Identical blobs of the same platform type are mirrors.
# Prefer confirmed upstream maintainers over collection/mirror repositories, then use time.
$confirmedUpstreams = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@(
    '89996462/Quantumult-X', 'app2smile/rules', 'ArrowJustDoIt/quantumultx',
    'BiliUniverse/ADBlock', 'BiliUniverse/Enhanced', 'BiliUniverse/Global', 'BiliUniverse/Redirect', 'BiliUniverse/Roaming',
    'blackmatrix7/ios_rule_script', 'chavyleung/scripts', 'chxm1023/Rewrite', 'ClydeTime/Surge',
    'ddgksf2013/Rewrite', 'ddgksf2013/Scripts', 'DualSubs/Spotify', 'DualSubs/Universal', 'DualSubs/YouTube',
    'githubdulong/Script', 'Keywos/rule', 'KOP-XIAO/QuantumultX', 'limbopro/Adblock4limbo', 'lowking/Scripts',
    'Maasea/sgmodule', 'mw418/Loon', 'NobyDa/Script', 'Peng-YM/QuanX', 'QingRex/LoonKissSurge',
    'Script-Hub-Org/Script-Hub', 'Sliverkiss/QuantumultX', 'SukkaW/Surge', 'Tartarus2014/For-own-use',
    'VirgilClyne/GetSomeFries', 'wf021325/qx', 'yakkoelgento/loon-linuxdo-ios16-fix', 'yichahucha/surge',
    'ziyuxingyuan/Script'
) | ForEach-Object { [void]$confirmedUpstreams.Add($_) }

$collectionSources = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@(
    'aleotoidayy/nghluan', 'baiitang/Sakura', 'BOBOLAOSHIV587/Rules',
    'deezertidal/QuantumultX-Rewrite', 'deezertidal/Surge_Module', 'Leslie159357/loon-plugin',
    'Moli-X/Resources', 'Repcz/Tool', 'Yu9191/Rewrite', 'zirawell/R-Store'
) | ForEach-Object { [void]$collectionSources.Add($_) }

function Get-SourcePreference([string]$source) {
    if ($confirmedUpstreams.Contains($source)) { return 0 }
    if ($collectionSources.Contains($source)) { return 2 }
    return 1
}

$urlUnique = $entries | Group-Object Url | ForEach-Object { $_.Group | Sort-Object Date -Descending | Select-Object -First 1 }
$unique = $urlUnique | Group-Object { if ($_.Blob) { "$($_.Type)|$($_.Blob)" } else { "$($_.Type)|$($_.Url)" } } | ForEach-Object {
    $_.Group | Sort-Object @{Expression={ Get-SourcePreference $_.Source }; Descending=$false}, @{Expression='Date'; Descending=$true}, @{Expression='Url'; Descending=$false} | Select-Object -First 1
}
$classified = foreach ($item in $unique) {
    $hint = Get-FileHint $item.Repo $item.Path
    $category = Get-FunctionCategory $item.Source $item.Path $hint
    $target = Normalize-TargetName (Get-TargetApp $item.Source $item.Path)
    $purpose = Get-Purpose $category.Name $item.Path $item.Type $item.Source $hint
    $item | Add-Member -NotePropertyName FunctionOrder -NotePropertyValue $category.Order -Force -PassThru |
        Add-Member -NotePropertyName Function -NotePropertyValue $category.Name -Force -PassThru |
        Add-Member -NotePropertyName Target -NotePropertyValue $target -Force -PassThru |
        Add-Member -NotePropertyName Purpose -NotePropertyValue $purpose -Force -PassThru
}
$sorted = $classified | Sort-Object @{Expression='FunctionOrder'; Descending=$false}, @{Expression='Date'; Descending=$true}, @{Expression='Url'; Descending=$false}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# 公开 Loon / Quantumult X / Surge / JS 链接索引')
$lines.Add('')
$lines.Add('先按功能分类，再按文件最后提交时间倒序；同一 raw URL 和同平台相同内容已去重。目标 App / 网站和用途依据文件名、路径、类型及仓库用途推断，复杂脚本请打开原文核对。收录 GitHub 公开仓库中的可直接使用文件链接。仓库公开不等于具备开源许可证，请分别遵守各来源许可和使用条款。')
$lines.Add('')
foreach ($source in ($sorted.Source | Sort-Object -Unique)) {
    $lines.Add("- 来源: https://github.com/$source")
}
$lines.Add('')
$lines.Add("共 $($sorted.Count) 条")
$lines.Add('')
 $lines.Add('| 功能 | 数量 |')
 $lines.Add('| --- | ---: |')
 foreach ($category in $functionCategories.GetEnumerator()) {
     $count = @($sorted | Where-Object FunctionOrder -eq $category.Key).Count
     $lines.Add("| $($category.Value) | $count |")
 }
foreach ($category in $functionCategories.GetEnumerator()) {
    $items = @($sorted | Where-Object FunctionOrder -eq $category.Key)
    if ($items.Count -eq 0) { continue }
    $lines.Add('')
    $lines.Add("## $($category.Value)")
    $lines.Add('')
    $lines.Add("共 $($items.Count) 条；本组内按更新时间倒序")
    $lines.Add('')
    $lines.Add('| 更新时间 | 类型 | 目标 App / 网站 | 功能 / 用途 | 来源 | 文件 | 直链 |')
    $lines.Add('| --- | --- | --- | --- | --- | --- | --- |')
    foreach ($item in $items) {
        $date = $item.Date.ToString('yyyy-MM-dd HH:mm:ss zzz')
        $target = $item.Target -replace '\|', '\|'
        $purpose = $item.Purpose -replace '\|', '\|'
        $lines.Add("| $date | $($item.Type) | $target | $purpose | $($item.Source) | ``$($item.Path)`` | $($item.Url) |")
    }
}

$outputPath = [System.IO.Path]::GetFullPath($Output)
[System.IO.File]::WriteAllLines($outputPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output "Wrote $($sorted.Count) entries to $outputPath"
