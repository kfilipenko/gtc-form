# Frontend Static Prototype Boundary

## Purpose

This directory now contains the first limited static multilingual frontend prototype for the CrewPortGlobal application shell.

The current approved scope is limited to static frontend pages, shared styling and browser-side language-state behavior only.

## Planned Responsibility Boundary

The frontend boundary currently holds website-facing shell concerns such as:

1. visible shell framing
2. global language selector behavior
3. multilingual static page presentation
4. public informational notices for prototype and pending_human_review states

## Approved Static Files

The current approved frontend file set is:

1. index.html
2. language.html
3. styles.css
4. app.js
5. README.md

## Not Approved Here

This directory must not contain:

1. backend or API handlers
2. database access or database writes
3. SQL execution
4. authentication integration
5. payment integration
6. server configuration changes
7. OpenClaw configuration changes
8. deployment artifacts

## Control Statement

Static multilingual frontend prototype is prepared for project-owner review only. Backend, database and deployment work remain not approved.
