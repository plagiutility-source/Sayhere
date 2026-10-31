# Email Templates

All emails sent via Resend. `{{variables}}` are placeholders to fill at send time.

---

## 1. Welcome Email (on signup)
**Subject:** Welcome to Syehere, {{business_name}}! 🎉

Hi {{owner_name}},

Your Syehere account for {{business_name}} is live. Here's what to do next:

1. Grab your QR code and place it where customers will see it
2. Share your review link on receipts, WhatsApp, or Instagram
3. Watch your first feedback come in on your dashboard

[Go to Dashboard →]

— The Syehere Team

---

## 2. Weekly Digest Report
**Subject:** 📊 Weekly Report for {{business_name}}

_Header band should render in the business's `primary_color` (see
brand-guide.md), matching the dashboard, so the email feels like the same
product the owner logs into._

Hi {{owner_name}},

Here's how {{business_name}} did this week:

- 📱 {{scan_count}} Scans ({{scan_change}}% from last week)
- ⭐ {{positive_percent}}% Positive Reviews
- 🔴 {{negative_count}} Feedback Received ({{responded_count}} responded)
- ⭐ {{new_google_reviews}} New Google Reviews
{{#if streak_days}}
- 🔥 {{streak_days}}-day streak with no negative reviews
{{/if}}

Top customer quote this week:
"{{top_quote}}"

[View Full Dashboard →]

— The Syehere Team

---

## 3. Plan Upgraded Confirmation
**Subject:** You're on {{new_plan}} now — here's what's unlocked

Hi {{owner_name}},

Your plan has been upgraded to **{{new_plan}}**. This is now active immediately:

- {{scan_limit}} monthly scans
- {{location_limit}} location(s)
- All premium features unlocked

[View Your Plan →]

— The Syehere Team

---

## 4. Payment Failed Warning
**Subject:** ⚠️ Action needed: payment failed for {{business_name}}

Hi {{owner_name}},

We weren't able to process your payment for the {{plan_name}} plan. Please
update your payment method within **3 days** to avoid service interruption.

[Update Payment Method →]

If you don't update within this window, your review pages will be
temporarily paused until payment is resolved.

— The Syehere Team

---

## 5. Service Suspended (after grace period)
**Subject:** Your Syehere service has been paused

Hi {{owner_name}},

Your account for {{business_name}} has been paused due to an unresolved
payment issue. Your dashboard is still accessible — update your payment
method below to restore service immediately.

[Restore Service →]

— The Syehere Team

---

## 6. Cancellation Request Received
**Subject:** We received your cancellation request

Hi {{owner_name}},

We're sorry to see you thinking about leaving. We've received your
cancellation request and reason ({{reason}}).

Our team will reach out within **48 hours** before finalizing anything.
Your service continues uninterrupted until {{billing_cycle_end_date}}.
You will not be charged again once the cancellation is finalized.

— The Syehere Team

---

## 7. Password Reset
**Subject:** Reset your Syehere password

Hi there,

Click below to reset your password. This link expires in 1 hour.

[Reset Password →]

If you didn't request this, you can safely ignore this email.

— The Syehere Team

---

## 8. Refund Issued
**Subject:** A refund of {{refund_amount}} has been initiated

Hi {{owner_name}},

We've initiated a refund of **{{refund_amount}}** for your {{plan_name}} payment
on {{payment_date}}. It usually takes several business days to reach your
original payment method, depending on your bank.

[View Billing →]

— The Syehere Team

---

## 9. Your Plan Will End (cancellation finalized)
**Subject:** Your {{plan_name}} plan ends on {{billing_cycle_end_date}}

Hi {{owner_name}},

Your cancellation is confirmed. You will not be charged again. Your
{{plan_name}} plan stays fully active until **{{billing_cycle_end_date}}**, then
your account moves to the Free plan.

{{#if extra_locations}}
Extra locations will be switched off on that date. Upgrade before {{purge_date}}
to keep them.
{{/if}}

Changed your mind? [Keep my plan →]

— The Syehere Team

---

## 10. Your Paid Plan Has Ended
**Subject:** You're now on the Free plan

Hi {{owner_name}},

Your paid plan has ended and {{business_name}} is now on the Free plan
(1 location, {{free_scan_limit}} scans a month). Your feedback, analytics and
branding are all still here.

{{#if extra_locations}}
Your extra locations are switched off and will be permanently removed on
{{purge_date}} unless you upgrade.
{{/if}}

[Upgrade →]

— The Syehere Team

---

## 11. Extra Locations Removal Warning (7 days before purge)
**Subject:** Your extra locations will be removed on {{purge_date}}

Hi {{owner_name}},

Your extra locations for {{business_name}} will be permanently removed on
**{{purge_date}}**. Upgrade before then to switch them back on, with the same
QR codes.

[Upgrade →]

— The Syehere Team

---

## 12. Scan Limit Reached (once per cycle)
**Subject:** Your Syehere service is paused until {{reset_date}}

Hi {{owner_name}},

{{business_name}} has used all {{scan_limit}} scans on the {{plan_name}} plan this month. Your QR code,
NFC tag, review page, Google auto-replies and weekly reports are paused, and your customers
see a "temporarily unavailable" message. Your dashboard and feedback are still available.

Your scans reset on **{{reset_date}}**, or you can upgrade now to turn everything back on
immediately.

[Upgrade →]

— The Syehere Team

---

## 13. Auto-reply Request Received
**Subject:** We got your auto-reply request

Hi {{owner_name}},

Thanks for asking us to set up Google review auto-reply for {{business_name}}. Our team will
contact you within 48 hours on {{phone}} or at {{email}} to get it running.

[Go to your dashboard →]

— The Syehere Team

---

## 14. Auto-reply Is On
**Subject:** Google review auto-reply is on for {{business_name}}

Hi {{owner_name}},

Google review auto-reply is now active for {{business_name}}. New reviews get a reply 24 to 48 hours
after they arrive, never instantly. You can see everything on your dashboard.

[Go to your dashboard →]

— The Syehere Team

---

## 15. Loyalty Card: Confirm Your Email (customer)
Sent to the customer (not the owner) when they join a business's loyalty card. Plain text, no tracking links.
**Subject:** Your {{business_name}} loyalty card code: {{code}}

Hi,

Your code to open your {{business_name}} loyalty card is:

{{code}}

It works for 10 minutes. If you did not ask for this, you can ignore this email.

— {{business_name}} (loyalty card by Syehere)
