# 3-Stride website

Live at https://3-stride.com, hosted on Netlify. Every push to `main` deploys automatically.

- `site/` is the public website. `index.html` is the whole page.
- `apps-script/Code.gs` is the Google Apps Script that receives the contact form. It is not part of the website. It lives in a Google Sheet under Extensions > Apps Script.
- `netlify.toml` tells Netlify to publish the `site` folder with no build step.

## Connecting the form
1. Deploy `Code.gs` as a web app (Execute as: Me, Access: Anyone).
2. Paste the `/exec` URL into `ENDPOINT` near the top of `site/index.html`.
3. Push.

Live endpoint (Nov 2026): https://script.google.com/macros/s/AKfycbz4tzu9eW0vplXHvfS_dwac6STb8OWxKjCizx8Q5NSrDEzPxaErCpp2SHa8WQso3Irc/exec
