# Convex Backend Migration Guide

This guide will help you migrate from the Express + MongoDB backend to Convex.

## What is Convex?

Convex is a serverless backend platform that provides:
- **Real-time database** with automatic subscriptions
- **Type-safe API** with full TypeScript support
- **Built-in authentication** (we'll implement custom auth for now)
- **Automatic scaling** and hosting
- **No server management** required

## Migration Steps

### 1. Install Convex

First, install the Convex package (if not already done):

```bash
npm install convex
```

### 2. Initialize Convex

Run the Convex development server. This will:
- Create a Convex project
- Generate TypeScript types
- Create a `.env.local` file with your Convex URL

```bash
npx convex dev
```

**Important**: When prompted:
- Choose to create a new project or link to an existing one
- Follow the authentication prompts (you may need to sign in to Convex)
- The CLI will automatically generate the `convex/_generated` directory

### 3. Environment Variables

After running `npx convex dev`, a `.env.local` file will be created with:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
```

This URL is automatically used by the frontend to connect to your Convex backend.

### 4. Update Your Code to Use Convex

The migration has already been set up for you! Here's what was changed:

#### Files Created:
- `convex/schema.ts` - Database schema (replaces Mongoose models)
- `convex/auth.ts` - Authentication functions
- `convex/hubRecords.ts` - CRUD operations for hub records
- `convex.json` - Convex configuration
- `src/lib/convexApi.ts` - Convex API client (compatibility layer)

#### Files Modified:
- `src/main.tsx` - Wrapped app with ConvexProvider
- `package.json` - Added Convex scripts
- `.gitignore` - Added Convex generated files

### 5. Switch to Convex API

To use Convex instead of the Express backend, update your imports:

**Before:**
```typescript
import { serviceRequestAPI, authAPI } from '@/lib/api';
```

**After:**
```typescript
import { serviceRequestAPI, authAPI } from '@/lib/convexApi';
```

Or, you can rename `convexApi.ts` to `api.ts` to replace the old API completely.

### 6. Using Convex React Hooks (Recommended)

For better real-time functionality, you can use Convex React hooks directly:

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// In your component:
function MyComponent() {
  const userId = localStorage.getItem("userId");
  
  // Real-time query - automatically updates when data changes!
  const records = useQuery(api.hubRecords.getRecordsByUser, {
    userId: userId as Id<"users">,
  });
  
  // Mutation
  const createRecord = useMutation(api.hubRecords.createRecord);
  
  const handleCreate = async (data) => {
    await createRecord({
      ...data,
      user_id: userId as Id<"users">,
    });
  };
  
  return <div>{/* Your UI */}</div>;
}
```

### 7. Run the Application

Start both Convex and your frontend:

```bash
# Option 1: Run both together
npm run dev:all

# Option 2: Run separately in different terminals
# Terminal 1:
npx convex dev

# Terminal 2:
npm run dev
```

### 8. Data Migration (Optional)

If you have existing data in MongoDB, you'll need to migrate it to Convex:

1. Export data from MongoDB
2. Create a migration script in `convex/migrations.ts`
3. Use Convex mutations to import the data

Example migration script:

```typescript
// convex/migrations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const importRecords = mutation({
  args: {
    records: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    for (const record of args.records) {
      await ctx.db.insert("hubRecords", record);
    }
  },
});
```

## Key Differences

### MongoDB vs Convex

| Feature | MongoDB + Express | Convex |
|---------|------------------|--------|
| **Setup** | Manual server setup | Serverless, automatic |
| **Real-time** | Manual WebSocket setup | Built-in subscriptions |
| **Type Safety** | Manual type definitions | Auto-generated types |
| **Scaling** | Manual configuration | Automatic |
| **Authentication** | Custom JWT implementation | Built-in auth (or custom) |
| **Hosting** | Separate hosting needed | Included |

### API Calls

**MongoDB + Express:**
```typescript
const records = await serviceRequestAPI.getByUserId(userId);
```

**Convex (with hooks):**
```typescript
const records = useQuery(api.hubRecords.getRecordsByUser, { userId });
// Automatically updates in real-time!
```

## Benefits of Convex

1. **Real-time Updates**: All queries automatically subscribe to changes
2. **No Server Management**: Convex handles scaling, hosting, and infrastructure
3. **Type Safety**: Full TypeScript support with auto-generated types
4. **Simpler Code**: No need for REST endpoints, controllers, or services
5. **Better Developer Experience**: Instant feedback, hot reloading
6. **Cost Effective**: Pay only for what you use, generous free tier

## Troubleshooting

### Lint Errors

The TypeScript errors you see are expected until you run `npx convex dev`. This command generates the necessary type files in `convex/_generated/`.

### "Cannot find module 'convex/react'"

Make sure you've installed the Convex package:
```bash
npm install convex
```

### "VITE_CONVEX_URL is not set"

Run `npx convex dev` to generate the `.env.local` file with your Convex URL.

### Authentication Issues

The current implementation uses simple localStorage-based auth. For production, consider:
- Implementing Convex's built-in authentication
- Using a third-party auth provider (Auth0, Clerk, etc.)
- Enhancing the custom auth with proper password hashing (bcrypt)

## Next Steps

1. **Run `npx convex dev`** to initialize your Convex project
2. **Test the application** to ensure everything works
3. **Migrate your data** from MongoDB (if needed)
4. **Update components** to use Convex hooks for real-time updates
5. **Implement proper authentication** for production
6. **Remove the old Express backend** once fully migrated

## Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
- [Convex Authentication](https://docs.convex.dev/auth)
- [Convex Dashboard](https://dashboard.convex.dev/)

## Support

If you encounter any issues during migration, check:
1. Convex documentation
2. Convex Discord community
3. GitHub issues in the Convex repository

---

**Note**: The old Express backend in the `server/` directory can be kept for reference or removed once you're fully migrated to Convex.
