# Project Guidelines — S3Gallery API

Project type: NestJS (TypeScript) backend using GraphQL + CQRS, Prisma, and pluggable storage (e.g., AWS S3, local). The
architecture roughly follows the hexagonal (ports and adapters) Domain‑Driven Design approach described by
Sairyss: https://github.com/Sairyss/domain-driven-hexagon/blob/master/README.md

Overview of our hexagonal DDD flavor

- Domain (the core): Business logic modeled via entities/value objects/services. Keep it framework‑agnostic and pure
  TypeScript.
- Application layer: Coordinates use cases (commands/queries), orchestrates domain services and repositories/DAOs via
  ports (interfaces). Avoid external IO here except through ports.
- Infrastructure (adapters): Implementations of ports (DB via Prisma, storage strategies, EXIF, image resize, etc.),
  frameworks, and external integrations. Wiring through NestJS modules and DI.
- Interface layer: GraphQL resolvers/controllers, DTO mapping, and transport concerns.

Repository layout (selected paths)

- src/modules/<feature>
  - domain/ … domain services, pure logic for the feature (e.g., ImageDeliveryStrategyService,
    SupportedFileFormatsService).
  - commands/ … application services that implement use cases (e.g., CreatePhotoService, ScanFilesystemService,
    ResizeImageService).
  - database/ … DAOs and persistence ports/adapters (e.g., PhotoDao) referenced via DI tokens (e.g., PHOTO_DAO).
  - mappers/ … mapping between domain and external DTOs/persistence models (e.g., PhotoMapper, FileMapper).
  - <feature>.module.ts … composes providers for the feature, imports infrastructure modules.
- src/infrastructure/ … adapters and cross‑cutting infrastructure
  - prisma/ … Prisma service/module (DB port adapter)
  - storage/ … storage module, strategies (local, S3), exceptions, config interfaces
  - image-resize/, exif/ … other IO adapters
- src/libs/ddd/ … DDD utilities and base classes (e.g., command.base.ts, domain-event.base.ts)
- prisma/ … Prisma schema and migrations (requires DATABASE_URL)
- test/ … Jest tests (unit/e2e)

Conventions

- Domain purity: Domain and application code must not import infrastructure details. Depend on interfaces (ports) and DI
  tokens instead.
- Commands/use cases: One service per use case under modules/<feature>/commands/<usecase> (keep input/output DTOs close
  to the use case).
- Repositories/DAOs: Expose ports (interfaces/types) and bind concrete Prisma/other adapters in the module via DI
  tokens.
- Providers grouping: Feature modules group mappers, daoProviders, domainServices, and commands, and import needed
  infrastructure modules.
- Error handling: Model domain errors explicitly; use infrastructure exceptions for IO concerns.

Exceptions and error handling principles

