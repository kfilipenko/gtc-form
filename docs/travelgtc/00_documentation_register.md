# TravelGTC - Documentation Register

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 1.2
- Date: 2026-07-09
- Status: Rejected generated images removed

## 1. Purpose

This register is the canonical documentation entry point for the TravelGTC project.

The first stage is intentionally small:

1. create a stable project documentation section;
2. create a source folder for website images;
3. create the first goal and development objectives document;
4. prepare domain/publication tracking before website implementation begins.

## 2. Current Documents

| Document | Title | Purpose | Status |
|---|---|---|---|
| `00_documentation_register.md` | TravelGTC - Documentation Register | Project documentation index and fixation point. | Active |
| `01_project_scope_and_positioning.md` | TravelGTC - Project Scope And Development Goals | First document for defining project goals, positioning, audience, first pages and required materials. | Draft for Project Owner input |
| `02_domain_dns_ssl_publication_checklist.md` | TravelGTC - Domain, DNS, SSL And Publication Checklist | Domain and publication setup checklist for `travelgtc.com`. | Draft |
| `03_visual_reference_and_product_direction.md` | TravelGTC - Visual Reference And Product Direction | Records interpretation of the Project Owner visual mockups and converts them into product/page direction. | Draft for Project Owner review |
| `05_project_memory_handoff.md` | TravelGTC - Project Memory Handoff | Short memory document for future AI sessions and project continuation. | Active |
| `001_travelgtc_init_001_project_section_and_goal_document_report.md` | TRAVELGTC-INIT-001 - Project Section And Goal Document Bootstrap Report | Fixes the creation of the first project structure, documentation section and image inbox. | Implemented |
| `002_travelgtc_concept_001_visual_reference_review_report.md` | TRAVELGTC-CONCEPT-001 - Visual Reference Review Report | Fixes the first interpretation of uploaded visual references and product direction. | Implemented |
| `003_travelgtc_web_001_first_travel_network_lab_public_prototype_task.md` | TRAVELGTC-WEB-001 - First Travel Network Lab Public Prototype | Defines the first static public prototype under the final Travel Network Lab concept. | Implemented |
| `004_travelgtc_web_001_first_travel_network_lab_public_prototype_report.md` | TRAVELGTC-WEB-001 - First Travel Network Lab Public Prototype Report | Fixes the implementation of the first public landing page and requested routes. | Implemented |
| `005_travelgtc_deploy_001_public_nginx_publication_task.md` | TRAVELGTC-DEPLOY-001 - Public Nginx Publication | Defines server-side nginx publication for `travelgtc.com`. | Implemented, DNS pending |
| `006_travelgtc_deploy_001_public_nginx_publication_report.md` | TRAVELGTC-DEPLOY-001 - Public Nginx Publication Report | Fixes live-root sync, nginx enablement, smoke checks and Timeweb DNS gap. | Implemented, DNS pending |
| `007_travelgtc_web_003_generated_visual_assets_task.md` | TRAVELGTC-WEB-003 - Generated Production Visual Assets | Defines generation and publication of the first production image set. | Implemented |
| `008_travelgtc_web_003_generated_visual_assets_report.md` | TRAVELGTC-WEB-003 - Generated Production Visual Assets Report | Historical report for the generated image files later rejected and removed. | Superseded by WEB-006 |
| `009_travelgtc_web_004_reference_typography_alignment_task.md` | TRAVELGTC-WEB-004 - Reference Typography Alignment | Defines correction of heading scale, hero proportions, headline accent and benefits band against the original mockups. | Implemented |
| `010_travelgtc_web_004_reference_typography_alignment_report.md` | TRAVELGTC-WEB-004 - Reference Typography Alignment Report | Fixes typography scale, hero background, headline accent, benefits band and deployment verification. | Implemented |
| `011_travelgtc_web_005_menu_infographic_footer_mobile_task.md` | TRAVELGTC-WEB-005 - Menu Infographic, Compact Footer And Mobile Check | Defines menu infographic, footer compaction and responsive check. | Implemented |
| `012_travelgtc_web_005_menu_infographic_footer_mobile_report.md` | TRAVELGTC-WEB-005 - Menu Infographic, Compact Footer And Mobile Check Report | Fixes menu infographic, compact footer, responsive CSS and deployment verification. | Implemented |
| `013_travelgtc_qa_001_playwright_responsive_testing_task.md` | TRAVELGTC-QA-001 - Playwright Responsive Testing Setup | Defines browser-based responsive test setup and screenshot generation. | Implemented |
| `014_travelgtc_qa_001_playwright_responsive_testing_report.md` | TRAVELGTC-QA-001 - Playwright Responsive Testing Setup Report | Fixes Playwright config, responsive tests, screenshots and run command. | Implemented |
| `015_travelgtc_web_006_rejected_image_asset_cleanup_task.md` | TRAVELGTC-WEB-006 - Rejected Image Asset Cleanup | Defines removal of rejected generated WebP images and public references. | Implemented |
| `016_travelgtc_web_006_rejected_image_asset_cleanup_report.md` | TRAVELGTC-WEB-006 - Rejected Image Asset Cleanup Report | Fixes rejected image cleanup, temporary CSS visuals, deployment and verification. | Implemented |

