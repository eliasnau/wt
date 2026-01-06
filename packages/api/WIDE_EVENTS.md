# Wide Events Pattern

This codebase implements the "Wide Events" logging pattern for comprehensive observability.

## What are Wide Events?

Instead of logging multiple separate events throughout a request, we build a single comprehensive event that contains all relevant context about the request lifecycle. This event is emitted once at the end of the request.

### Benefits

1. **Single source of truth** - One event per request with all context
2. **Better queryability** - All related data is in one place
3. **Reduced log volume** - One event instead of many
4. **Performance** - Logging happens after response is sent (using `after()`)
5. **Rich context** - Business metrics, timing data, error details all together

## Architecture

### Middleware Flow

Wide events are enriched through multiple middleware layers:

1. **wideEventMiddleware** - Initializes the event with request context
   - Creates `trace_id` (from header or generates new)
   - Creates `request_id` (always new per request)
   - Adds timestamp, method, path, service
   - Emits the event at the end with appropriate severity

2. **authMiddleware** - Adds user context (if authenticated)
   - Sets `user_id` from authenticated session
   - Sets `organization_id` if active organization exists

3. **Handler Layer** - Adds business context
   - Action being performed (`action: "create_member"`)
   - Business metrics and flags
   - Database timing
   - Error context

### Middleware Layer
The `wideEventMiddleware` initializes the event at the start of each request and emits it at the end:

```typescript
// packages/api/src/middleware/wideEvent.ts
export const wideEventMiddleware = () => {
  return os.$context<Context>().middleware(async ({ context, next }) => {
    const startTime = Date.now();
    
    // Extract trace_id from header if present, otherwise generate new one
    const traceId = context.req.headers.get("x-trace-id") || crypto.randomUUID();
    
    // Initialize event with request context
    const event: WideEvent = {
      trace_id: traceId,
      request_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      method: context.req.method,
      path: context.req.nextUrl.pathname,
      service: "api",
    };
    
    try {
      const result = await next({ context: { ...context, wideEvent: event } });
      event.status_code = 200;
      event.outcome = "success";
      event.severity = "info";
      return result;
    } catch (error) {
      event.status_code = error.status ?? 500;
      event.outcome = "error";
      event.error = { type: error.name, message: error.message, code: error.code };
      
      // Determine severity: 4xx = warning (client errors), 5xx = error (server errors)
      event.severity = (event.status_code >= 400 && event.status_code < 500) ? "warning" : "error";
      
      throw error;
    } finally {
      event.duration_ms = Date.now() - startTime;
      after(() => {
        const message = `${event.method} ${event.path}`;
        
        if (event.severity === "error") {
          logger.error(message, event); // Log server errors with error level
        } else if (event.severity === "warning") {
          logger.warn(message, event); // Log client errors with warning level
        } else {
          logger.info(message, event); // Log success with info level
        }
      });
    }
  });
};
```

### Auth Middleware Layer
The `authMiddleware` adds user context after authentication:

```typescript
// packages/api/src/middleware/auth.ts
export const authMiddleware = os.$context<Context>().middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({ headers: context.headers });
  
  if (!sessionData?.session || !sessionData?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource",
    });
  }
  
  // Add user data to wide event
  context.wideEvent.user_id = sessionData.user.id;
  if (sessionData.session.activeOrganizationId) {
    context.wideEvent.organization_id = sessionData.session.activeOrganizationId;
  }
  
  return next({
    context: {
      userId: sessionData.user.id,
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});
```

### Handler Layer
Handlers enrich the event with business context throughout execution:

```typescript
create: protectedProcedure
  .input(createMemberSchema)
  .handler(async ({ input, context }) => {
    // Add business context
    if (context.wideEvent) {
      context.wideEvent.action = "create_member";
      context.wideEvent.member_email = input.email;
      context.wideEvent.contract_type = input.initialPeriod;
      context.wideEvent.has_joining_fee = !!input.joiningFeeAmount;
    }
    
    const dbStartTime = Date.now();
    try {
      const result = await DB.mutation.members.createMemberWithContract({...});
      
      // Add success metrics
      if (context.wideEvent) {
        context.wideEvent.member_id = result.member.id;
        context.wideEvent.member_created = true;
        context.wideEvent.db_latency_ms = Date.now() - dbStartTime;
      }
      
      return result;
    } catch (error) {
      // Add error context
      if (context.wideEvent) {
        context.wideEvent.db_error = true;
        context.wideEvent.error_during = "member_creation";
      }
      throw error;
    }
  })
```

