# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

Requires Node 24. Run `nvm use 24` in every terminal before any commands.

## Commands

```bash
npm run start:dev       # dev with watch
npm run build           # compile TypeScript
npm run start:prod      # run compiled output
npm run lint            # ESLint with auto-fix
npm run format          # Prettier
npm run test            # unit tests (jest, rootDir: src, *.spec.ts)
npm run test:watch      # jest in watch mode
npm run test:cov        # coverage
npm run test:e2e        # e2e (test/jest-e2e.json)
```

Run a single test file:
```bash
npx jest src/modules/photo/commands/create-photo/create-photo.service.spec.ts
```

Database (Prisma + PostgreSQL):
```bash
docker compose -f docker/docker-compose.yaml up -d   # start local postgres
npx prisma migrate dev                                # apply migrations
npx prisma generate                                   # regenerate client after schema changes
```

CLI entrypoint (nest-commander):
```bash
node dist/cli.js <command>   # run a registered CLI command
```

## Architecture

Hexagonal DDD following [Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon). Four strict layers:

| Layer | Location | Rule |
|---|---|---|
| Domain | `src/modules/<feature>/domain/` | No NestJS, no IO, pure TypeScript |
| Application | `src/modules/<feature>/commands/` | Orchestrates ports; no direct IO |
| Infrastructure | `src/infrastructure/` | Implements ports; owns IO |
| Interface | resolvers/controllers (not yet wired) | Maps transport ↔ application |

**Module anatomy** (`src/modules/photo/` is the only feature module):
- `domain/` — entities (`PhotoEntity`, `FileEntity`), value objects, pure domain services (`SupportedFileFormatsService`, `ImageDeliveryStrategyService`)
- `commands/<usecase>/` — one `*Service` per use case, decorated `@CommandHandler`; returns `Result<T, E>` from `oxide.ts` for recoverable errors
- `database/` — DAO port (`photo.dao.port.ts`) + Prisma adapter (`photo.dao.ts`), bound via `PHOTO_DAO` DI token
- `mappers/` — bidirectional mapping between domain entities and persistence models
- `exceptions/` — feature-specific exceptions, all extending `ExceptionBase`

**Infrastructure modules** (all `@Global` or imported explicitly):
- `StorageModule.forRoot()` — pluggable via `STORAGE_TYPE` env var (`local` | `s3`); resolves to `LocalStorageStrategy` or `S3StorageStrategy`, both extending `AbstractStorageStrategy`. Exposed via `STORAGE_STRATEGY_TOKEN`.
- `ImageProcessingModule` — `sharp` for resize (`AvifImageResizeAdapter`), `sharp` for image info (`SharpImageInfoAdapter`); tokens in `image-processing.di-tokens.ts`
- `ExifModule` — `exifr` adapter behind `EXIF_READER_TOKEN`
- `PrismaModule` — `PrismaService` singleton
- `LoggerModule.forRoot()` — binds `LOGGER_PORT` to `PinoLoggerAdapter` (prod) or `NestLoggerAdapter` (test). Inject `LOGGER_PORT` in application/domain services; never use `new Logger()` in those layers.

**Path aliases** (defined in `tsconfig.json`):
- `@src/*` → `src/*`
- `@modules/*` → `src/modules/*`
- `@libs/*` → `src/libs/*`
- `@config/*` → `src/configs/*`

**DDD base classes** (`src/libs/ddd/`):
- `Entity<Props>` — base with `id`, `createdAt`, `updatedAt`, `validate()`, `getProps()`, `toObject()`
- `AggregateRoot<Props>` — extends `Entity`, owns domain events
- `ValueObject<Props>` — equality by value
- `CommandBase`, `QueryBase` — CQRS primitives
- `DaoPort` / `PrismaDaoBase` — DAO contract and Prisma base

## Error Handling

- **All errors must extend `ExceptionBase`** (`src/libs/exceptions/exception.base.ts`). Never throw plain `Error`.
- Generic codes live in `src/libs/exceptions/exception.codes.ts`; feature/adapter codes live in `<module>/exceptions/`.
- Domain and application layers must not throw HTTP exceptions; map at the interface (resolver/controller) layer.
- Use `oxide.ts` `Result<T, E>` / `Ok` / `Err` for recoverable, business-domain errors in command services. Throw for unrecoverable technical failures.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `STORAGE_TYPE` | `local` or `s3` | `local` |
| `LOCAL_STORAGE_BASE_PATH` | Base path for local storage | `./storage` |
| `LOCAL_STORAGE_TEMP_PATH` | Temp dir for local storage | OS tmpdir |
| `S3_BUCKET_NAME` | S3 bucket (required for `s3`) | — |
| `S3_BASE_PATH` | Key prefix in S3 | — |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | — |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | — |
| `PORT` | HTTP port | `3000` |

## Adding a New Feature

1. Create `src/modules/<feature>/` with `domain/`, `commands/`, `database/`, `mappers/`, `exceptions/`
2. Domain model: extend `Entity` or `AggregateRoot`; no NestJS imports
3. Command service: implement `ICommandHandler`; inject ports via DI tokens; return `Result` for recoverable errors
4. DAO port interface in `database/<feature>.dao.port.ts`; Prisma adapter in `database/<feature>.dao.ts`; bind with a Symbol token in `<feature>.di-tokens.ts`
5. Wire everything in `<feature>.module.ts` using provider groups (`mappers`, `daoProviders`, `domainServices`, `commands`)
6. Feature exceptions extend `ExceptionBase` with a stable string `code`

## Logging

Inject `LOGGER_PORT` (token from `src/libs/tokens/logger.token.ts`) typed as `LoggerPort` (`src/libs/ports/logger.port.ts`). Never inject NestJS `Logger` directly in domain or application layers. `LoggerModule` is not yet globally registered in `AppModule` — import it per-module or register globally before use.
