
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createSubscriptionInputSchema,
  updateSubscriptionInputSchema,
  getSubscriptionInputSchema,
  deleteSubscriptionInputSchema
} from './schema';

import { createSubscription } from './handlers/create_subscription';
import { getSubscriptions } from './handlers/get_subscriptions';
import { getSubscription } from './handlers/get_subscription';
import { updateSubscription } from './handlers/update_subscription';
import { deleteSubscription } from './handlers/delete_subscription';
import { getSpendingSummary } from './handlers/get_spending_summary';
import { getUpcomingSubscriptions } from './handlers/get_upcoming_subscriptions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Subscription CRUD operations
  createSubscription: publicProcedure
    .input(createSubscriptionInputSchema)
    .mutation(({ input }) => createSubscription(input)),
    
  getSubscriptions: publicProcedure
    .query(() => getSubscriptions()),
    
  getSubscription: publicProcedure
    .input(getSubscriptionInputSchema)
    .query(({ input }) => getSubscription(input)),
    
  updateSubscription: publicProcedure
    .input(updateSubscriptionInputSchema)
    .mutation(({ input }) => updateSubscription(input)),
    
  deleteSubscription: publicProcedure
    .input(deleteSubscriptionInputSchema)
    .mutation(({ input }) => deleteSubscription(input)),
    
  // Analytics and reporting
  getSpendingSummary: publicProcedure
    .query(() => getSpendingSummary()),
    
  getUpcomingSubscriptions: publicProcedure
    .query(() => getUpcomingSubscriptions()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
