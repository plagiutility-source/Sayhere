/**
 * MOCK ONLY, replaced in Stage 4/5.
 *
 * Fake AI review-text generation and fake feedback submission, used to exercise
 * every UI state while the app is frontend-only. NO network, NO AI provider and
 * NO saving happens here.
 *
 * Stage 5 replaces `generateReviewText` with the real Groq (primary) + Gemini
 * (fallback) call, and Stage 3 replaces `submitFeedback` with the real POST.
 *
 * Wording rule: the generated text NEVER invents anything. It uses only what
 * the customer typed in the "write it for me" questions (REVIEW_QUESTIONS)
 * plus safe, type-aware phrasing; with no answers it falls back to the generic
 * template below.
 */

import type { BusinessType } from "@/lib/brand/tokens";

/** Modes driven by the `?mock=` query param on `/r/[slug]` (see the route page). */
export type ReviewGenMode = "normal" | "slow" | "ai_fail" | "invalid_url";

/** Pre-written generic fallbacks used when both AI providers fail (section 8). */
export const FALLBACK_REVIEW_TEMPLATES: Record<BusinessType, string> = {
  cafe: "Lovely spot with a warm atmosphere and friendly service. I really enjoyed my visit and will happily come back.",
  restaurant:
    "Really enjoyed my visit here. The food was fresh and full of flavour, and the team looked after us well. Happy to recommend.",
  hotel:
    "Comfortable stay with a friendly, helpful team. The room was clean and quiet and check-in was easy. Happy to recommend.",
  salon:
    "Lovely experience from start to finish. The team was professional and friendly, and I am really happy with the result.",
  gym: "Great gym with a welcoming atmosphere and helpful staff. I always leave feeling motivated and looked after.",
  retail:
    "Nice shopping experience. Helpful staff and a good selection, and I found exactly what I was looking for.",
  other:
    "Great experience overall. Friendly, helpful service and a place I would gladly recommend to others.",
};

/** The "AI-written" version. Generic and type-aware, no made-up specifics. */
const GENERATED_TEMPLATES: Record<BusinessType, string> = {
  cafe: "Such a cozy café! The coffee was excellent and the staff made me feel right at home. I will definitely be back again soon.",
  restaurant:
    "Wonderful meal and a really welcoming atmosphere. Everything was delicious and the service was attentive throughout. Highly recommend!",
  hotel:
    "Such a comfortable stay! The room was spotless, the staff were warm and helpful, and everything I needed was taken care of. I would happily stay again.",
  salon:
    "I had a fantastic experience here. Professional, friendly and a lovely result — I left feeling great. Will be coming back!",
  gym: "Brilliant gym with a friendly, motivating atmosphere and helpful staff. A great place to work out and stay consistent.",
  retail:
    "Really pleasant shopping trip. Helpful staff, a great selection and an easy experience from start to finish. Thank you!",
  other:
    "Fantastic experience with friendly, helpful service. I would recommend them to anyone and will be back again.",
};

// ---------------------------------------------------------------------------
// "Write it for me" questions (owner request, 2026-10-14). Short, type-specific
// questions whose answers make the generated review feel human. Every question
// is optional; the customer can also skip and post on Google directly.
// ---------------------------------------------------------------------------

export type ReviewQuestion = {
  id: string;
  label: string;
  kind: "text" | "choice" | "chips";
  options?: string[];
  placeholder?: string;
  /** Hard cap for typed answers (single line). */
  maxLength?: number;
};

/** One answer per question id (missing/empty = not answered). */
export type ReviewAnswers = Record<string, string>;

const SPEND_CHOICES = [
  "Under ₹200",
  "₹200–₹500",
  "₹500–₹1,000",
  "More than ₹1,000",
  "Prefer not to say",
];
const COMPANY_CHOICES = ["Solo", "Couple", "Friends", "Family", "Colleagues"];