- All custom errors MUST extend ExceptionBase (src/libs/exceptions/exception.base.ts). This ensures consistent shape (message, code, correlationId, cause, metadata) and safe serialization.
- Exceptions placement: Keep only generic/base exceptions under src/libs/exceptions. Non-generic exceptions MUST live within their owning module or infrastructure adapter directories (e.g., src/modules/<feature>/exceptions/, src/infrastructure/<adapter>/exceptions/). Do not scatter exceptions elsewhere.
- Do NOT throw generic Error anywhere in the codebase. Always throw a typed exception extending ExceptionBase.
- Domain and application layers MUST NOT throw HTTP exceptions or reference HTTP status codes. These layers are transport-agnostic. Map domain/application errors to transport-specific errors in the interface layer (e.g., GraphQL resolvers/controllers).
- Prefer returning explicit error types for likely‑recoverable, business‑domain errors using oxide.ts Result and Option (https://www.npmjs.com/package/oxide.ts). This makes outcomes explicit and easier to handle.
  - Define ADTs (union types) for use-case error sets (e.g., type CreateUserError = UserAlreadyExistsError | IncorrectUserAddressError).
  - Return Ok(value) or Err(error) from oxide.ts in application services where appropriate, and handle them at the boundary (e.g., resolvers) by mapping to transport errors/statuses.
- Throw for unrecoverable technical failures (e.g., out-of-memory, corrupted state, critical IO failure) to fail fast.
- Assign a stable code string to every exception (see src/libs/exceptions/exception.codes.ts and codes defined within feature exception files) for cross-process error handling.
- Avoid leaking sensitive data in exception metadata.
- Example mapping at the interface layer:
  - const result = await this.commandBus.execute(command);
  - return match(result, {
    Ok: (data) => data,
    Err: (error) => {
      // map domain/app exceptions to transport-specific errors here
      throw error; // or transform accordingly
    },
  });

Logging principles and architecture

Principles

- Keep domain pure: the domain layer does not know NestJS or any concrete logger.
- Depend on a port: application layer uses a LoggerPort interface; infrastructure provides adapters.
- Prefer structured logs: log JSON with fields/metadata over string-only messages.
- Correlate requests: automatically add correlation/request IDs and user/context to every log.
- Centralize cross-cutting logging: use interceptors/middleware/filters for inbound/outbound and error logging, not business logic.
- Make it swappable: use a null/fake logger for tests; Pino/Winston locally and in prod.

Recommended architecture

- Domain/Application layer
  - Define a LoggerPort with methods like log/info/warn/error/debug. Accept message and a context/meta object.
  - Use LoggerPort in application services and domain services only when it conveys business value (e.g., command handled, domain event published). Avoid logging inside entities/aggregates; emit domain events instead.

- Infrastructure layer (adapters)
  - Implement LoggerPort with a concrete adapter (e.g., Pino or Winston).
  - Enrich logs with correlationId, requestId, userId, and module/context (automatic via request-scoped context or CLS).
  - Provide multiple adapters:
    - ConsoleJsonLoggerAdapter (dev)
    - PinoLoggerAdapter or WinstonLoggerAdapter (prod)
    - Null/FakeLoggerAdapter (tests)

- NestJS integration
  - Use a Nest provider token for LoggerPort, binding it to your chosen adapter.
  - Use a request context solution to auto-enrich logs:
    - nestjs-cls or AsyncLocalStorage to store correlationId, userId, tenantId.
  - Interceptors/Middleware/Filters:
    - Middleware: start CLS context, generate correlationId if missing, attach to request.
    - Interceptor: log inbound request/response timing and status.
    - Exception filter: catch errors, log structured error details once (avoid duplicate logs).
  - Optionally bridge to Nest’s LoggerService so framework logs go through your adapter (single sink).

What to log (and where)

- Middleware/Interceptor:
  - method, path, status, duration, correlationId, userId, ip, userAgent
- Application services/handlers:
  - high-level business events: command started/completed, aggregate updated, domain event published
- Error handling:
  - exception type, message, stack (redacted as needed), correlationId, inputs summary (never raw sensitive payloads)

Configuration

- Dev: pretty-print + minimal noise.
- Prod: JSON logs, fixed schema, stable keys. Route to stdout; let the platform aggregate (e.g., CloudWatch, ELK).
- Levels per environment (e.g., debug only in dev).
- Redaction/PII: define a redaction list (password, tokens, secrets, etc.). Use serializer/redaction features (Pino supports redaction paths).

Testing

- Inject Null/Fake logger to silence logs and assert calls in unit tests.
- For integration/e2e, keep JSON logs and assert presence of correlationId.

How to run

- Node version: Run `nvm use 24` in every terminal session before running any commands (requires nvm).
- Install: npm install
- Dev: npm run start:dev
- Prod build: npm run build; start with npm run start:prod

Testing and quality

- Unit tests: npm run test
- E2E tests: npm run test:e2e (if configured)
- Coverage: npm run test:cov
- Lint: npm run lint (auto‑fixes enabled)
- Format: npm run format (Prettier)

Environment/config

- Database: Prisma expects DATABASE_URL in environment (.env, CI vars, or container). See prisma/ docs.
- Storage: StorageModule.forRoot() resolves strategy and config (e.g., local vs S3). Provide necessary env variables for
  the selected strategy.
- GraphQL: Uses @nestjs/graphql and @apollo/server; typical GraphQL config is done in the app module (not shown here).

Adding a new feature (quick recipe)

1. Create src/modules/<feature>/ with subfolders domain, commands, database, mappers as needed.
2. Define domain model/service(s) in domain/ (no NestJS or IO imports).
3. Define a use‑case service under commands/<usecase>/ that orchestrates domain services and ports.
4. Define a DAO/repository port and its adapter (e.g., Prisma) under database/.
5. Register DI tokens and provide adapter bindings in <feature>.module.ts; import required infrastructure modules.
6. Expose resolver/controller in the interface layer (GraphQL resolver or REST controller) that calls the command
   service.
7. Add unit tests for domain and application layers; add e2e tests when touching transport.

Code style

- TypeScript 5.x, strict mode (tsconfig.json). Run lint and format before pushing.
- Keep domain pure (no Nest imports); prefer dependency inversion via tokens.
- Small, cohesive services; single responsibility for commands/use cases.

Junie’s checklist before submitting a change

- Ensure changes respect the hexagonal boundaries (domain/application free from infrastructure concerns).
- Run: npm run lint && npm run test (and npm run test:e2e if applicable).
- If build is affected: npm run build to catch TS/DI errors early.
- Update docs and DI tokens/providers in modules when adding new adapters/ports.

Reference

- Hexagonal DDD guide used as inspiration: https://github.com/Sairyss/domain-driven-hexagon/blob/master/README.md
