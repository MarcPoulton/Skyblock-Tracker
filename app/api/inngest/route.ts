import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { syncJob } from "@/lib/inngest/syncJob";

export const { GET, POST, OPTIONS } = serve(inngest, [syncJob]);
