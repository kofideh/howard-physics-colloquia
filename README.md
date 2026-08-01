# Howard Physics Colloquium website

A responsive static website for the Howard University Department of Physics & Astronomy colloquium series. It includes:

- a prominent next-talk panel;
- searchable speaker and talk cards;
- speaker portraits or automatic initials when no portrait is available;
- abstracts and event details in an accessible dialog;
- registration, event-page, speaker-profile, and YouTube buttons;
- automatic separation of upcoming and completed talks;
- a recordings section that appears when YouTube links are added;
- downloadable calendar (`.ics`) files;
- mobile-responsive and keyboard-accessible layouts.

## Open the website

Double-click `index.html`. Most functionality works directly from the file system.

For the most reliable preview, double-click `serve_site.bat`. This starts a small local web server and opens `http://localhost:8000`. Python must be installed.

## Update a speaker or add a YouTube recording

1. Open `data/speakers.csv` in Excel.
2. Edit the appropriate row.
3. Save it as **CSV UTF-8 (Comma delimited)** and keep the filename `speakers.csv`.
4. Double-click `update_site.bat`.
5. Refresh the website.

For a completed talk, paste the full YouTube link into the `youtube_url` column. The site will automatically show a **Watch recording** button and add the talk to the Recorded Colloquia section after the talk date passes.

## CSV columns

| Column | Use |
|---|---|
| `date` | Required, in `YYYY-MM-DD` format. |
| `speaker` | Public speaker name. |
| `institution` | Public institution or affiliation. |
| `title` | Talk title. Blank values display “Talk title forthcoming.” |
| `abstract` | Full abstract. Paragraph breaks are allowed. |
| `format` | For example `In person`, `Virtual`, or `Hybrid`. |
| `location` | Optional event-specific location; blank uses the series default. |
| `event_url` | Official Howard event-page link. |
| `registration_url` | Registration or Zoom-registration link. |
| `speaker_url` | Public faculty or professional profile. |
| `photo_url` | Approved public headshot URL or local image path such as `assets/photos/ratra.jpg`. |
| `youtube_url` | YouTube recording link. |
| `status` | `scheduled`, `reserved`, `open`, or `cancelled`. Upcoming/completed is calculated from the date. |
| `published` | `true` to show the event; `false` to keep an unconfirmed speaker off the public site. |

## Important privacy rule

Do **not** place private speaker email addresses, personal phone numbers, or internal inviter notes in `speakers.csv` or `speakers-data.js`. Static website files are publicly readable even when a field is not displayed. Keep those details in the internal Excel planning workbook only.

## Add local speaker photographs

1. Create `assets/photos`.
2. Copy the approved image there, preferably as a compressed JPG or WebP.
3. Enter a relative path in `photo_url`, for example `assets/photos/nadya-mason.webp`.
4. Run `update_site.bat`.

Use photographs supplied or approved by the speaker or their institution. Add concise, accurate alt text by editing the optional `photoAlt` value directly in `data/speakers-data.js`, or extend the CSV and script with a `photo_alt` column.

## Change semester, default time, or location

Edit the `SERIES` dictionary near the top of `tools/build_data.py`, then run `update_site.bat`.

## Publish the site

### GitHub Pages

1. Create a repository and upload the contents of this folder.
2. In the repository settings, enable **Pages** from the main branch and root folder.
3. GitHub will provide a public URL.

### Howard University hosting

For an official Howard subdomain, coordinate with Howard’s Web Innovation & Strategy team. The starter uses official Howard primary colors and keeps blue dominant. It deliberately uses a text-based HU marker instead of downloading or reproducing the official Clock Tower logo; Howard’s web guidelines say official logo files should be obtained from the Office of University Communications.

## Before public launch

Several names in the source workbook may represent prospective or tentative speakers rather than confirmed public events. Set `published` to `false` for every unconfirmed invitation before publishing. Also verify affiliations, talk formats, titles, room details, and spelling directly with each speaker.

## Design references

- Howard University official colors and typography: https://ouc.howard.edu/our-services/creative-branding-multimedia/colors-typography
- Howard University web style guidelines: https://ouc.howard.edu/our-services/user-experience-web-strategy/style-guidelines
- Howard Mathematics Colloquium example: https://deleo.website/HU/colloquium.html
