# Code Signing Guide

Code-signing certificates and private keys (`.pfx`, `.p12`, `.key`, `.pem`) are excluded by `.gitignore` and must never be committed to the repository or bundled inside the packaged application.

## Environment Variables (`electron-builder`)

### Windows (`.pfx` / `.p12`)
`electron-builder` signs Windows executables and NSIS/portable installers with SHA-256 and RFC 3161 timestamping (`http://timestamp.digicert.com`) whenever a certificate is supplied:

- `WIN_CSC_LINK` (or `CSC_LINK`): Local path to a `.pfx`/`.p12` file, HTTPS URL, or base64-encoded certificate contents.
- `WIN_CSC_KEY_PASSWORD` (or `CSC_KEY_PASSWORD`): Password for the `.pfx`/`.p12` private key.

PowerShell example for local packaging:

```powershell
$env:WIN_CSC_LINK = "C:\path\to\codesign.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-certificate-password"
npm run package:win
```

When neither `WIN_CSC_LINK` nor `CSC_LINK` is set, `electron-builder` skips signing so local development builds continue to work.

### macOS (Developer ID `.p12` + Notarization)
`build/entitlements.mac.plist` is wired into `package.json` (`build.mac`) with `hardenedRuntime: true`.

- `CSC_LINK`: Base64-encoded Developer ID Application `.p12` certificate (or path/URL).
- `CSC_KEY_PASSWORD`: Password for the `.p12` file.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: Required for Apple notarization in CI.

## GitHub Actions Secrets (`.github/workflows/release.yml`)
Configure these repository secrets in GitHub Settings -> Secrets and variables -> Actions:

| Secret | Platform | Purpose |
| --- | --- | --- |
| `WIN_CSC_LINK` | Windows | Base64-encoded `.pfx`/`.p12` Windows code-signing certificate (falls back to `CSC_LINK`) |
| `WIN_CSC_KEY_PASSWORD` | Windows | Password for `WIN_CSC_LINK` (falls back to `CSC_KEY_PASSWORD`) |
| `CSC_LINK` | macOS / Fallback | Base64-encoded `.p12` Developer ID certificate |
| `CSC_KEY_PASSWORD` | macOS / Fallback | Password for `CSC_LINK` |
| `APPLE_ID` | macOS | Apple ID for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS | App-specific password for notarization |
| `APPLE_TEAM_ID` | macOS | Apple Developer Team ID |