export const REVIEW_QUESTIONS: Record<BusinessType, ReviewQuestion[]> = {
  cafe: [
    {
      id: "item",
      label: "What did you have?",
      kind: "text",
      placeholder: "Cold brew and a brownie",
      maxLength: 80,
    },
    { id: "spend", label: "How much did you spend?", kind: "choice", options: SPEND_CHOICES },
    { id: "company", label: "Who were you with?", kind: "chips", options: COMPANY_CHOICES },
    {
      id: "highlight",
      label: "What did you like the most?",
      kind: "chips",
      options: ["Coffee", "Food", "Service", "Ambience", "Prices"],
    },
  ],
  restaurant: [
    {
      id: "item",
      label: "What did you order?",
      kind: "text",
      placeholder: "Butter chicken and naan",
      maxLength: 80,
    },
    { id: "spend", label: "How much did you spend?", kind: "choice", options: SPEND_CHOICES },
    { id: "company", label: "Who were you with?", kind: "chips", options: COMPANY_CHOICES },
    {
      id: "highlight",
      label: "What did you like the most?",
      kind: "chips",
      options: ["Food", "Service", "Ambience", "Portions", "Prices"],
    },
  ],
  hotel: [
    {
      id: "stay",
      label: "What did you enjoy the most?",
      kind: "chips",
      options: ["Room", "Service", "Breakfast", "Cleanliness", "Location"],
    },
    {
      id: "nights",
      label: "How long did you stay?",
      kind: "choice",
      options: ["1 night", "2–3 nights", "4–7 nights", "More than a week"],
    },
    { id: "company", label: "Who were you with?", kind: "chips", options: COMPANY_CHOICES },
  ],
  salon: [
    {
      id: "service",
      label: "Which service did you get?",
      kind: "text",
      placeholder: "Haircut and colour",
      maxLength: 80,
    },
    { id: "result", label: "How did it turn out?", kind: "chips", options: ["Loved it", "Really good", "Good"] },
    {
      id: "highlight",
      label: "What did you like the most?",
      kind: "chips",
      options: ["The stylist", "The result", "Cleanliness", "Value", "Wait time"],
    },
  ],
  gym: [
    { id: "activity", label: "What did you use today?", kind: "chips", options: ["Gym floor", "Classes", "Personal training", "Cardio"] },
    {
      id: "highlight",
      label: "What did you like the most?",
      kind: "chips",
      options: ["Equipment", "Trainers", "Cleanliness", "Atmosphere", "Timings"],
    },
  ],
  retail: [
    {
      id: "purchase",
      label: "What did you buy?",
      kind: "text",
      placeholder: "A pair of shoes",
      maxLength: 80,
    },
    { id: "staff", label: "How was the staff?", kind: "chips", options: ["Very helpful", "Helpful", "Just okay"] },
    {
      id: "highlight",
      label: "What did you like the most?",
      kind: "chips",
      options: ["Selection", "Prices", "Staff", "Store layout"],
    },
  ],
  other: [
    {
      id: "visit",
      label: "What did you come in for?",
      kind: "text",
      placeholder: "A quick visit",
      maxLength: 80,
    },
    {
      id: "highlight",
      label: "What did you like the most?",
      kind: "text",
      placeholder: "Friendly staff and quick service",
      maxLength: 100,
    },
  ],
};

export function reviewQuestionsFor(businessType: BusinessType): ReviewQuestion[] {
  return REVIEW_QUESTIONS[businessType] ?? REVIEW_QUESTIONS.other;
}

function oneLine(value: string, max = 120): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function spendLines(value: string): string[] {
  switch (value) {
    case "Under ₹200":
      return ["Great value for money."];
    case "₹200–₹500":
      return ["Fair prices for what we got."];
    case "₹500–₹1,000":
      return ["Worth it for a treat."];
    case "More than ₹1,000":
      return ["A bit of a splurge, and it was worth it."];
    default:
      return []; // "Prefer not to say" and unanswered both add nothing.
  }
}

function companyLines(value: string): string[] {
  switch (value) {
    case "Solo":
      return ["Perfect even for a quiet solo visit."];
    case "Couple":
      return ["A lovely spot for a date."];
    case "Friends":
      return ["Ideal for catching up with friends."];
    case "Family":
      return ["Great for a family outing."];
    case "Colleagues":
      return ["A nice place for an after-work catch-up."];
    default:
      return [];
  }
}

