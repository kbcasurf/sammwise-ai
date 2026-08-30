<p align="center">
    <img style="background-color:grey" src="https://owasp.org/assets/images/logo.svg" height="128">
    <h1 align="center">SAMMwise</h1>
</p>

<p align="center">
  <a aria-label="Datacom logo" href="https://datacom.com">
    <img src="https://img.shields.io/badge/MADE%20BY-Datacom-blue.svg?style=for-the-badge&labelColor=white&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgMzAiPjxkZWZzLz48cGF0aCBkPSJNLjEuNWwuNCAxLjN2MjYuNGwtLjUuOWg5LjljNi45IDAgMTIuNy01LjYgMTIuNy0xNS4xQzIyLjYgNy4xIDE5LjIuOSAxMiAuNEwuMS41em01LjUgMi44aDMuMkMxMy42IDMuMyAxNyA2LjEgMTcgMTRjMCA5LjctNCAxMS43LTguNiAxMS43SDUuNlYzLjN6bTQ4LjktLjJoNi4xbC45LjcgMS0zLjJINDIuMkw0MS41IDRsMS42LS43aDUuOHYyNS4xbC0uNCAxaDYuNmwtLjQtMVYzLjFoLS4yem00NiAyMS40Yy0xLjUgMS44LTMuNCAyLjctNS41IDIuNy01LjIgMC04LTQuNi04LTExLjggMC02LjIgMi4yLTEyLjcgNy43LTEyLjcgMi4yIDAgNC4zIDEuMyA1LjUgMy43aC40VjIuMUM5OC43LjggOTYuOC4zIDk0LjUuM2MtNy4yIDAtMTMuMyA0LjktMTMuMyAxNS44IDAgOC42IDUuNSAxMy42IDEyLjUgMTMuNiAyLjIgMCA0LjYgMCA2LjYtMS4zdi00LjEuMnptMjYuOS05LjdjMC02LjUtMi44LTE0LjUtMTIuNC0xNC41LTguMyAwLTEzLjEgNi4zLTEzLjEgMTQuNiAwIDkuNCA1IDE0LjggMTIuNCAxNC44IDguMSAwIDEzLjEtNi43IDEzLjEtMTQuOW0tMTIuNi0xMmM1IDAgNi45IDUuOCA2LjkgMTEuMiAwIDYuOS0yLjIgMTMuMy03LjQgMTMuMy01IDAtNi45LTUuNi02LjktMTAuOS4xLTkuNyAyLjktMTMuNiA3LjQtMTMuNk0xNDQuMiAyMUwxMzUuOC41aC00LjZsLjQuOS0xLjkgMjYuNC0uNCAxLjNoMy41bDEuMy0xNy45IDggMTcuOWgxLjlsNy44LTE3LjcgMS41IDE3LjdoNi42bC0uNC0xLjJMMTU3IDEuMmwuMS0uN2gtNC42TDE0NC4yIDIxem0tMTA3LS4zbDIuOCA4LjZoNi41bC0uNy0uNy05LjktMjhoLTUuNmwuNiAxLjYtOS4yIDI2LjEtLjQuN2g0bDIuOC04LjZoOS4ydi4zem0tOC0zLjRsMy40LTEwIDMuNSAxMGgtNi45em00My45IDMuNGwyLjggOC42aDYuNWwtLjctLjlMNzEuNy41aC01LjZsLjYgMS42LTkuMiAyNi4xLS40LjdoNGwyLjgtOC42aDkuMnYuNHptLTguMi0zLjRsMy40LTEwIDMuNSAxMGgtNi45eiIgZmlsbD0iIzAwMjQ3MCIvPjwvc3ZnPgo=">
  </a>
  <a aria-label="Build" href="https://github.com/kbcasurf/sammwise-ai/actions/workflows/action.yml">
    <img alt="" src="https://img.shields.io/github/actions/workflow/status/kbcasurf/sammwise-ai/action.yml?branch=main&style=for-the-badge&label=Build">
  </a>
  <a aria-label="CI" href="https://github.com/kbcasurf/sammwise-ai/actions/workflows/ci.yml">
    <img alt="" src="https://img.shields.io/github/actions/workflow/status/kbcasurf/sammwise-ai/ci.yml?branch=main&style=for-the-badge&label=CI">
  </a>
  <a aria-label="License" href="https://github.com/owaspsamm/sammwise/blob/main/LICENSE">
    <img alt="" src="https://img.shields.io/github/license/owaspsamm/sammwise?style=for-the-badge">
  </a>
  <a aria-label="Join the community" href="https://owasp.org/slack/invite">
    <img alt="" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=owasp&labelColor=000000&logoWidth=20">
  </a>
