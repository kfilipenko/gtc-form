# GTSTOR contour manifest

- Source `index.html` -> target `projects/gtstor/web/index.html` (compat redirect)
- Source `chat/index.html` -> target `projects/gtstor/web/chat/index.html` (compat redirect)
- Source `chat/internal/index.html` -> target `projects/gtstor/web/chat/internal/index.html` (compat redirect)
- Source `user/index.html` -> target `projects/gtstor/web/user/index.html` (compat redirect)
- Source `news/index.html` -> target `projects/gtstor/web/news/index.html` (compat redirect)
- Source `chat_api.php` -> target `projects/gtstor/api/chat_api.php` (php include wrapper)
- Source `chat_api2.php` -> target `projects/gtstor/api/chat_api2.php` (php include wrapper)

## Notes
- Contour stage is complete without moving production files.
- Full extraction can replace wrappers with direct app files in next phase.
