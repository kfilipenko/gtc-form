# TRAVELGTC-WEB-047 - Pair Model PDF Publication Report

- Project: TravelGTC
- Date: 2026-07-31
- Status: Implemented

## Delivered

1. Converted the approved internal PPTX presentation to a public PDF:
   `https://travelgtc.com/assets/docs/TravelGTC_Membership_Model_Presentation.pdf`.
2. Removed the public HTML presentation and the PPTX from the public web root. The original remains only in the project inbox as a working source.
3. Updated the homepage Membership block and the Travel Advantage opportunities page to open the PDF in a new browser tab.
4. Updated Mira's delivery rules in Azure v28: the PDF is the only public presentation format and is sent after consent or a direct request.

## Verification

- PDF conversion completed with LibreOffice Impress.
- Public PDF route is validated after deployment; the former HTML and PPTX routes return `404`.
- Membership knowledge tests cover PDF delivery.
