import { Title, Meta } from '@solidjs/meta';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
}

export default function SEO(props: SEOProps) {
  const fullTitle = `${props.title} - SolidStart Dashboard`;
  const baseUrl = 'https://yoursite.com'; // Replace with actual domain
  const canonicalUrl = props.path ? `${baseUrl}${props.path}` : baseUrl;

  return (
    <>
      <Title>{fullTitle}</Title>
      <Meta name="description" content={props.description} />
      <Meta property="og:title" content={fullTitle} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={canonicalUrl} />
      <Meta name="twitter:card" content="summary" />
      <Meta name="twitter:title" content={fullTitle} />
      <Meta name="twitter:description" content={props.description} />
      <Meta name="canonical" content={canonicalUrl} />
    </>
  );
}