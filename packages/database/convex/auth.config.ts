export default {
  providers: [
    {
      // Replace with your Clerk JWT issuer domain
      // This should match your Clerk Frontend API URL from the JWT template
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
