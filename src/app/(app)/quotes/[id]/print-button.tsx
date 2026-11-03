"use client";

import { setQuoteStatus } from "../actions";

export function PrintButton() {
  return (
    <button className="btn" onClick={() => window.print()}>
      تحميل PDF / طباعة
    </button>
  );
}

/** Opens WhatsApp with the quote summary and marks the quote as sent. */
export function SendWhatsAppButton({ quoteId, url }: { quoteId: string; url: string }) {
  return (
    <button
      className="btn-primary"
      onClick={() => {
        window.open(url, "_blank", "noopener");
        void setQuoteStatus(quoteId, "sent");
      }}
    >
      إرسال عبر الواتساب
    </button>
  );
}