</p>

## Introduction 

The mission of OWASP Software Assurance Maturity Model (SAMM) is to be the prime maturity model for software assurance that provides an effective and measurable way for all types of organizations to analyze and improve their software security posture. OWASP SAMM supports the complete software lifecycle, including development and acquisition, and is technology and process agnostic. It is intentionally built to be evolutive and risk-driven in nature.

SAMMwise is an open source Web App to calculate the Maturity score of an individual, enterprise, or project using the SAMM model. The application walks you through the assessment, allows you to save and re-use previously completed assessments, and presents the results in a similar style to the spreadsheet.

> ⚠️ **Security note — Gap Analysis Report (optional feature).** SAMMwise can optionally
> send your assessment's maturity scores and multiple-choice answers to an external LLM
> provider to generate an advisory gap analysis report. No company name, project name, or
> description is ever included in that request. Only enable this if you understand and
> accept that exposure:
>
> - **Prefer a local/self-hosted LLM** on your own network so assessment data never leaves
>   your perimeter. For hosted providers, require a no-training data policy and check data
>   residency (LGPD/GDPR).
> - **Ensure valid end-to-end HTTPS/TLS** so the request is encrypted in transit.
> - **In corporate environments, make this a security-team decision.**
> - **This endpoint has no authentication or rate limiting** (consistent with the rest
>   of SAMMwise, but unlike every other route, each call here costs real money via your
>   configured AI provider). Any visitor who can reach a deployment with this feature
>   enabled can trigger unlimited billed provider calls. In any shared/public
>   deployment, run it behind an authenticating proxy or add external rate limiting.

## What's New in This Fork

