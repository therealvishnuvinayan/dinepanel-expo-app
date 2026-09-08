import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument';

// Product counsel should review this source text and the deployed data map before
// public launch. Avoid adding collection or sharing claims without implementation evidence.
const sections: LegalSection[] = [
  {
    title: '1. Information used by DinePanel',
    paragraphs: [
      'DinePanel uses your phone number to authenticate your account. If available, your account may also include a display name.',
      'When you use rewards, DinePanel processes restaurant, bill, claim and reward transaction records. The scanner reads the claim code presented to it; the Customer app does not need to store a photograph of your bill.',
    ],
  },
  {
    title: '2. How information is used',
    paragraphs: [
      'Information is used to secure your account, verify eligible bills, calculate and record rewards, show your balance and activity, prevent duplicate or fraudulent claims, and operate and protect the service.',
    ],
  },
  {
    title: '3. Restaurants and service providers',
    paragraphs: [
      'Participating restaurants provide bill and restaurant information needed for reward claims. DinePanel may rely on infrastructure and communications providers to operate authentication, storage and application services. Access should be limited to what is required for those purposes.',
    ],
  },
  {
    title: '4. Storage and security',
    paragraphs: [
      'DinePanel uses technical and organizational safeguards appropriate to the service. No digital service can guarantee absolute security, so you should keep verification codes and claim links private and notify DinePanel if you believe your account is being misused.',
    ],
  },
  {
    title: '5. Retention and choices',
    paragraphs: [
      'Account and reward records are retained for as long as reasonably needed to provide the service, preserve ledger integrity, meet operational requirements and resolve disputes. Depending on applicable law, you may have rights relating to access, correction or deletion of personal information, subject to records DinePanel must retain.',
    ],
  },
  {
    title: '6. Updates',
    paragraphs: [
      'This policy may be updated when DinePanel’s data practices or legal requirements change. The effective date on this page identifies the current in-app version.',
    ],
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDocument
      effectiveDate="8 September 2026"
      introduction="This Privacy Policy explains the information used by the DinePanel Customer application and the purposes for which it is processed."
      sections={sections}
      title="Privacy Policy"
    />
  );
}
