# Tab Cleaner Extension

A Chrome extension that helps you efficiently manage your browser tabs by removing tabs belonging to specified domains.

## Features

- **Domain Registration**: Register the domain of the current tab using the shortcut "Control (Command) + Shift + E".
- **Bulk Remove Tabs**: Remove all tabs belonging to registered domains using the shortcut "Control (Command) + E".
- **Navigate to Removed Pages**: Return to previously removed pages.

## Installation

Install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/tab-cleaner-extension/lbechddallmndemekdkfkmfjcbloehco?authuser=0&hl=ja).

## Development

### Without Containers

1. Install the dependencies

```bash
bun i --frozen-lockfile
```

2. Build the extension

```bash
bun run build
```

### With Containers

1. Build the docker image

```bash
docker compose up -d --build
```

2. Install the dependencies

```bash
docker compose exec bub bun i --frozen-lockfile
```

3. Build the extension

```bash
docker compose exec bun bun run build
```
