# Loudr - Monetize your Reach

A reference client that implements the Atomic Signature Swap NIP for sponsoring the publication of Nostr events in exchange for Cashu payments.

## Prerequisites

- [Bun](https://bun.sh/) (Latest version)
- A Nostr-compatible browser extension (e.g., nos2x, Alby) or client
- Basic understanding of Nostr protocol

## Installation

```bash
# Clone the repository
git clone https://github.com/vstabile/loudr.git
cd loudr

# Install dependencies
bun install
```

## Development

To start the development server:

```bash
bun run dev
```

This will start the application in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Building for Production

To create a production build:

```bash
bun run build
```

This will generate optimized production files in the `dist` directory.

## License

MIT License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
