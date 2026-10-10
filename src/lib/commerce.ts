import { z } from "zod";

/**
 * Central commercial configuration. Pilot prices are experimental — change
 * them here and every page that shows a price updates.
 */
export const PRICING = {
  currency: "INR",
  report: {
    id: "report",
    name: "One-Time Intelligence Report",
    price: 2500,
    cadence: "one-time",
    turnaround: "5 business days",
    scope: [
      "One industry or one disruption, scoped with you",
      "Exposure of your declared countries, chokepoints and sector",
      "Evidence table with source class, dates and corroboration",
      "Impact pathways, risk scores with uncertainty ranges",
      "Monitoring checklist and open questions",
    ],
  },
  monitoring: {
    id: "pilot",
    name: "Monthly Risk Monitoring",
    price: 4999,
    cadence: "per month",
    turnaround: "Briefs every two weeks, plus alerts on material changes",
    scope: [
      "Ongoing watch of your selected industries and countries",
      "Bi-weekly intelligence brief",
      "Update notes when a tracked event changes stage",
      "Coverage limited to the data GlobalMatrix tracks",
    ],
  },
} as const;

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export const INQUIRY_KINDS = ["sample", "report", "pilot", "contact"] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

export const inquirySchema = z.object({
  kind: z.enum(INQUIRY_KINDS),
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});
export type Inquiry = z.infer<typeof inquirySchema>;

export const profileSchema = z.object({
  company_name: z.string().trim().max(150).optional(),
  industry_id: z.string().min(1, "Choose an industry"),
  home_node: z.string().min(1, "Choose your country of operation"),
  sourcing_nodes: z.array(z.string()).max(20),
  products: z.string().trim().max(1000).optional(),
  concerns: z.string().trim().max(1000).optional(),
});