/** Sentences built ONLY from the customer's answers (nothing invented). */
function answerSentences(businessType: BusinessType, answers: ReviewAnswers): string[] {
  const pick = (id: string) => oneLine(answers[id] ?? "");
  const sentences: string[] = [];
  const push = (value: string, map: Record<string, string>) => {
    const line = map[value];
    if (line) sentences.push(line);
  };

  switch (businessType) {
    case "cafe": {
      const item = pick("item");
      if (item) sentences.push(`I had the ${item}, and it really hit the spot.`);
      sentences.push(...spendLines(pick("spend")), ...companyLines(pick("company")));
      push(pick("highlight"), {
        Coffee: "The coffee was excellent.",
        Food: "The food was lovely.",
        Service: "The service was warm and quick.",
        Ambience: "The ambience made it special.",
        Prices: "The prices were a pleasant surprise.",
      });
      break;
    }
    case "restaurant": {
      const item = pick("item");
      if (item) sentences.push(`We ordered the ${item}, and it was delicious.`);
      sentences.push(...spendLines(pick("spend")), ...companyLines(pick("company")));
      push(pick("highlight"), {
        Food: "The food was the star of the meal.",
        Service: "The service was attentive throughout.",
        Ambience: "Great ambience for a meal out.",
        Portions: "Generous portions, too.",
        Prices: "Fair prices for the quality.",
      });
      break;
    }
    case "salon": {
      const service = pick("service");
      if (service)
        sentences.push(`I got the ${service} done and I'm really happy with how it turned out.`);
      push(pick("result"), {
        "Loved it": "Honestly, I loved the result.",
        "Really good": "The result turned out really well.",
        Good: "A good, tidy result.",
      });
      push(pick("highlight"), {
        "The stylist": "The stylist listened and got it just right.",
        "The result": "The result speaks for itself.",
        Cleanliness: "The place was spotless.",
        Value: "Great value for the price.",
        "Wait time": "No waiting around — I appreciated that.",
      });
      break;
    }
    case "gym": {
      push(pick("activity"), {
        "Gym floor": "The gym floor is kept in great shape.",
        Classes: "The classes are energetic and well run.",
        "Personal training": "The personal training is genuinely worth it.",
        Cardio: "Plenty of cardio machines — no waiting.",
      });
      push(pick("highlight"), {
        Equipment: "The equipment is in great shape.",
        Trainers: "The trainers are helpful and encouraging.",
        Cleanliness: "Always clean and tidy.",
        Atmosphere: "A great atmosphere to train in.",
        Timings: "The timings are really convenient.",
      });
      break;
    }
    case "retail": {
      const purchase = pick("purchase");
      if (purchase) sentences.push(`Went in for ${purchase} — smooth from start to finish.`);
      push(pick("staff"), {
        "Very helpful": "The staff were extremely helpful.",
        Helpful: "The staff were helpful.",
        "Just okay": "The staff were friendly enough.",
      });
      push(pick("highlight"), {
        Selection: "A big selection to choose from.",
        Prices: "The prices were fair.",
        Staff: "The staff made the difference.",
        "Store layout": "The store is easy to browse.",
      });
      break;
    }
    default: {
      const visit = pick("visit");
      if (visit) sentences.push(`I came in for ${visit} and was looked after well.`);
      const highlight = pick("highlight").replace(/\.+$/, "");
      if (highlight) sentences.push(`What stood out most: ${highlight}.`);
      break;
    }
  }

  return sentences;
}

const REVIEW_OPENERS: Record<BusinessType, string> = {
  cafe: "Lovely little spot — so glad I stopped by.",
  restaurant: "Had a really good meal here.",
  hotel: "A comfortable and easy stay.",
  salon: "Had a lovely appointment here.",
  gym: "Solid gym with a welcoming vibe.",
  retail: "A smooth shopping trip.",
  other: "A really nice experience here.",
};

