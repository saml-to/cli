# SAML.to Command Line Interface

![GitHub release (latest by date)](https://img.shields.io/github/v/release/saml-to/cli?label=version) ![GitHub issues](https://img.shields.io/github/issues/saml-to/cli) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/saml-to/cli/Push%20to%20Main)

- Website: https://saml.to
- Forums: https://github.com/saml-to/cli/discussions
- Documentation: https://docs.saml.to

## Introduction

This is the CLI for [SAML.to](https://saml.to). It allows for command-line based login and role assumption, as well as initial setup and adminstration.

```
npx saml-to [command]

Commands:
  saml-to list-logins              Show providers that are available to login
  saml-to list-roles               Show roles that are available to assume
  saml-to login [provider]         Login to a provider
  saml-to assume [role]            Assume a role
  saml-to init                     (Administrative) Initialize SAML.to with a GitHub Repository
  saml-to add [type] [name]        (Administrative) Add providers or permissions to the configuration
  saml-to set [name] [subcommand]  (Administrative) Set a provider setting (e.g. provisioning
  saml-to show [subcommand]        (Administrative) Show various configurations (metadata, certificate, entityId, config, etc.)

Options:
  --version  Show version number  [boolean]
  --help     Show help  [boolean]
```

#### Prerequisties

- NodeJS v14+ Installed Locally
- `npx` avaliable on the `$PATH`

## Getting Started

The CLI can be run with the `npx` command:

```bash
npx saml-to [--help]
```

Add the `--help` flag to any command for available options.

#### Installing Globally

The CLI can be installed globally as well:

```bash
npm install -g saml-to
saml-to --help
```

### Login and Assume Roles

These commands will interactively prompt for Logins or Roles to assume:

```bash
npx saml-to login
```

AND/OR

```bash
npx saml-to assume
```

Also, check out the documentation for [`login`](https://docs.saml.to/usage/cli/login) and [`assume`](https://docs.saml.to/usage/cli/assume).

If no logins or roles are available, complete the [initial setup](#Initial-Setup).

## Initial Setup

Run the following command for interactive prompts configure a repository for SAML.to:

```bash
npx saml-to init
```

More information can be found on the [website](https://saml.to) and [docs](https://docs.saml.to/usage/cli/init).

## Reporting Issues

Please [Open a New Issue](https://github.com/saml-to/cli/issues/new/choose) in GitHub if an issue is found with this tool.

## Maintainers

- [Scaffoldly](https://github.com/scaffoldly)
- [cnuss](https://github.com/cnuss)

## License

[Apache-2.0 License](LICENSE)
