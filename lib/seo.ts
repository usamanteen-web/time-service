import { company } from './content';

export const siteUrl = 'https://www.timeservices.co';
export const companyName = 'Time Service Designs and Constructions';
export const homeTitle = `${companyName} | ออกแบบและรับสร้างบูธครบวงจร`;
export const homeDescription = 'รับออกแบบ ผลิต และติดตั้งบูธนิทรรศการ ด้วยโรงงานของเราเอง 4 แห่ง ดูแลตั้งแต่แนวคิดและแบบ 3 มิติ ไปจนถึงการผลิตและติดตั้งหน้างาน';

// Use established brand names, not a list of target search keywords.
export const companyStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: companyName,
      legalName: `${companyName} Co., Ltd.`,
      alternateName: 'Time Service',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/images/company-logo.png`,
      description: homeDescription,
      telephone: '+66867933023',
      address: company.postalAddress,
      sameAs: [
        company.mapsHref,
        'https://www.facebook.com/p/Time-Service-Designs-and-Contructions-Co-LTD-100069467415377/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: companyName,
      alternateName: ['Time Service', 'timeservices.co'],
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: ['en', 'th'],
    },
  ],
};
