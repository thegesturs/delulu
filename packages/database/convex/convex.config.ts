import aggregate from "@convex-dev/aggregate/convex.config";
import migrations from "@convex-dev/migrations/convex.config";
import resend from "@convex-dev/resend/convex.config";
import dodopayments from "@dodopayments/convex/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(resend);
app.use(aggregate, { name: "postsByUserStatus" });
app.use(aggregate, { name: "postsByOrgStatus" });
app.use(migrations);
app.use(dodopayments);

export default app;
