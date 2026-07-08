# TravelGTC Project Source

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Status: Server-side publication and SSL completed, DNS cache propagation pending

## Purpose

This folder contains source files for the TravelGTC website project.

The project now contains the first static public prototype for the final concept:

```text
Travel Network Lab
```

## Current Layout

```text
projects/travelgtc/
  public/
    index.html
    travel-lifestyle/
    club/
    create-trip/
    business-model/
    events/
    about/
    contacts/
    assets/
      images/
        inbox/
        processed/
    legal/
  deploy/
    nginx/
  scripts/
```

## Image Workflow

1. Put raw images in `public/assets/images/inbox/`.
2. Keep original filenames readable where possible.
3. After review and optimization, approved web images should be placed in `public/assets/images/processed/`.
4. Public pages should reference only processed/approved images.

## Prototype Routes

```text
/
/travel-lifestyle/
/club/
/create-trip/
/business-model/
/events/
/about/
/contacts/
```

## Publication

Server-side publication uses:

```text
Live root: /var/www/travelgtc.com
Deploy script: projects/travelgtc/scripts/deploy_public_live.sh
Nginx template: projects/travelgtc/deploy/nginx/travelgtc.com.conf
Installed nginx config: /etc/nginx/sites-available/travelgtc.com.conf
```

Run publication sync:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

The deploy script excludes raw `public/assets/images/inbox/` files from the live root.

Public domain visibility depends on recursive DNS cache propagation. Authoritative Timeweb DNS points `travelgtc.com` and `www.travelgtc.com` to `20.91.187.79`, and Let's Encrypt SSL is issued for both names.

## Related Documentation

```text
docs/travelgtc/00_documentation_register.md
docs/travelgtc/01_project_scope_and_positioning.md
docs/travelgtc/02_domain_dns_ssl_publication_checklist.md
docs/travelgtc/03_visual_reference_and_product_direction.md
docs/travelgtc/05_project_memory_handoff.md
```
