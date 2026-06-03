/*
Loon专用
2024-04-21 01:29:51
*/
let githubPrefix = "https://raw.githubusercontent.com/"
let githubProxyPrefix = "https://gh-proxy.com/"

var url = $request.url
var headers = $request.headers
delete headers.host
delete headers.Host

if (!url.startsWith(githubPrefix)) {
    $done({});
    return;
}

headers["host"] = "gh-proxy.com"
url = githubProxyPrefix + url

$done({url:url,headers:headers})
