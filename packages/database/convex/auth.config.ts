export default {
  providers: [
    {
      domain: `${process.env.CONVEX_SITE_URL}`,
      applicationID: 'convex',
    },
    {
      domain: `${process.env.NEXT_PUBLIC_APP_URL}`,
      applicationID: 'convex',
    },
  ],
};