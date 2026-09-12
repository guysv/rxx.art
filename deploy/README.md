# Hosting rxx.art

The static site runs on `modarchive-tracker` (159.69.158.68), using Caddy
from Debian trixie-backports. Caddy runs as its own systemd service, starts at
boot, redirects HTTP to HTTPS, and obtains and renews the public TLS certificate
automatically. Keep inbound TCP ports 80 and 443 available. Caddy stores its
certificate state under `/var/lib/caddy`; preserve that directory.

`deploy/Caddyfile` is installed at `/etc/caddy/Caddyfile`. The document root is
`/srv/rxx.art/current`, a symlink to a release under `/srv/rxx.art/releases/`.
Only committed `www/` files are deployed. The repository and local worktrees
are not served. `www.rxx.art` is not configured because it has no DNS record.

To publish the current commit from the repository root:

```sh
release=$(git rev-parse HEAD)
ssh -T modarchive-tracker "mkdir -p /srv/rxx.art/releases/$release"
git archive HEAD:www | ssh -T modarchive-tracker "tar -xf - -C /srv/rxx.art/releases/$release"
ssh -T modarchive-tracker "ln -sfn /srv/rxx.art/releases/$release /srv/rxx.art/current.next && mv -Tf /srv/rxx.art/current.next /srv/rxx.art/current"
```

Static content updates need no service reload. To change the server configuration:

```sh
scp deploy/Caddyfile modarchive-tracker:/etc/caddy/Caddyfile.next
ssh -T modarchive-tracker 'caddy validate --config /etc/caddy/Caddyfile.next --adapter caddyfile && mv /etc/caddy/Caddyfile.next /etc/caddy/Caddyfile && systemctl reload caddy'
```

Inspect service health with `systemctl status caddy` and
`journalctl -u caddy --since '10 minutes ago'` on the server. To roll back content,
point `current` at the desired retained release using the same symlink swap.
