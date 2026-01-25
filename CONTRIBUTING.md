# Contributing to MyCryptoSignal.com

Thank you for your interest in contributing! We welcome contributions from the community to help make this project better.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear use case** and problem statement
- **Proposed solution** or feature description
- **Alternative approaches** considered
- **Impact** on existing functionality

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if applicable
4. **Update documentation** to reflect changes
5. **Ensure tests pass** locally
6. **Submit your pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/mycryptosignal.com.git
cd mycryptosignal.com

# Install dependencies
npm install

# Create a branch
git checkout -b feature/your-feature-name

# Start development server
npm run dev
```

## Coding Standards

### JavaScript Style Guide

- Use ES6+ features
- 2 spaces for indentation
- Semicolons required
- Use `const` and `let` (no `var`)
- Meaningful variable and function names
- Comments for complex logic

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add new signal generation algorithm
fix: resolve API rate limiting issue
docs: update API documentation
refactor: optimize market data processing
test: add unit tests for signal engine
```

### Code Review Process

1. Maintainers will review your PR within 3-5 business days
2. Address any requested changes
3. Once approved, a maintainer will merge your PR

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run linter
npm run lint
```

## Documentation

- Update README.md for new features
- Add JSDoc comments to functions
- Update API documentation for endpoint changes
- Include examples in documentation

## Financial Compliance

When contributing signal generation or trading logic:

- Ensure code does not guarantee returns
- Include appropriate risk warnings
- Validate data sources and calculations
- Document assumptions and limitations

## Questions?

Feel free to ask questions by:
- Opening a GitHub issue with the `question` label
- Joining our Discord community
- Emailing dev@mycryptosignal.com

## Recognition

Contributors are recognized in:
- Project README
- Release notes
- Annual contributor spotlight

Thank you for contributing to MyCryptoSignal.com! 🚀