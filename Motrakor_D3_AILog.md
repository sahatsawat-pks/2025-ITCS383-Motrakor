# AI Usage Log

## AI Used
- Claude AI
- Gemini

---

## Log 1

| | |
|---|---|
| **Prompt** | Help me write project overview for this project (with attached summary). Create required frontend for this project. |
| **Use For** | Creating necessary frontend pages for faster project initiation. |
| **Accepted / Rejected** | Accepted 7 starting HTML files: Store page, Game Detail page, Cart page, Marketplace page, Wishlist page, Library page, Profile page. |
| **Verification** | Validating behaviour with example input such as routing to each page. |

---

## Log 2

| | |
|---|---|
| **Prompt** | About in-game item purchase — does it need a PK for item or not? Right now it contains only `user_id` and `game_id`. What if 1 user wants to have the same multiple items? |
| **Use For** | Fixing database for game item instances problem. |
| **Accepted / Rejected** | Accepted additional item tables for both user and game item, including database fix and `MarketController.js` file. |
| **Verification** | Manual testing using Postman to check output. |

---

## Log 3

| | |
|---|---|
| **Prompt** | Given functional and non-functional requirements, where should I start and what tools should I use? Give me step-by-step instructions. |
| **Use For** | Starting guide for initial project file setup. |
| **Accepted / Rejected** | Accepted instructions for the suggested software architecture and tools. |
| **Verification** | Testing by Postman, running in VS Code terminal and checking for errors. |

---

## Log 4

| | |
|---|---|
| **Prompt** | Can you help me link the project with Stripe for simulating payment transactions when a user purchases a game, step by step? |
| **Use For** | Linking the project with Stripe for simulating payment transactions. |
| **Accepted / Rejected** | Accepted instructions for the suggested integration steps and tools. |
| **Verification** | Manual testing using Postman to check output. |

---

## Log 5

| | |
|---|---|
| **Prompt** | How should I create automated tests for this project to verify that functions correctly run in: Auth (register & login), Games (browse, search, create), Cart (add, remove, get), Purchases & Stripe payment, Wishlist, Ratings, and Marketplace? |
| **Use For** | Creating unit tests for the functions. |
| **Accepted / Rejected** | Accepted unit test files that cover the validity of the tested functions. |
| **Verification** | Unit tests to validate logical functions without raising errors. |