const REVIEW_CLOSERS: Record<BusinessType, string> = {
  cafe: "Will be back soon — highly recommend!",
  restaurant: "We'll definitely be back — warmly recommend!",
  hotel: "Would happily stay here again — recommended!",
  salon: "Will be coming back — recommended!",
  gym: "Happy with the membership — recommend it!",
  retail: "Will shop here again!",
  other: "Happy to recommend them to anyone!",
};

/** The "AI" text: answers first; the generic template when there are none. */
function buildReviewText(businessType: BusinessType, answers?: ReviewAnswers): string {
  const sentences = answers ? answerSentences(businessType, answers) : [];
  if (sentences.length === 0) return GENERATED_TEMPLATES[businessType];
  return [
    REVIEW_OPENERS[businessType],
    ...sentences,
    REVIEW_CLOSERS[businessType],
  ].join(" ");
}

export type GenerateReviewOptions = {
  /** Defaults to `other` when the business type is unknown. */
  businessType?: BusinessType;
  mode?: ReviewGenMode;
  /** Answers from the "write it for me" questions (see REVIEW_QUESTIONS). */
  answers?: ReviewAnswers;
};

export type GeneratedReview = {
  text: string;
  /** True when the fallback template was used instead of the "AI" text. */
  usedFallback: boolean;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pretends to call the AI. `slug` is accepted for parity with the real call
 * (Stage 5 sends the slug/business id). Slow network and AI failure are driven
 * by `options.mode`.
 */
export async function generateReviewText(
  slug: string,
  options: GenerateReviewOptions = {},
): Promise<GeneratedReview> {
  void slug;
  const type = options.businessType ?? "other";
  const mode = options.mode ?? "normal";

  // The slow trigger intentionally exceeds the ~1 s "feel instant" target so the
  // skeleton state can be seen; normal generation stays under 1 s.
  await delay(mode === "slow" ? 2500 : 800);

  if (mode === "ai_fail") {
    return { text: FALLBACK_REVIEW_TEMPLATES[type], usedFallback: true };
  }
  return { text: buildReviewText(type, options.answers), usedFallback: false };
}

/** Deterministic fallback used when generation itself throws unexpectedly. */
export function fallbackReviewText(type: BusinessType = "other"): string {
  return FALLBACK_REVIEW_TEMPLATES[type];
}

// ---------------------------------------------------------------------------
// Feedback submission
// ---------------------------------------------------------------------------

export type FeedbackInput = {
  /** Trimmed, 1..1000 chars (security section 3 / 4A). */
  message: string;
  /** Optional, max 254 (security section 4A). */
  email?: string;
  /** Hidden honeypot field; when filled the fake submit silently succeeds. */
  honeypot?: string;
};

export type FeedbackFailureCode = "rate_limited" | "generic";
export type FeedbackSubmitResult =
  | { ok: true }
  | { ok: false; code: FeedbackFailureCode };

/** Test triggers (also listed in PROGRESS.md). */
export const mockFeedbackTriggers = {
  /** -> rate-limited state (5/hour/IP/page in the real build). */
  rateLimitEmail: "ratelimit@example.com",
  /** -> generic failure state. */
  genericErrorEmail: "error@example.com",
  /** -> keeps the submitting state visible for ~2.5 s. */
  slowEmail: "slow@example.com",
} as const;

export const feedbackMessages = {
  // Friendly, no numbers and no internals (security 5A).
  rateLimited: "You've sent a few messages already. Please try again later.",
  generic: "Something went wrong. Please try again.",
} as const;

export async function submitFeedback(
  input: FeedbackInput,
): Promise<FeedbackSubmitResult> {
  // Honeypot: a filled field means a bot. Silently "succeed" and discard.
  if (input.honeypot) {
    await delay(400);
    return { ok: true };
  }

  const email = input.email?.trim().toLowerCase() ?? "";
  await delay(email === mockFeedbackTriggers.slowEmail ? 2500 : 700);

  if (email === mockFeedbackTriggers.rateLimitEmail) {
    return { ok: false, code: "rate_limited" };
  }
  if (email === mockFeedbackTriggers.genericErrorEmail) {
    return { ok: false, code: "generic" };
  }
  return { ok: true };
}
