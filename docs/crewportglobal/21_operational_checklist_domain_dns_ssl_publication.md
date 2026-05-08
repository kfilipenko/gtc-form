# CrewPortGlobal — Operational Checklist for Domain, DNS, SSL and Publication on GTC1

- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Draft
- Classification: Internal
- Effective date: 2026-05-08
- Review date: 2026-06-08

## Scope

This checklist is the operational control document for preparing CrewPortGlobal.com for public publication on GTC1.

## 1. Domain and registrar

- Confirm whether CrewPortGlobal.com is already registered.
- Record registrar name, account owner and renewal contact.
- Confirm expiration date and auto-renew policy.
- Confirm access to registrar dashboard.
- Record DNS hosting provider.
- Confirm who can approve name server or DNS changes.

## 2. DNS records

- Create or confirm A record for CrewPortGlobal.com.
- Create or confirm www CNAME or dedicated A record.
- Decide whether IPv6 will be used, then create AAAA if required.
- Prepare MX only if domain email will be enabled immediately.
- Prepare TXT records for SPF, DKIM and DMARC if domain mailboxes are used.
- Lower TTL during cutover window if DNS migration is expected.
- Record final DNS values in the operational note.

## 3. GTC1 publication target

- Confirm target public root as /var/www/crewportglobal.com.
- Confirm target source root as /var/www/gtc-form/projects/crewportglobal/public.
- Confirm Linux user and group that will own deployed files.
- Confirm nginx server block inclusion path.
- Confirm public read permissions on the deploy root.
- Confirm backup path for previous release if later rollbacks are needed.

## 4. SSL and certificate issuance

- Confirm whether Let's Encrypt will be used.
- Confirm that port 80 is reachable for HTTP-01 validation or prepare DNS-based validation.
- Issue certificate for crewportglobal.com and www.crewportglobal.com.
- Record certificate renewal method.
- Confirm automatic renewal schedule.
- Validate HTTPS redirect after certificate installation.
- Validate TLS chain and browser trust after go-live.

## 5. Nginx activation

- Place server config in /etc/nginx/sites-available/crewportglobal.com.conf.
- Link config into /etc/nginx/sites-enabled/.
- Review root, index and try_files behavior.
- Confirm markdown files are reachable only where intended.
- Confirm directory listing is disabled.
- Run nginx -t before reload.
- Reload nginx only after successful config validation.

## 6. Content publication

- Sync public files from repository into the target root.
- Confirm index.html loads correctly.
- Confirm legal pages are reachable.
- Confirm complaint page exposes the active contact channel.
- Confirm no internal documents are present in the public root.
- Confirm no temporary files, backups or hidden admin files are published.

## 7. Post-deploy validation

- Open https://crewportglobal.com/.
- Open https://crewportglobal.com/for-shipowners/.
- Open https://crewportglobal.com/for-seafarers/.
- Open https://crewportglobal.com/legal/no-recruitment-fees/.
- Open https://crewportglobal.com/legal/privacy/.
- Open https://crewportglobal.com/legal/terms/.
- Open https://crewportglobal.com/legal/complaints/.
- Validate www to apex redirect or chosen canonical rule.
- Check response headers and caching behavior.
- Capture go-live notes and any exceptions.

## 8. Rollback readiness

- Keep previous release snapshot before first production sync.
- Record rollback command or restore path.
- Confirm responsible operator for rollback approval.
- Confirm where deployment logs are stored.

## Responsibility

- Operations owns DNS, SSL, deploy and publication steps.
- Legal or management confirms publication readiness for client-facing documents.
- Technical administrator validates nginx, paths and file permissions.

## Revision history

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-05-08 | GitHub Copilot | Initial operational checklist created |