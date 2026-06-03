#!name=GitHub加速
#!desc=此插件通过重定向至 https://gh-proxy.com/ 的方式解决GitHub的RAW资源下载困难的问题。由于镜像站为热心网友提供，可能无法保证服务的长期可用性。若开启此插件后无法下载RAW资源，可禁用此插件。
#!openUrl=https://apps.apple.com/app/id1477376905
#!author=可莉🅥[https://github.com/luestr/ProxyResource/blob/main/README.md]
#!tag=反代加速
#!system=
#!system_version=
#!loon_version=3.4.0(962)
#!homepage=https://hub.kelee.one
#!icon=https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/GitHub.png
#!select=镜像源,gh-proxy.com
#!date=2026-06-01 17:11:35

[Rule]
DOMAIN, gh-proxy.com, DIRECT

[Script]
http-request ^https:\/\/raw\.githubusercontent\.com\/ script-path=https://raw.githubusercontent.com/svipm/loon/github.js, tag=GitHub加速

[MitM]
hostname=raw.githubusercontent.com
