# CrewPortGlobal deployment scaffold

This directory contains the initial deployment structure for future publication of CrewPortGlobal.com on GTC1.

## Contents

- nginx/: proposed nginx server configuration.
- structure/: deployment tree and operational layout.

## Deployment assumptions

- Source content lives in projects/crewportglobal/public/.
- Production target root is planned as /var/www/crewportglobal.com/.
- Nginx will serve the static site directly from the deploy root.
- Requests under /api/v1/ must be passed to the CrewPortGlobal backend API entrypoint at projects/crewportglobal/app/backend/api/public/index.php.
- Public Markdown is preserved as the canonical client-facing source during Stage 1.

## Before production use

1. Confirm domain ownership and DNS authority.
2. Confirm SSL issuance path.
3. Review canonical host rule between apex and www.
4. Validate nginx paths and permissions on GTC1.
5. Validate that https://crewportglobal.com/api/v1/health returns the CrewPortGlobal API health payload before public forms are promoted.
