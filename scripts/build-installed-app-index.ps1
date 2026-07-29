param(
    [string]$InputFile = (Join-Path $PSScriptRoot '..\RESOURCE_LINKS.md'),
    [string]$Output = (Join-Path $PSScriptRoot '..\INSTALLED_APP_LINKS.md')
)

$ErrorActionPreference = 'Stop'

$rows = foreach ($line in Get-Content -LiteralPath $InputFile) {
    if ($line -notmatch '^\| 20') { continue }
    $parts = $line -split '\|'
    if ($parts.Count -lt 8) { continue }
    [pscustomobject]@{
        Date = [DateTimeOffset]::Parse($parts[1].Trim())
        Type = $parts[2].Trim()
        Target = $parts[3].Trim()
        Purpose = $parts[4].Trim()
        Source = $parts[5].Trim()
        Path = $parts[6].Trim(' ', '`')
        Url = $parts[7].Trim(' ', '|')
    }
}

# Patterns deliberately use path names, avoiding broad matches such as every Baidu or JD file.
$apps = @(
    [pscustomobject]@{ Name = '哔哩哔哩'; Pattern = '(?i)bilibili|(^|[/_.-])bili([/_.-]|$)|bangumi|哔哩哔哩'; Exclude = '(?i)manga|comic|漫画'; Note = '已排除独立的哔哩哔哩漫画 App 资源' }
    [pscustomobject]@{ Name = '百度网盘'; Pattern = '(?i)baiducloud|baidunetdisk|baidupan|baiduyun|baiduwangpan|baidu.*(cloud|netdisk|yun)|百度网盘'; Note = '' }
    [pscustomobject]@{ Name = '百度贴吧'; Pattern = '(?i)tieba|bdtieba|百度贴吧'; Note = '' }
    [pscustomobject]@{ Name = '高德地图'; Pattern = '(?i)amap|gaode|ampdache|高德地图'; Note = '' }
    [pscustomobject]@{ Name = '菜鸟'; Pattern = '(?i)cainiao|菜鸟'; Note = '' }
    [pscustomobject]@{ Name = 'Duolingo'; Pattern = '(?i)duolingo'; Note = '用户消息中的 duolinggo 按 Duolingo 处理' }
    [pscustomobject]@{ Name = '抖省省'; Pattern = '(?i)doushengsheng|dou.?sheng.?sheng|抖省省'; Note = '按 bundle com.ss.iphone.ugc.lifeservices 复查，暂无可靠 Loon / QX / Surge 资源' }
    [pscustomobject]@{ Name = '抖音'; Pattern = '(?i)douyin|(^|[/_.-])tkdy([/_.-]|$)|scripts/douyin|抖音'; Note = '已将仅适用于 TikTok 国际版的地区模块排除' }
    [pscustomobject]@{ Name = '读不舍手'; Pattern = '(?i)dubusheshou|du.?bu.?she.?shou|dbss|reheji|com\.valo\.reader|读不舍手'; Note = '已按 bundle com.valo.reader 核对' }
    [pscustomobject]@{ Name = '番茄小说'; Pattern = '(?i)fanqie|fanqienovel|tomato.*novel|番茄小说'; Exclude = '(?i)duanju|short.?drama|短剧'; Note = '已排除独立的番茄短剧资源' }
    [pscustomobject]@{ Name = 'linux.do'; Pattern = '(?i)linux[._-]?do'; Note = '当前明确命中主要用于旧 iOS 16.2 WebKit 兼容修复，并非通用增强' }
    [pscustomobject]@{ Name = 'GitHub'; Pattern = '(?i)github'; Note = '' }
    [pscustomobject]@{ Name = '红果短剧'; Pattern = '(?i)hongguo|hong.?guo.*(short|drama)|red.?fruit|红果短剧|红果免费短剧'; Note = '收录目标明确的广告请求处理脚本；没有把依赖失效镜像的配置入口算入' }
    [pscustomobject]@{ Name = '京东监控'; Pattern = '(?i)(jd|jingdong).*(monitor|watch)|monitor.*(jd|jingdong)|jd.*monitor|jd[_ -]?(price|helper)|jdprice|JD_Helper|京东.*(比价|价格|库存监控)|(^|/)jd/jd\.js$'; Note = '“京东监控”身份不唯一，暂按京东商品比价、历史价格和库存监控处理' }
    [pscustomobject]@{ Name = '京东'; Pattern = '(?i)(^|[/_.-])(jd|jingdong)([/_.-]|$)|jdprice|jd_cookie|jd_|jingdong'; Note = '' }
    [pscustomobject]@{ Name = 'kapi'; Pattern = '(?i)(^|[/_.-])kapi([/_.-]|$)'; Note = 'Kapi 名称不唯一；按 Kapi相机 bundle com.sensemobile.action 复查，暂无可靠代理资源' }
    [pscustomobject]@{ Name = 'Keep'; Pattern = '(?i)(^|[/_.-])keep([/_.-]|$)|keepads|keepstyle|keep_vip'; Note = '' }
    [pscustomobject]@{ Name = 'kelivo'; Pattern = '(?i)kelivo|psyche\.kelivo'; Note = '按官方 Kelivo（psyche.kelivo）复查；应用本身无广告、无追踪，暂无专用代理资源' }
    [pscustomobject]@{ Name = '酷安'; Pattern = '(?i)coolapk|酷安'; Note = '' }
    [pscustomobject]@{ Name = '慢慢买'; Pattern = '(?i)manmanmai|manmanbuy|man.?man.?mai|慢慢买'; Note = '' }
    [pscustomobject]@{ Name = '美团'; Pattern = '(?i)meituan|wmmeituan|美团'; Note = '' }
    [pscustomobject]@{ Name = '拼多多'; Pattern = '(?i)pinduoduo|(^|[/_.-])pdd([/_.-]|$)|拼多多'; Note = '' }
    [pscustomobject]@{ Name = '汽水音乐'; Pattern = '(?i)qishui|qi.?shui.*music|soda.*music|汽水音乐'; Note = '' }
    [pscustomobject]@{ Name = 'Soul'; Pattern = '(?i)(^|[/_. -])soul([/_. -]|$)|soul_ads'; Note = '' }
    [pscustomobject]@{ Name = '上岛记'; Pattern = '(?i)shangdaoji|shang.?dao.?ji|上岛记'; Note = '按 bundle xyz.wulonglin.PinToIsland 复查，暂无可靠代理资源' }
    [pscustomobject]@{ Name = '什么值得买'; Pattern = '(?i)smzdm|什么值得买'; Note = '' }
    [pscustomobject]@{ Name = '淘宝'; Pattern = '(?i)taobao|tmall|tbprice|tb_price|tbjd|淘宝|天猫'; Note = '' }
    [pscustomobject]@{ Name = '喜马拉雅'; Pattern = '(?i)ximalaya|xmly|喜马拉雅'; Note = '' }
    [pscustomobject]@{ Name = '闲鱼'; Pattern = '(?i)xianyu|goofish|闲鱼'; Note = '' }
    [pscustomobject]@{ Name = '移动爱家'; Pattern = '(?i)yidong.*aijia|mobile.*home|cmcc.*home|(^|[/_.-])aijia([/_.-]|$)|移动爱家'; Note = '按 bundle com.cmcc.zhihuiguanjia 复查，暂无可靠代理资源' }
    [pscustomobject]@{ Name = '中国电信'; Pattern = '(?i)(^|/)(10000|189)(/|\.)|china.*telecom|telecom|中国电信'; Note = '' }
    [pscustomobject]@{ Name = '中国联通'; Pattern = '(?i)(^|/)10010(/|\.)|china.*unicom|unicom|中国联通'; Note = '' }
)

