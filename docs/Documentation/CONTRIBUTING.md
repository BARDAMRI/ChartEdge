# Contributing to TickUp Charts

First of all, thank you for considering contributing to TickUp Charts!  
Your help is extremely valuable to make this project better for everyone.

The **canonical** contributing guide for this repository is **[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)** (build steps, package layout, maintainer pointer to **`docs/internal/`**). This file is a shorter duplicate for readers browsing **`docs/Documentation/`** only.

---

## How to contribute

1. **Fork** the repository.
2. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Write clear and documented code** following the existing project style.
4. **Test your changes** thoroughly.
5. **Commit** your changes:
   ```bash
   git commit -m "Add feature: short description"
   ```
6. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request (PR)** with a clear explanation of what you changed and why.

---

## What You Can Help With

- Reporting bugs
- Suggesting new features
- Improving performance
- Enhancing documentation
- Creating examples and tutorials
- Helping review pull requests

---

## Coding Style and Guidelines

- Use **TypeScript** (strict mode).
- Prefer **functional and modular code** when possible.
- Keep pull requests **small and focused** — easier to review and merge.
- **Document** public functions, classes, and complex pieces of logic.
- **Use meaningful names** for variables, functions, and classes.
- Follow the project's existing **folder structure** and **file organization**.

---

## Running locally

After cloning the repository:

```bash
npm install
npm run build    # library: tsc + Vite lib + declarations
npm test         # Jest
```

For the **Vite example** app:

```bash
cd example && npm install && npm run dev
```

---

## Code of Conduct

We expect everyone to follow the [Code of Conduct](./CODE_OF_CONDUCT.md) when interacting in the project.

Let's make the TickUp community welcoming and supportive! 🤝

---

## Questions?

- If you have doubts, open an issue.
- If you are unsure how to implement something, feel free to discuss it first before sending a PR.
- You can also reach out to the maintainers directly.

---

Thank you again for being part of TickUp Charts! 🚀