# Fonts

Put the Aeonik Fono files here (any of .woff2 / .woff / .otf / .ttf):

    AeonikFono-Light.woff2
    AeonikFono-Regular.woff2
    AeonikFono-Medium.woff2
    AeonikFono-Bold.woff2

The site loads them automatically (see the @font-face rules at the top of `src/1_head.html`).
If they aren't here, the browser uses a locally installed Aeonik Fono, then falls back to a system font.

**Licensing:** Aeonik Fono is a commercial typeface (CoType Foundry). Only commit the files if your licence
allows web embedding, and keep the repository **private** if it does not allow redistribution.
After Effects uses the font installed on your machine, not these files.
