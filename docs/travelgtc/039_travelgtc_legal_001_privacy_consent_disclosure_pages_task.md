# TRAVELGTC-LEGAL-001 - Privacy, Consent And Public Disclosure Pages

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: continue after live test runtime and close the privacy/consent/disclosure publication gate
- Depends on: `TRAVELGTC-RUNTIME-001 - Test Database, API Service And Nginx Proxy`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Add public legal/disclosure pages to support the TravelGTC authenticated funnel.

The pages must explain, in plain Russian:

1. what data is collected;
2. why the data is collected;
3. how communication consent works;
4. what the project is and is not;
5. why no income is guaranteed;
6. that official travel/platform/partner terms require separate confirmation;
7. that the site is a personal informational page, not a booking system or official substitute for parent-network materials.

## 2. Public Pages

Create:

```text
/legal/
/legal/privacy/
/legal/terms/
/legal/partner-disclosure/
```

Add footer links to these pages across the public site.

## 3. Baseline References

Use these as operational references, not as a substitute for jurisdiction-specific legal review:

1. UAE Government data protection laws overview:
   `https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws`
2. European Commission data protection overview:
   `https://commission.europa.eu/law/law-topic/data-protection_en`
3. FTC business guidance concerning multi-level marketing:
   `https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing`
4. FTC disclosures guidance for social media influencers:
   `https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers`

## 4. Implementation Requirements

The implementation must:

1. keep pages readable and non-aggressive;
2. avoid legal certainty claims such as "fully compliant";
3. mark pages as a working informational draft that requires review;
4. avoid income promises;
5. avoid official parent-network terms claims;
6. explain that TravelGTC does not automatically transfer data to CrewPortGlobal or other projects;
7. explain that future parent-network sharing requires separate user action or confirmation;
8. explain AI/human review boundary in simple terms;
9. update form consent text to link to the privacy page and terms page;
10. update responsive tests to include legal pages.

## 5. Out Of Scope

This task does not include:

1. final legal approval;
2. jurisdiction-specific legal opinion;
3. official parent-network policy approval;
4. email provider setup;
5. cookie consent banner;
6. data deletion UI;
7. CRM access-control UI.

## 6. Acceptance Criteria

The task is complete when:

1. all four legal routes render;
2. footer links expose legal pages on every route;
3. registration and lead consent text links to relevant pages;
4. Playwright responsive route test covers legal routes;
5. live deploy is completed;
6. local and live responsive checks pass;
7. authenticated live funnel still passes after text/link changes;
8. docs/register/memory are updated;
9. repository changes are committed.

## 7. Verification Plan

Run:

```bash
node --check projects/travelgtc/public/assets/js/site.js
npm run test:travelgtc
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
curl -fsS https://travelgtc.com/legal/privacy/
git diff --check
```

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial legal publication task |
