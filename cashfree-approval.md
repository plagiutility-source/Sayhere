# Cashfree Activation Guide (what Cashfree needs from our website and business)

Source: Cashfree's onboarding FAQ (cashfree.com/docs/help/onboarding-related/onboarding-faqs). Cashfree audits the live website
and business details before activating the merchant account (typically 24-48 working hours after documents are verified), and may
deactivate the account later if the website is found non-compliant. Re-read the page right before applying; rules can change.
Subscription (recurring autopay) is a separate product on the same account: tell the Cashfree payment expert you need
**Subscription Payments (UPI AutoPay / eNACH)** during onboarding so it is enabled.

## 1. Website: must be live and public (no login needed) with these sections

**Mandatory (per Cashfree)**
| Cashfree needs | Where we put it | Status in specs |
|---|---|---|
| Terms and conditions | `/terms` | Drafted (legal-pages.md) |
| About us | `/about` | Added (PRD.md 5.6) |
| Contact us: **one email ID and a valid phone number** | `/contact` (also footer) | Added (PRD.md 5.6). Owner must supply a working phone number |
| Privacy policy | `/privacy` | Drafted (privacy-policy.md) |
| Registered business name | Footer on every public page + `/about` + `/contact` | Added (PRD.md 5.6). Owner supplies the exact legal name |

**Conditional (apply to a paid SaaS)**
| Cashfree needs | Where we put it | Status |
|---|---|---|
| Refund / return policy | `/refund-policy` (combine Payment Policy refund rules + Cancellation Policy) | Added (PRD.md 5.6); wording from legal-pages.md |
| Product or services description | Homepage `/` | Added |
| Pricing | `/pricing` (Starter and Pro prices, plus Free and Enterprise "Contact us", billing cycle, taxes, currency INR; read from `getPlans()`) | Added |
| Shipping and delivery policy | Not applicable (digital service). Add one line on the refund page: "Syehere is a digital service; no physical delivery" | Added |

Rules: pricing on the site must match what Cashfree charges; do not advertise anything the product does not do; keep the same business
name on the site, on Cashfree and on the payment page.

## 2. Business and documents (owner; the agent cannot do these)
- Business must be **registered in India** (if not, sign up as an *Individual*, then create a new account once registered).
- Documents: business PAN, owner PAN, business registration proof for your entity type (for a proprietorship any one of: ROC certificate, Shops and
  Establishment licence, or income/sales tax return; individuals need PAN + Aadhaar + bank details), bank account details, owner KYC,
  beneficial-ownership declaration, signed service agreement. GSTIN is not mandatory.
- **Aadhaar must be linked to your phone number**, and **each business needs its own unique email ID** for the Cashfree account.
- **SaaS line of business:** Cashfree lists an *AOC for PCI-DSS compliance* as an extra document for SaaS. Because we use Cashfree's hosted
  checkout and never see card data, ask your Cashfree payment expert whether this is required for us and what to submit.
- Not allowed: prohibited categories (gambling, adult, dropshipping, etc.). Syehere is not in any.

## 3. Order of work
1. Register the business / decide entity type; buy the domain (shared with google-approval.md).
2. Publish the public pages in section 1 (agent builds; owner supplies name, email, phone, address text).
3. Create the Cashfree account; verify email; enter business details; upload documents.
4. Cashfree's payment expert calls within about 24 working hours: request Subscription Payments (autopay).
5. Cashfree audits the website; fix anything they name.
6. After activation: switch to production keys, set the webhook URL, test one real small payment and one refund.

## 4. Build rules (agent)
- All pages in section 1 are public, HTTPS, in the footer of every public page, and linked from the checkout/upgrade screen.
- Show the registered business name, support email and phone in the footer.
- Before the Cashfree mandate/checkout, the owner must tick "I agree to the Terms, Payment Policy and Cancellation/Refund Policy" (Cashfree's terms require
  merchants to make customers accept the merchant's terms and privacy policy).
- Show the recurring amount, billing date and how to cancel on the upgrade screen (autopay consent clarity).
- Never store card/UPI details; only Cashfree subscription and payment references.
