## 📝 Description
Please include a brief summary of the changes introduced by this PR and which issue/feature it addresses.

## ⚙️ Type of Change
- [ ] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 🧹 Refactor / Code Cleanup
- [ ] 🔒 Security / Environment Variable updates

## 🛡️ Author's Self-Review Checklist
*Before assigning reviewers, please ensure your code complies with our team standards:*

- [ ] **Functionality:** I have tested this code locally, and it runs exactly as expected.
- [ ] **CI Pipeline:** The GitHub Actions test checks are passing successfully.
- [ ] **Modularity:** Routes, middlewares, and business logic are cleanly separated.
- [ ] **Secrets Management:** No API keys, ports, or URIs are hardcoded. Everything uses `process.env`.
- [ ] **Git Hygiene:** No local `.env`, `node_modules/`, or junk logs are included in this commit.
- [ ] **Error Handling:** Async code blocks are protected with `try/catch` or error middlewares.

## 📸 Screenshots / API Test Outputs (Optional)
*If applicable, paste a screenshot of your Thunder Client or Postman response here.*
