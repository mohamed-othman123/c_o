# CorpWebMonorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/xHGModXbsn)

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve ebanking-portal
```

To create a production bundle:

```sh
npx nx build ebanking-portal
```

To see all available targets to run for a project, run:

```sh
npx nx show project ebanking-portal
```

These targets are either
[inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage
[Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and
their
[code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more
specific capabilities of a particular plugin. Alternatively,
[install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
|
[Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and
improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Build Analyzer

Follow these steps to analyze production bundle

### Step 1:

Build production bundle

```bash
pnpm build:analyze
```

### Step 2:

Analyze the bundle

Go to url `https://esbuild.github.io/analyze/`

Upload the stats.json file, you can find in `dist/apps/ebanking-portal/`

# Test

This project uses Jest as the testing framework for unit testing Angular components, services, and utilities. Jest
offers fast execution, robust mocking capabilities, and detailed coverage reports, ensuring the reliability of critical
operations.

**Testing Commands**

1. `Run Unit Tests :` Executes all unit tests and generates a coverage report.

```bash
pnpm test
```

2. `Run Coverage in Watch Mode :` Executes tests in watch mode while generating live coverage reports, allowing
   continuous testing during development.

```bash
pnpm test:coverage
```

3. `Run Tests for a Single File :` Use this command to run tests for a specific file.

```bash
pnpm test src\app\layout\containers\home\Home.component.spec.ts
```

**General Principles for Testing**

1. `Test Naming Convention`: Use .spec.ts for unit tests, e.g., transaction.service.spec.ts.
2. `Follow the "Arrange, Act, Assert" Pattern`: Structure test cases with clear sections to improve readability.
3. `Focus on Core Logic`: Test critical features such as transaction processing, account management, and data validation
   extensively. Ensure all business rules are thoroughly validated through test cases
4. `Mock Dependencies`: Use Jest's built-in mocking for external APIs and services to isolate the module being tested.
5. `Consistent Naming`: Use descriptive names for test cases to indicate their purpose, e.g.,
   should_return_account_balance_when_requested.

## Technical Standards

**Mock Dependencies**

1. Use `TestBed.overrideProvider`: Mock services and provide mock implementations.
2. Use `jest.mock`: Mock modules and functions for isolated testing.
3. Use `Spy Functions`: Use jest.spyOn to spy on functions and track their calls and arguments.

**Test Asynchronous Code**

1. Use `async/await`: Handle promises in asynchronous operations for better readability and control.
2. Use `fakeAsync`: For Angular-specific asynchronous operations (e.g., `setTimeout`, `setInterval`), use `fakeAsync` to
   simulate and control time in tests.

For more details, please visit:
[Unit Testing Standards](https://scbank.atlassian.net/wiki/spaces/corpinhouse/pages/48234677/Unit+Testing+Standards).
