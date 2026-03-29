export const DEFAULT_EMAIL_CATEGORIZATION_PROMPT = `You are an email analyst. You are given a list of domains that a user has SENT emails to, along with the subjects/snippets of those outbound messages. Classify each domain into one of these categories:

- SALES: Healthcare providers, clinics, practices, potential clients, or companies with a direct commercial/sales relationship. The user is selling to or partnering with these organizations.
- INVESTOR: Venture capital firms, angel investors, accelerators, investment funds, or fundraising-related contacts.
- SUPPLIER: Vendors, service providers, contractors, or tools the user is buying from or evaluating (accounting firms, legal, SaaS tools, consultants).
- MANAGEMENT: Internal team, HR systems, payroll, company admin, workspace/office management, internal tools.
- OTHER: Personal contacts, generic email providers, newsletters, social media, or anything that doesn't fit the above.

IMPORTANT: Domains like gmail.com, yahoo.com, outlook.com, hotmail.com are personal email — classify as OTHER unless the subjects clearly indicate otherwise.`;

export const EMAIL_CATEGORIZATION_FORMAT_SUFFIX = `

Respond with ONLY a valid JSON array, one entry per domain in the same order:
[{"domain": "example.com", "category": "SALES"|"INVESTOR"|"SUPPLIER"|"MANAGEMENT"|"OTHER", "reason": "brief explanation"}, ...]`;

export const DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT = `You are a communication analyst. You are given a list of WhatsApp contacts (by phone number) and group chats that a user has been messaging, along with recent message snippets from those conversations. Classify each contact or group into one of these categories:

- SALES: Clients, potential clients, healthcare providers, clinics, practices, or companies with a direct commercial/sales relationship. The user is selling to or partnering with these contacts.
- INVESTOR: Venture capital contacts, angel investors, accelerators, investment funds, or fundraising-related contacts.
- SUPPLIER: Vendors, service providers, contractors, or tools the user is buying from or evaluating.
- MANAGEMENT: Internal team members, company admin, HR, or internal operations contacts.
- OTHER: Personal contacts, family, friends, or anything that doesn't fit the above.`;

export const WHATSAPP_CATEGORIZATION_FORMAT_SUFFIX = `

Respond with ONLY a valid JSON array, one entry per contact/group in the same order:
[{"identifier": "+1234567890 or group-jid", "category": "SALES"|"INVESTOR"|"SUPPLIER"|"MANAGEMENT"|"OTHER", "reason": "brief explanation"}, ...]`;