## Event Structure

### Base Fields (Always Present)
- `log_type` - Always set to `"wide_event"` to distinguish from other log types
- `trace_id` - Trace identifier for correlating related requests across services (extracted from `x-trace-id` header or generated)
- `request_id` - Unique request identifier (always generated per request)
- `timestamp` - ISO 8601 timestamp
- `method` - HTTP method (GET, POST, etc.)
- `path` - Request path
- `service` - Service name (always "api")
- `deployment_id` - Vercel deployment ID (if running on Vercel)
- `region` - Vercel region (if running on Vercel)
- `ip` - Client IP address (if available)
- `geo` - Geolocation data (if available)
  - `geo.city` - City name
  - `geo.country` - Country code
  - `geo.region` - Region/state name
- `status_code` - HTTP status code
- `outcome` - "success" or "error"
- `severity` - "info" (2xx/3xx), "warning" (4xx client errors), or "error" (5xx server errors)
- `duration_ms` - Total request duration

### User Fields (Added by Handlers)
- `user_id` - Authenticated user ID (added by authMiddleware)
- `organization_id` - Active organization ID (added by authMiddleware if present)

### Business Fields (Added by Handlers)
Handlers can add any business-specific fields:
- `action` - Business action being performed
- `<entity>_id` - IDs of entities involved
- `<entity>_created/updated/deleted` - Operation success flags
- `db_latency_ms` - Database operation timing
- `error_during` - What operation failed
- Business metrics (counts, amounts, flags)

### Error Fields (Present on Errors)
- `error.type` - Error class name
- `error.message` - Error message
- `error.code` - Error code (if available)
- `db_error` - Boolean flag for database errors

## Usage Examples

### Example 1: Create Group

```typescript
create: protectedProcedure
  .handler(async ({ input, context }) => {
    // Enrich with business context
    if (context.wideEvent) {
      context.wideEvent.action = "create_group";
      context.wideEvent.group_name = input.name;
      context.wideEvent.has_default_price = !!input.defaultMembershipPrice;
    }
    
    try {
      const newGroup = await DB.mutation.groups.createGroup({...});
      
      // Add success details
      if (context.wideEvent) {
        context.wideEvent.group_id = newGroup.id;
        context.wideEvent.group_created = true;
      }
      
      return newGroup;
    } catch (error) {
      // Add error details
      if (context.wideEvent) {
        context.wideEvent.db_error = true;
        context.wideEvent.error_during = "group_creation";
      }
      throw error;
    }
  })
```

**Resulting Event:**
```json
{
  "trace_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-04T23:45:00.000Z",
  "method": "POST",
  "path": "/groups",
  "service": "api",
  "user_id": "user_123",
  "organization_id": "org_456",
  "action": "create_group",
  "group_name": "Premium Members",
  "has_default_price": true,
  "group_id": "grp_789",
  "group_created": true,
  "status_code": 200,
  "outcome": "success",
  "severity": "info",
  "duration_ms": 45
}
```

### Example 2: Create Member (with timing)

```typescript
const dbStartTime = Date.now();
try {
  const result = await DB.mutation.members.createMemberWithContract({...});
  
  if (context.wideEvent) {
    context.wideEvent.member_id = result.member.id;
    context.wideEvent.contract_id = result.contract.id;
    context.wideEvent.db_latency_ms = Date.now() - dbStartTime;
  }
} catch (error) {
  if (context.wideEvent) {
    context.wideEvent.db_latency_ms = Date.now() - dbStartTime;
    context.wideEvent.error_during = "member_creation";
  }
}
```

## Best Practices

### 1. Always Check if wideEvent Exists
```typescript
if (context.wideEvent) {
  context.wideEvent.action = "...";
}
```

### 2. Add Context Early
Add business context before operations, not just on success:
```typescript
// ✅ Good
context.wideEvent.action = "create_member";
const result = await createMember();

// ❌ Bad - loses context if error occurs
const result = await createMember();
context.wideEvent.action = "create_member";
```

### 3. Track Operation Timing
```typescript
const startTime = Date.now();
const result = await expensiveOperation();
context.wideEvent.operation_latency_ms = Date.now() - startTime;
```

