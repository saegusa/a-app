# Onboarding Guide

## 1. Repository overview
- The repository currently contains a very small scaffold.
- `README.md` only has the project title (`a-app`) and no setup/run/build instructions yet.
- There is no source directory (`src/`), test directory, or CI configuration in the current state.

## 2. Important things to know
1. **Project is at an early stage**  
   Treat this repository as a base skeleton. Before adding features, agree on architecture and standards.

2. **Establish conventions first**  
   Since there are no conventions documented yet, define these early:
   - language/runtime choice
   - dependency manager
   - formatting/linting rules
   - test strategy
   - branching and release workflow

3. **Document as you build**  
   For every meaningful addition, update README and keep this onboarding guide aligned.

## 3. Suggested learning path for new contributors
1. Read `README.md` and this guide.
2. Confirm product goals with the team (what `a-app` should do).
3. Identify planned stack (frontend/backend/full-stack).
4. Set up baseline project files:
   - app source directory
   - test framework
   - linter/formatter config
   - contribution guidelines
5. Start with a small vertical slice and document run/test commands.

## 4. Recommended next documents to add
- `CONTRIBUTING.md`: development flow, coding standards, and PR expectations.
- `docs/ARCHITECTURE.md`: system design and module boundaries.
- `docs/SETUP.md`: local environment setup steps.
- `docs/ROADMAP.md`: short-term and medium-term milestones.
