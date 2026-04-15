]633;E;{   echo "# RJAKA→GTC1 Preflight — ${TS}"\x3b   echo\x3b   echo "## DNS"\x3b   echo '```'\x3b   echo '$ dig +short rjaka.pro A'\x3b dig +short rjaka.pro A\x3b   echo '$ dig +short www.rjaka.pro A'\x3b dig +short www.rjaka.pro A\x3b   echo '$ dig +short rjaka.pro AAAA'\x3b dig +short rjaka.pro AAAA\x3b   echo '$ dig +short www.rjaka.pro AAAA'\x3b dig +short www.rjaka.pro AAAA\x3b   echo '```'\x3b   echo\x3b   echo "## Nginx domain references"\x3b   echo '```'\x3b   sudo -n grep -R --line-number -E 'server_name\\\\s+.*rjaka\\\\.pro|rjaka\\\\.pro' /etc/nginx/sites-enabled /etc/nginx/sites-available 2>/dev/null || true\x3b   echo '```'\x3b   echo\x3b   echo "## Certbot live dirs"\x3b   echo '```'\x3b   sudo -n ls -1 /etc/letsencrypt/live 2>/dev/null || true\x3b   echo '```'\x3b   echo\x3b   echo "## Root capability checks"\x3b   echo '```'\x3b   echo '$ sudo -n true'\x3b sudo -n true && echo OK || echo FAIL\x3b   echo '$ sudo -n nginx -t'\x3b sudo -n nginx -t || true\x3b   echo '```'\x3b } > "$OUT";bad4e749-7c42-4c9b-a842-7ac32b8971d3]633;C# RJAKA→GTC1 Preflight — 20260305-165728Z

## DNS
```
$ dig +short rjaka.pro A
185.230.63.107
185.230.63.186
185.230.63.171
$ dig +short www.rjaka.pro A
cdn1.wixdns.net.
td-premium-37-117.wixdns.net.
34.160.37.117
$ dig +short rjaka.pro AAAA
$ dig +short www.rjaka.pro AAAA
cdn1.wixdns.net.
td-premium-37-117.wixdns.net.
```

## Nginx domain references
```
```

## Certbot live dirs
```
README
agent.gtstor.com
app.gtstor.com
dev.gtstor.com
mcpn8n.gtstor.com
pay.gtstor.com
vs.gtstor.com
```

## Root capability checks
```
$ sudo -n true
OK
$ sudo -n nginx -t