### 4. Use Boolean Flags for Conditions
```typescript
context.wideEvent.has_coupon = !!input.couponCode;
context.wideEvent.is_premium = user.subscription === "premium";
```

### 5. Add Error Context in Catch Blocks
```typescript
catch (error) {
  if (context.wideEvent) {
    context.wideEvent.error_during = "payment_processing";
    context.wideEvent.payment_provider = provider;
  }
}
```

### 6. Don't Add Sensitive Data
```typescript
// ❌ Bad
context.wideEvent.password = input.password;
context.wideEvent.ssn = user.ssn;

// ✅ Good
context.wideEvent.has_password = !!input.password;
context.wideEvent.auth_method = "password";
```

## Querying Wide Events

Since all context is in one event, queries are simple:

```sql
-- Only show wide events (filter out rate limit warnings, auth failures, etc.)
SELECT * FROM logs
WHERE log_type = 'wide_event'

-- All failed member creations with their context
SELECT * FROM logs 
WHERE log_type = 'wide_event'
  AND action = 'create_member' 
  AND outcome = 'error'

-- Only server errors (5xx) from wide events
SELECT * FROM logs
WHERE log_type = 'wide_event'
  AND severity = 'error'

-- Only client errors (4xx) like rate limits, validation errors
SELECT * FROM logs
WHERE log_type = 'wide_event'
  AND severity = 'warning'

-- All rate limit errors (wide events only)
SELECT * FROM logs
WHERE log_type = 'wide_event'
  AND status_code = 429
  AND severity = 'warning'
  
-- Slow database operations
SELECT * FROM logs 
WHERE log_type = 'wide_event'
  AND db_latency_ms > 1000
  
-- Specific user's activity
SELECT * FROM logs 
WHERE log_type = 'wide_event'
  AND user_id = 'user_123'
ORDER BY timestamp DESC
```

## Filtering Log Types

Your logging system contains different types of logs:

1. **Wide Events** (`log_type = 'wide_event'`)
   - Comprehensive request lifecycle logs
   - One per API request
   - Contains full context, timing, errors, business metrics

2. **Other Logs** (no `log_type` field)
   - Rate limit warnings (from rate limit middleware)
   - Auth failures (from auth middleware)
   - Permission denials (from permissions middleware)
   - These provide additional detail for specific scenarios

**To view only wide events**, always filter by:
```sql
WHERE log_type = 'wide_event'
```

**To view only supplemental logs** (rate limits, auth, permissions):
```sql
WHERE log_type IS NULL
-- or in Axiom/other systems:
WHERE NOT EXISTS(log_type)
```

## Severity Levels

Events are automatically assigned severity based on their status code:

- **`info`** - Successful requests (2xx, 3xx status codes)
  - Logged with `logger.info()`
  - Normal operation
  
- **`warning`** - Client errors (4xx status codes)
  - Logged with `logger.warn()`
  - Includes: rate limits (429), validation errors (400), unauthorized (401), forbidden (403), not found (404)
  - These are expected errors caused by client behavior
  
- **`error`** - Server errors (5xx status codes)
  - Logged with `logger.error()`
  - Includes: internal server error (500), bad gateway (502), service unavailable (503)
  - These indicate problems with your application that need attention

## Migration Guide

When adding wide events to a new handler:

1. **Identify the business action**
   ```typescript
   context.wideEvent.action = "create_payment"
   ```

2. **Add input context**
   ```typescript
   context.wideEvent.payment_method = input.method
   context.wideEvent.amount_cents = input.amount
   ```

3. **Add timing for expensive operations**
   ```typescript
   const start = Date.now();
   const result = await stripeCall();
   context.wideEvent.stripe_latency_ms = Date.now() - start;
   ```

4. **Add success indicators**
   ```typescript
   context.wideEvent.payment_id = result.id
   context.wideEvent.payment_created = true
   ```

5. **Add error context**
   ```typescript
   catch (error) {
     context.wideEvent.stripe_error = true;
     context.wideEvent.error_code = error.code;
   }
   ```

## Relationship with Traditional Logging

Wide events complement (not replace) traditional error logging:

- **Wide Event** - Always emitted, contains request lifecycle
- **Error Logs** - Only on unexpected errors, contain stack traces

Both use `after()` for non-blocking logging.