## 3. Project Source Locations

| Area | Path | Purpose |
|---|---|---|
| Project source | `projects/travelgtc/` | Website source, public assets, deploy scripts and future app code. |
| Public source | `projects/travelgtc/public/` | Files intended for public website publication. |
| Live root | `/var/www/travelgtc.com` | Server-side published static site root. |
| Nginx config | `/etc/nginx/sites-available/travelgtc.com.conf` | Enabled server block for `travelgtc.com` and `www.travelgtc.com`. |
| Public home prototype | `projects/travelgtc/public/index.html` | First Travel Network Lab public landing page. |
| Image inbox | `projects/travelgtc/public/assets/images/inbox/` | Place raw source images here for review and later processing. |
| Processed images | `projects/travelgtc/public/assets/images/processed/` | Place optimized and approved web images here. |
| Public documents | `projects/travelgtc/public/legal/` | Future public policies, conditions or documents for the site. |

## 4. Standards Applied

The project was started under:

1. `docs/gtc_project_delivery_standard/03_project_structure_and_publication_model.md`
2. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`
3. `docs/gtc_project_delivery_standard/06_ai_agent_collaboration_standard.md`
4. `docs/gtc_project_delivery_standard/07_documentation_register_and_memory_standard.md`
5. `docs/gtc_project_delivery_standard/12_new_project_bootstrap_templates_and_starter_kit.md`

## 5. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.2 | 2026-07-09 | GTC IT / AI Assistant | Recorded rejected generated image asset cleanup |
| 1.1 | 2026-07-09 | GTC IT / AI Assistant | Added Playwright responsive testing task/report |
| 1.0 | 2026-07-09 | GTC IT / AI Assistant | Added menu infographic, compact footer and mobile check task/report |
| 0.9 | 2026-07-09 | GTC IT / AI Assistant | Recorded second reference visual scale pass for hero accent and benefits band |
| 0.8 | 2026-07-09 | GTC IT / AI Assistant | Added reference typography alignment task/report |
| 0.7 | 2026-07-09 | GTC IT / AI Assistant | Added generated production visual asset task/report |
| 0.6 | 2026-07-08 | GTC IT / AI Assistant | Recorded SSL completion and DNS cache propagation status |
| 0.5 | 2026-07-08 | GTC IT / AI Assistant | Added server-side publication task/report, live root and DNS pending status |
| 0.4 | 2026-07-08 | GTC IT / AI Assistant | Added first Travel Network Lab public prototype task/report and route status |
| 0.3 | 2026-07-08 | GTC IT / AI Assistant | Added visual reference and product direction document after Project Owner uploaded mockups |
| 0.2 | 2026-07-08 | GTC IT / AI Assistant | Added bootstrap implementation report to the register |
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial TravelGTC documentation section, image folders and goal document register |
