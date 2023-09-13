# SAML.to Command Line Interface

![GitHub release (latest by date)](https://img.shields.io/github/v/release/saml-to/cli?label=version) ![GitHub issues](https://img.shields.io/github/issues/saml-to/cli) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/saml-to/cli/Push%20to%20Main)

- Website: https://saml.to
- Forums: https://github.com/saml-to/cli/discussions
- Documentation: https://docs.saml.to

## Introduction

This is the CLI for [SAML.to](https://saml.to). It allows for command-line AWS role assumption.

```
saml-to [command]

Commands:
  saml-to list-roles        Show roles that are available to assume
  saml-to login [provider]  Login to a provider
  saml-to assume [role]     Assume a role

Options:
  --help     Show help  [boolean]
  --version  Show version number  [boolean]
```

## Installation

Please make sure the following is installed:

- NodeJS v14+
- `npm` or `yarn` or `npx` avaliable on the `$PATH`
- (MacOS Alternative) Homebrew available on the `$PATH`

### Using `npm` or `yarn` or `npx`

**`npm`**:

```bash
npm install -g saml-to
saml-to assume
```

**`yarn`**:

```bash
yarn global add saml-to
saml-to assume
```

**`npx`**:

```bash
npx saml-to assume
```

### Using Homebrew (MacOS)

```bash
brew tap saml-to/tap
brew install saml-to
saml-to assume
```

## Getting Started

Once [the CLI is installed](#installation), run the following commands to login and assume roles:

```bash
# Saves a GitHub token with a user:email scope to ~/.saml-to/github-token.json
saml-to login github
```

```bash
# List available roles to assume
saml-to list-roles
```

If no logins or roles are available, an administrator for an AWS account should complete the [initial setup](#Initial-Setup).

Add the `--help` flag to any command for available options.

### Assuming Roles

Interactive prompt for roles to assume:

```bash
saml-to assume
```

Or, if the full role name is known:

```bash
saml-to assume arn:aws:iam::123456789012:role/some-role
```

Alternatively, use the shorthand:

```bash
# Any distinct part of the role names in from saml-to list-roles will match
saml-to assume some-role # match by the role name
saml-to assume 123456789012 # match by the account ID
```

Check out the documentation for [`assume`](https://docs.saml.to/usage/cli/assume).

## Setting Environment Variables

The `--headless` flag will output an expression to update your shell environment with a role.

### `bash`, `zsh`, etc...

Use a subshell (`$(...)`) to set `AWS_*` related environment variables:

```bash
$(saml-to assume some-role --headless)
aws s3api list-buckets # or any desired `aws` command
```

### Powershell

Use `Invoke-Expression` (`iex`) to set `AWS_*` related environment variables:

```powershell
iex (saml-to assume some-role --headless)
aws s3api list-buckets # or any desired `aws` command
```

## Initial Setup

Visit [SAML.to Install](https://saml.to/install) to get started by connecting a GitHub User or Organization to an AWS Account.

## Reporting Issues

Please [Open a New Issue](https://github.com/saml-to/cli/issues/new/choose) in GitHub if an issue is found with this tool.

## Maintainers

- [Scaffoldly](https://github.com/scaffoldly)
- [cnuss](https://github.com/cnuss)

## Usage Metrics Opt-Out

If you do not want to be included in Anonymous Usage Metrics, ensure an environment variable named `SAML_TO_DNT` is set:

```bash
SAML_TO_DNT=1 npx saml-to
```

## License

[Apache-2.0 License](LICENSE)
