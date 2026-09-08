import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument';

// Product counsel should review this source text before public launch. The app
// deliberately presents complete neutral terms instead of customer-facing draft labels.
const sections: LegalSection[] = [
  {
    title: '1. Using DinePanel',
    paragraphs: [
      'DinePanel lets customers view participating restaurants, scan eligible restaurant bills, claim rewards and review reward activity. You must provide accurate information and use the service only for lawful personal purposes.',
      'You are responsible for maintaining access to the phone number associated with your account and for protecting verification codes and claim links from unauthorized use.',
    ],
  },
  {
    title: '2. Restaurant bills and rewards',
    paragraphs: [
      'Reward eligibility, bill values and reward rates are verified using DinePanel records supplied through participating restaurants. A displayed preview is not final until the server accepts the claim.',
      'A claim code may expire, be cancelled or become unavailable after it is used. DinePanel may correct reward activity when required to address errors, duplicate claims, refunds or misuse.',
    ],
  },
  {
    title: '3. Participating restaurants',
    paragraphs: [
      'Restaurants remain responsible for their own food, service, premises, bills and customer service. DinePanel does not make a restaurant responsible for another restaurant’s obligations.',
    ],
  },
  {
    title: '4. Acceptable use',
    paragraphs: [
      'You must not manipulate bills or claim codes, attempt duplicate claims, interfere with the service, access another person’s account or use automated methods to abuse DinePanel.',
    ],
  },
  {
    title: '5. Availability and account access',
    paragraphs: [
      'The service may occasionally be unavailable for maintenance, security or operational reasons. Access may be restricted when necessary to protect customers, restaurants or the integrity of reward activity.',
    ],
  },
  {
    title: '6. Changes',
    paragraphs: [
      'These terms may be updated as DinePanel develops. The effective date on this page identifies the current in-app version. Material changes should be communicated through an appropriate product channel before they take effect.',
    ],
  },
];

export default function TermsScreen() {
  return (
    <LegalDocument
      effectiveDate="8 September 2026"
      introduction="These Terms of Service govern your use of the DinePanel Customer application. By creating an account or using DinePanel, you agree to these terms."
      sections={sections}
      title="Terms of Service"
    />
  );
}
