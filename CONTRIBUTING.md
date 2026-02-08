# Contributing to Discarr

## Development Setup

```bash
git clone https://github.com/StevenGann/Discarr.git
cd Discarr
npm install
cp config.example.env .env
# Edit .env with test values
```

## Running Locally

For screen share mode, you need a virtual display:

```bash
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99
npm run dev
```

The API runs at http://localhost:3000.

## Code Style

- TypeScript with strict mode
- ESLint for linting: `npm run lint`
- JSDoc on public interfaces and non-obvious logic

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Adding Features

### New output backend (virtual webcam, etc.)

1. Add backend in `src/backends/<name>/`
2. Implement `OutputBackend` interface
3. Register in `src/backends/registry.ts`
4. Add corresponding feeder if needed (e.g., `FFmpegV4L2Feeder` for virtual webcam)

### New video source

1. Extend play schema in `src/api/routes.ts`
2. Add resolution logic in `src/sources/resolver.ts`

## Pull Requests

1. Ensure `npm run lint` and `npm run build` pass
2. Add tests if applicable
3. Update documentation for user-facing changes

## Discord Controller Notes

`discord-controller.ts` uses Selenium with Firefox. Discord’s UI selectors (e.g., `aria-label`, `data-list-item-id`) can change with updates. If automation breaks, check:

- [data-list-item-id] for channel list items
- button[aria-label="..."] for action buttons

Test with a persistent Firefox profile so login is not required on each run.
