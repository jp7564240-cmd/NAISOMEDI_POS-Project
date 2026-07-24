# NaiSoMedi POS

Offline-first desktop pharmacy POS for Atelier Pharmacie (KES, VAT 16%).

## Development

Install the locked dependencies once, then run `npm run dev`. The launcher waits for Next before opening Tauri so WebView HMR connects to the live server.

The approved legacy sources are retained under `legacy-source/`. The receipt designer is served only from `vendor-legacy/Naisomedi-Luxe-Designer.html` inside a sandboxed iframe.

## Security posture

- no runtime network APIs or remote assets
- passwords and TOTP verification stay in Rust IPC commands
- all monetary values are integer KES cents
- navigation changes and sales are auditable