$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$matched = [ordered]@{}
$total = 0
foreach ($app in $apps) {
    $items = @($rows | Where-Object {
            $haystack = "$($_.Path) $($_.Target)"
            $haystack -match $app.Pattern -and (-not $app.Exclude -or $haystack -notmatch $app.Exclude)
        } |
        Where-Object { $seen.Add($_.Url) } |
        Sort-Object @{Expression='Date'; Descending=$true}, @{Expression='Url'; Descending=$false})
    $matched[$app.Name] = [pscustomobject]@{ Definition = $app; Items = $items }
    $total += $items.Count
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# 我手机已安装 App 的 Loon / Quantumult X / Surge / JS 资源')
$lines.Add('')
$lines.Add('按 App / 网站分组；每组内按文件最后提交时间倒序。顶部汇总按命中次数列出主要适用目标和用途。目标和用途依据路径及文件头元数据推断，复杂脚本请打开原文核对。重复 raw URL 只保留一次。')
$lines.Add('')
$lines.Add("共命中 $total 条链接")
$lines.Add('')
$lines.Add('| App / 网站 | 实际适用目标 | 主要功能 / 用途 | 命中数 |')
$lines.Add('| --- | --- | --- | ---: |')
foreach ($entry in $matched.GetEnumerator()) {
    $targetGroups = @($entry.Value.Items | Group-Object Target |
        Sort-Object @{Expression='Count'; Descending=$true}, @{Expression='Name'; Descending=$false})
    $purposeGroups = @($entry.Value.Items | Group-Object Purpose |
        Sort-Object @{Expression='Count'; Descending=$true}, @{Expression='Name'; Descending=$false})
    if ($targetGroups.Count -eq 0) {
        $targetSummary = '暂无可靠资源'
    } else {
        $targetSummary = @($targetGroups | Select-Object -First 3 | ForEach-Object { "$($_.Name)（$($_.Count)）" }) -join '；'
        if ($targetGroups.Count -gt 3) { $targetSummary += '；等' }
    }
    if ($purposeGroups.Count -eq 0) {
        $purposeSummary = '暂无可靠资源'
    } else {
        $purposeSummary = @($purposeGroups | Select-Object -First 3 | ForEach-Object { "$($_.Name)（$($_.Count)）" }) -join '；'
        if ($purposeGroups.Count -gt 3) { $purposeSummary += '；等' }
    }
    $targetSummary = $targetSummary -replace '\|', '\|'
    $purposeSummary = $purposeSummary -replace '\|', '\|'
    $lines.Add("| $($entry.Key) | $targetSummary | $purposeSummary | $($entry.Value.Items.Count) |")
}

foreach ($entry in $matched.GetEnumerator()) {
    $app = $entry.Value.Definition
    $items = @($entry.Value.Items)
    $lines.Add('')
    $lines.Add("## $($app.Name)")
    $lines.Add('')
    if ($items.Count -eq 0) {
        $note = if ($app.Note) { $app.Note } else { '经当前公开来源复查，暂无明确命中' }
        $lines.Add("$note。")
        continue
    }
    if ($app.Note) { $lines.Add("备注：$($app.Note)。") }
    $lines.Add('')
    $lines.Add('| 更新时间 | 类型 | 目标 App / 网站 | 功能 / 用途 | 来源 | 文件 | 直链 |')
    $lines.Add('| --- | --- | --- | --- | --- | --- | --- |')
    foreach ($item in $items) {
        $target = $item.Target -replace '\|', '\|'
        $purpose = $item.Purpose -replace '\|', '\|'
        $lines.Add("| $($item.Date.ToString('yyyy-MM-dd HH:mm:ss zzz')) | $($item.Type) | $target | $purpose | $($item.Source) | ``$($item.Path)`` | $($item.Url) |")
    }
}

$lines.Add('')
$lines.Add('## 匹配说明')
$lines.Add('')
$lines.Add('未命中不代表仓库中绝对没有脚本，可能是文件名使用了别名、中文名或该 App 尚未有公开规则；这部分可作为下一轮定向搜索清单。')

[System.IO.File]::WriteAllLines([System.IO.Path]::GetFullPath($Output), $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output "Wrote $total app-specific entries to $Output"
