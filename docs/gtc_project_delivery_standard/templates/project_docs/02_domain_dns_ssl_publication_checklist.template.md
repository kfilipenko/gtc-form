# <PROJECT_NAME> - Domain, DNS, SSL And Publication Checklist

- Project: <PROJECT_NAME>
- Domain: <DOMAIN>
- Public base URL: <PUBLIC_BASE_URL>
- Version: 0.1
- Date: <DATE>
- Status: Draft

## 1. Domain

| Item | Value |
|---|---|
| Domain | `<DOMAIN>` |
| Registrar | `<registrar>` |
| Registrar account owner | `<owner>` |
| Expiration / renewal | `<date/policy>` |
| DNS provider | `<provider>` |
| DNS approval role | `<role>` |

## 2. DNS Records

| Record | Value | Status |
|---|---|---|
| A apex | `<value>` | `<status>` |
| www | `<value>` | `<status>` |
| AAAA | `<value or not used>` | `<status>` |
| MX | `<value or not used>` | `<status>` |
| SPF | `<value or not used>` | `<status>` |
| DKIM | `<value or not used>` | `<status>` |
| DMARC | `<value or not used>` | `<status>` |

## 3. Public Roots

| Item | Path |
|---|---|
| Source root | `<SOURCE_ROOT>` |
| Public source | `<PUBLIC_SOURCE>` |
| Live root | `<LIVE_ROOT>` |
| Deploy script | `<deploy script path>` |

## 4. SSL

1. Certificate provider: `<provider>`.
2. Validation method: `<HTTP-01/DNS/etc>`.
3. Renewal method: `<method>`.
4. Certificate domains: `<domains>`.
5. HTTPS redirect policy: `<policy>`.

## 5. Nginx / Routing

| Item | Value |
|---|---|
| nginx config | `<path>` |
| root | `<LIVE_ROOT>` |
| index | `<index behavior>` |
| try_files | `<try_files behavior>` |
| directory listing | disabled |
| canonical host | `<host>` |

## 6. Publication Checks

Before go-live:

1. source files exist;
2. deploy dry run passes;
3. live root backup exists;
4. internal docs are not publicly exposed;
5. `/` returns expected status;
6. important public pages return expected status;
7. shared assets load;
8. smoke text proves current version is live.

## 7. Rollback

| Item | Value |
|---|---|
| Backup path | `<path>` |
| Rollback command | `<command>` |
| Rollback authority | `<role>` |
| Evidence location | `<docs path>` |

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | <DATE> | GTC IT / AI Assistant | Initial domain/DNS/SSL/publication checklist |
