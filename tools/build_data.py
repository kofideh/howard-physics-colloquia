#!/usr/bin/env python3
"""Build data/speakers-data.js from data/speakers.csv using only Python's standard library."""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data" / "speakers.csv"
OUTPUT = ROOT / "data" / "speakers-data.js"

SERIES = {
    "semester": "Fall 2026",
    "time": "3:00–4:00 PM ET",
    "startTime": "15:00",
    "endTime": "16:00",
    "location": "Banneker North, Room C06",
    "organizer": "Howard University Department of Physics & Astronomy",
}

FIELD_MAP = {
    "event_url": "eventUrl",
    "registration_url": "registrationUrl",
    "speaker_url": "speakerUrl",
    "photo_url": "photoUrl",
    "youtube_url": "youtubeUrl",
}


def parse_bool(value: str) -> bool:
    return value.strip().lower() not in {"false", "0", "no", "n"}


def main() -> None:
    if not INPUT.exists():
        raise SystemExit(f"Missing input file: {INPUT}")

    events: list[dict[str, object]] = []
    with INPUT.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or "date" not in reader.fieldnames:
            raise SystemExit("speakers.csv must contain a 'date' column.")

        for row_number, row in enumerate(reader, start=2):
            date = (row.get("date") or "").strip()
            if not date:
                print(f"Skipping row {row_number}: no date")
                continue

            event: dict[str, object] = {}
            for source_key, raw_value in row.items():
                key = FIELD_MAP.get(source_key, source_key)
                value = (raw_value or "").strip()
                if key == "published":
                    event[key] = parse_bool(value)
                else:
                    event[key] = value
            events.append(event)

    payload = {"series": SERIES, "events": events}
    rendered = "/* Generated from data/speakers.csv. Do not put private email addresses here. */\n"
    rendered += "window.HOWARD_COLLOQUIA = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT.write_text(rendered, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(events)} events.")


if __name__ == "__main__":
    main()
