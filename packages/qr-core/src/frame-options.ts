import type { QrStickerStyle } from "./project-config";

export type QrFrameOption = {
  id: QrStickerStyle;
  label: string;
};

export const QR_FRAME_OPTIONS: QrFrameOption[] = [
  { id: "none", label: "None" },
  { id: "circle", label: "Circle" },
  { id: "rounded-square", label: "Rounded Square" },
  { id: "scan-me-speech-bubble", label: "Speech Bubble" },
  { id: "storefront", label: "Storefront" },
  { id: "coffee-cup", label: "Coffee Cup" },
  { id: "mobile-phone", label: "Mobile Phone" },
  { id: "gift-box", label: "Gift Box" },
  { id: "clipboard", label: "Clipboard" },
  { id: "dashed-border-hearts", label: "Hearts" },
  { id: "ticket-pass", label: "Ticket Pass" },
  { id: "shopping-bag", label: "Shopping Bag" },
  { id: "acorn", label: "Acorn" },
];