This fork ([kbcasurf/sammwise-ai](https://github.com/kbcasurf/sammwise-ai)) builds on
upstream [OWASP SAMMwise](https://github.com/owaspsamm/sammwise) with the following
additions:

- **Modernized stack.** Upgraded from Next.js 10 / React 16 to Next.js 16 / React 19,
  migrated the survey engine from the discontinued `survey-react` to `survey-core` +
  `survey-react-ui`, removed dead/abandoned dependencies, and added an end-to-end test
  suite (Playwright) as a regression safety net for the assessment flow.
- **Assessment history.** Completed assessments can be saved to a local SQLite database,
  listed and filtered by company/project on a new `/history` page, compared against each
  other (trend chart over time), and deleted — alongside, not replacing, the existing
  manual JSON download/upload flow.
- **AI-powered Gap Analysis Report** (optional, disabled by default — see the security
  note above). From `/results`, generate an advisory report that identifies maturity
  gaps per SAMM practice and recommends next steps, using a configurable AI provider
  (OpenAI-compatible or Anthropic). Requires explicit user consent per report and the
  `AI_PROVIDER_*` environment variables (see `example.env`).
- **CI/CD pipeline.** GitHub Actions runs linting (ESLint), unit tests (Jest),
  end-to-end tests (Playwright), dependency vulnerability scanning (`npm audit`, production
  dependencies only), secret scanning (TruffleHog), static application security testing
  (CodeQL + Semgrep), and dynamic application security testing (OWASP ZAP Baseline against
  an ephemeral instance of the app) on every pull request and push to `main`, plus a weekly
  scheduled run. `npm audit`, Semgrep, ZAP, and CodeQL all fail the build on HIGH/CRITICAL
  findings. Docker images are separately scanned (Trivy) and also fail the build on
  HIGH/CRITICAL vulnerabilities before being published to the
  [GitHub Container Registry](https://github.com/kbcasurf/sammwise-ai/pkgs/container/sammwise),
  and Dependabot keeps npm, Docker, and GitHub Actions dependencies up to date.
- **Bug fix: results charts.** The `/results` charts (business function, practice, and
  totals graphs) were silently rendering empty due to a stale Chart.js dataset
  reference — fixed, and now covered by e2e assertions on the actual rendered chart
  data, not just canvas visibility.

## Getting Started

The quickest way to get up and running is to pull the published image from the
[GitHub Container Registry](https://github.com/kbcasurf/sammwise-ai/pkgs/container/sammwise)
using the following commands:  
`docker pull ghcr.io/kbcasurf/sammwise:latest`  
`docker run -p 3000:3000 ghcr.io/kbcasurf/sammwise:latest`

This runs with an ephemeral, in-container SQLite database — assessment history is lost
when the container is removed. See the Build Options section below for how to persist
data with a volume, set the optional AI provider variables, or build the image yourself
instead of pulling it.

Both the docker and npm options will run the application on port 3000. The application can be accessed by navigation to http://localhost:3000 in your browser.

**Survey**

The survey page (/survey) allows for users to perform an assessment. A SAMM survey rating your given project or enterprise against five domains: Governance, Design, Implementation, Verification, and Operations. Each domain consists of three subdomains which themselves consist of six questions. (**TODO**:) Further information about each question or domain can be viewed by hovering over the informational icons.

There is an optional sixth survey panel where you can enter project metadata that will be included in the results page.

Please refer to the [OWASP Foundation documentation](https://owaspsamm.org/about/) for guidance on the use of Software Assurance Maturity Model. 

**Report**

Upon completion of a survey, you will be redirected to the report page and presented with the results of the survey.

It is possible to save the results of your survey, the bottom of the results page allows you to save the results to the browsers local storage, or download a copy of the json to your device. This latter option allows for the offline sharing of results.

Changes to re-uploaded results will be visualised in the report graphs.

## Build Options
### Docker (build & run locally)

Requires Docker on the source system.

Build the image from the repo root, using `docker/Dockerfile`:

`docker build -f docker/Dockerfile -t sammwise:local .`

Run it, mounting a named volume so the SQLite assessment history survives container
restarts (the app writes to `/app/data` inside the container by default):

`docker run -p 3000:3000 -v sammwise-data:/app/data sammwise:local`

To enable the optional AI-powered Gap Analysis Report, pass the `AI_PROVIDER_*`
variables from `example.env` as `-e` flags (e.g. `-e AI_PROVIDER_API_KEY=... -e
AI_PROVIDER_API_URL=...`) — see the security note above before enabling it.

### Docker Compose (Recommended)

Use the included docker-compose.yml file to quickly get up and running.
Requires docker and docker-compose on the source system. Copy `example.env` to `.env`
first if you want to set the optional `AI_PROVIDER_*` variables — docker-compose.yml
reads them from the environment.

`docker-compose up`

### Node

Requires Node.js >=20.9.0 and npm 10.3 or higher to run.
First pull down the required dependencies

`npm install`

Then run the following depending on your use case:

`npm run dev` (developer mode) 

**OR**

`npm run build`

`npm run start`

### Testing

Unit tests (Jest) can be run with:

`npm test`

End-to-end tests (Playwright) can be run with:

`npm run test:e2e`

Lint the codebase (ESLint) with:

`npm run lint`

## Contribute

Please submit a Pull Request for bug fixes and feature enhancements.
