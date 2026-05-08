# CrewPortGlobal — Planned deployment structure

```text
/var/www/crewportglobal.com/
  index.html
  about/
    index.md
  how-it-works/
    index.md
  for-shipowners/
    index.md
  for-seafarers/
    index.md
  legal/
    no-recruitment-fees/
      index.md
    privacy/
      index.md
    terms/
      index.md
    complaints/
      index.md
```

## Notes

- This structure keeps public content static and simple for Stage 1.
- Internal governance and draft documents remain in docs/crewportglobal/ and must not be copied into the public root.
- If HTML rendering of Markdown is added later, the public tree can be expanded without changing the internal document set.