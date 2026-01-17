#!/usr/bin/env python3
"""
Extract text from TEI XML and create chapter-divided JSON with place annotations.
The text in the TEI is the Godley translation from Perseus, with Recogito annotations.

This version properly parses chapter numbers from the text (e.g., "17." at start of chapters).
"""

import re
import json
from pathlib import Path
from html import unescape

TEI_PATH = Path(__file__).parent.parent.parent / 'tjrrsqn4dwmgep.tei.xml'
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'data'

BOOK_TITLES = {
    1: "Clio", 2: "Euterpe", 3: "Thalia", 4: "Melpomene",
    5: "Terpsichore", 6: "Erato", 7: "Polymnia", 8: "Urania", 9: "Calliope"
}

def extract_text_from_tei():
    """Extract raw text content from TEI XML, preserving structure."""
    with open(TEI_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the body content
    body_match = re.search(r'<body>(.*?)</body>', content, re.DOTALL)
    if not body_match:
        raise ValueError("Could not find body in TEI")

    body = body_match.group(1)

    # Find book divisions by looking for "Book N" paragraphs
    book_pattern = r'<p>Book (\d+)</p>'
    books_raw = {}

    # Split by book markers
    parts = re.split(book_pattern, body)

    # parts[0] is before "Book 1", parts[1] is "1", parts[2] is content, etc.
    for i in range(1, len(parts), 2):
        if i + 1 < len(parts):
            book_num = int(parts[i])
            book_content = parts[i + 1]
            books_raw[book_num] = book_content

    return books_raw

def clean_text(text):
    """Remove XML tags but preserve text content, marking places."""
    # First, extract place references and mark them
    place_pattern = r'<placeName[^>]*ref="([^"]*)"[^>]*>([^<]*)</placeName>'

    def replace_place(match):
        uri = match.group(1)
        name = match.group(2)
        # Extract place ID from URI
        place_id = None
        if 'pleiades.stoa.org/places/' in uri:
            place_id = uri.split('/places/')[-1]
        elif 'geonames.org/' in uri:
            place_id = 'geonames-' + uri.split('/')[-1]
        else:
            place_id = 'hestia-' + name.lower().replace(' ', '-')
        return f'{{{{PLACE:{place_id}:{name}}}}}'

    text = re.sub(place_pattern, replace_place, text)

    # Handle placeName without ref
    text = re.sub(r'<placeName[^>]*>([^<]*)</placeName>', r'\1', text)

    # Remove persName tags, keeping content
    text = re.sub(r'<persName[^>]*>([^<]*)</persName>', r'\1', text)

    # Remove note tags entirely
    text = re.sub(r'<note[^>]*>[^<]*</note>', '', text)

    # Remove other XML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()

    # Unescape HTML entities
    text = unescape(text)

    return text

def divide_into_chapters(text):
    """
    Divide text into chapters based on chapter number markers in the text.
    Herodotus chapters are marked with numbers like "17." at the start of sections.
    """
    # Pattern to find chapter markers: number followed by period,
    # typically preceded by sentence-ending punctuation and space
    # e.g., ". 17." or ": 17." or '" 17.' or ", 7." or "" 4."
    # We look for standalone numbers that mark new chapters

    # Split on pattern like: end of sentence + space + number + period
    # The chapter numbers appear as "N." where N is 1-3 digits
    # Include comma as it's used before some chapters
    # Include curly quotes (unicode 8220, 8221) and digits (for footnote numbers)
    # Also handle various other punctuation that may precede chapter numbers
    chapter_pattern = r'(?<=[.!?"\':;,\u201c\u201d0-9]) (\d{1,3})\.'

    # Find all chapter markers with their positions
    markers = list(re.finditer(chapter_pattern, text))

    if not markers:
        # Fallback: return entire text as one chapter
        return {1: text}

    chapters = {}

    # Handle text before first marker (usually chapter 1 content)
    first_marker = markers[0]
    first_chapter_num = int(first_marker.group(1))

    # If text exists before the first numbered marker, it's chapter 1
    pre_text = text[:first_marker.start()].strip()
    if pre_text and first_chapter_num > 1:
        chapters[1] = pre_text
    elif pre_text:
        # First marker is chapter 2 or higher, so pre_text is chapter 1
        chapters[1] = pre_text

    # Process each marker
    for i, marker in enumerate(markers):
        chapter_num = int(marker.group(1))

        # Start position is after the marker (after "N.")
        start_pos = marker.end()

        # End position is at the start of next marker, or end of text
        if i + 1 < len(markers):
            end_pos = markers[i + 1].start()
        else:
            end_pos = len(text)

        chapter_text = text[start_pos:end_pos].strip()

        if chapter_text:
            chapters[chapter_num] = chapter_text

    return chapters

def extract_places_from_text(text):
    """Extract place markers from text and return both clean text and place list."""
    places = []
    pattern = r'\{\{PLACE:([^:]+):([^}]+)\}\}'

    # Find all places with their positions
    clean_parts = []
    last_end = 0

    for match in re.finditer(pattern, text):
        # Add text before this place
        clean_parts.append(text[last_end:match.start()])

        place_id = match.group(1)
        place_name = match.group(2)

        # Calculate position in clean text
        clean_pos = len(''.join(clean_parts))

        places.append({
            'placeId': place_id,
            'name': place_name,
            'startOffset': clean_pos,
            'endOffset': clean_pos + len(place_name)
        })

        # Add the place name (not the marker)
        clean_parts.append(place_name)
        last_end = match.end()

    # Add remaining text
    clean_parts.append(text[last_end:])

    return ''.join(clean_parts), places

def process_books(books_raw):
    """Process all books and create JSON output."""
    books_data = {}

    for book_num in range(1, 10):
        if book_num not in books_raw:
            print(f"Warning: Book {book_num} not found in TEI")
            continue

        print(f"Processing Book {book_num}...")

        # Clean the book text
        clean_book = clean_text(books_raw[book_num])

        # Divide into chapters based on actual chapter markers
        chapter_dict = divide_into_chapters(clean_book)

        # Get sorted chapter numbers
        chapter_nums = sorted(chapter_dict.keys())
        print(f"  Found {len(chapter_nums)} chapters (range: {min(chapter_nums)}-{max(chapter_nums)})")

        # Process each chapter
        chapters = []
        for chapter_num in chapter_nums:
            chapter_text = chapter_dict[chapter_num]
            clean_chapter, places = extract_places_from_text(chapter_text)

            chapters.append({
                'id': chapter_num,
                'text': clean_chapter,
                'places': places
            })

        books_data[book_num] = {
            'id': book_num,
            'title': f"Book {book_num}: {BOOK_TITLES[book_num]}",
            'chapters': chapters
        }

        # Write individual book file with text
        output_file = OUTPUT_DIR / f'book-{book_num}-text.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(books_data[book_num], f, indent=2, ensure_ascii=False)
        print(f"  Wrote {output_file.name} ({len(chapters)} chapters)")

    return books_data

def main():
    print("Extracting text from TEI XML...")
    books_raw = extract_text_from_tei()
    print(f"Found {len(books_raw)} books")

    print("\nProcessing books...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    books_data = process_books(books_raw)

    print("\nDone!")

if __name__ == '__main__':
    main()
