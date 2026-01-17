#!/usr/bin/env python3
"""
Transform Recogito CSV annotations into HestiaViz JSON format.
This script processes the HESTIA annotations and generates:
- books.json: Index of all books
- book-{n}.json: Each book with chapters and place references
- places.json: Gazetteer of all places with coordinates and occurrences

This version uses the actual chapter boundaries from the extracted text files.
"""

import csv
import json
import re
import os
from collections import defaultdict
from pathlib import Path

# Input/output paths
CSV_PATH = Path(__file__).parent.parent.parent / 'tjrrsqn4dwmgep.csv'
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'data'

# Book titles from Herodotus
BOOK_TITLES = {
    1: "Clio",
    2: "Euterpe",
    3: "Thalia",
    4: "Melpomene",
    5: "Terpsichore",
    6: "Erato",
    7: "Polymnia",
    8: "Urania",
    9: "Calliope"
}

def load_chapter_info():
    """Load chapter info from the generated text files."""
    chapter_info = {}

    for book_num in range(1, 10):
        text_file = OUTPUT_DIR / f'book-{book_num}-text.json'
        if text_file.exists():
            with open(text_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                chapters = data['chapters']
                # Get list of actual chapter IDs
                chapter_ids = sorted([ch['id'] for ch in chapters])
                chapter_info[book_num] = {
                    'count': len(chapters),
                    'max_id': max(chapter_ids) if chapter_ids else 1,
                    'chapter_ids': chapter_ids
                }
        else:
            # Fallback
            chapter_info[book_num] = {
                'count': 100,
                'max_id': 100,
                'chapter_ids': list(range(1, 101))
            }

    return chapter_info

def parse_csv():
    """Parse the Recogito CSV export."""
    annotations = []

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Only process PLACE type annotations with coordinates
            if row['TYPE'] == 'PLACE' and row['LAT'] and row['LNG']:
                # Extract book number from FILE column
                book_match = re.search(r'Book (\d+)', row['FILE'])
                if not book_match:
                    continue

                book_num = int(book_match.group(1))

                # Extract character offset
                offset_match = re.search(r'char-offset:(\d+)', row['ANCHOR'])
                if not offset_match:
                    continue

                char_offset = int(offset_match.group(1))

                # Extract place ID from URI
                place_id = None
                uri = row['URI']
                if 'pleiades.stoa.org/places/' in uri:
                    place_id = uri.split('/places/')[-1]
                elif 'geonames.org/' in uri:
                    place_id = 'geonames-' + uri.split('/')[-1]
                else:
                    # Generate ID from name for unidentified places
                    place_id = 'hestia-' + row['QUOTE_TRANSCRIPTION'].lower().replace(' ', '-')

                annotations.append({
                    'uuid': row['UUID'],
                    'book': book_num,
                    'quote': row['QUOTE_TRANSCRIPTION'],
                    'char_offset': char_offset,
                    'place_id': place_id,
                    'uri': uri,
                    'label': row['VOCAB_LABEL'].split('|')[0] if row['VOCAB_LABEL'] else row['QUOTE_TRANSCRIPTION'],
                    'lat': float(row['LAT']),
                    'lng': float(row['LNG']),
                    'place_type': row['PLACE_TYPE'],
                    'verified': row['VERIFICATION_STATUS'] == 'VERIFIED',
                    'is_ethnic': 'Ethnic' in (row['TAGS'] or '') or 'ethnic' in (row['TAGS'] or '')
                })

    return annotations

def build_places_gazetteer(annotations):
    """Build the places.json gazetteer from annotations."""
    places = {}

    for ann in annotations:
        place_id = ann['place_id']

        if place_id not in places:
            places[place_id] = {
                'id': place_id,
                'name': ann['label'] or ann['quote'],
                'lat': ann['lat'],
                'lng': ann['lng'],
                'pleiadesUri': ann['uri'] if 'pleiades' in ann['uri'] else None,
                'geonamesUri': ann['uri'] if 'geonames' in ann['uri'] else None,
                'placeType': ann['place_type'],
                'isEthnic': ann['is_ethnic'],
                'occurrences': []
            }

        # Add occurrence (we'll fill in chapter later)
        places[place_id]['occurrences'].append({
            'book': ann['book'],
            'charOffset': ann['char_offset'],
            'quote': ann['quote']
        })

    return places

def assign_chapters_to_annotations(annotations, chapter_info):
    """
    Assign chapter numbers to annotations based on character offset.
    Uses the actual chapter text to find boundaries.
    """
    # Load full text for each book to build character offset -> chapter mapping
    for book_num in range(1, 10):
        text_file = OUTPUT_DIR / f'book-{book_num}-text.json'
        if not text_file.exists():
            continue

        with open(text_file, 'r', encoding='utf-8') as f:
            book_data = json.load(f)

        # Build cumulative character offset for each chapter
        # We'll estimate which chapter an annotation belongs to
        chapters = book_data['chapters']

        # Calculate total text length and chapter boundaries
        cumulative_len = 0
        chapter_boundaries = []
        for ch in chapters:
            start = cumulative_len
            cumulative_len += len(ch['text']) + 1  # +1 for space between chapters
            chapter_boundaries.append({
                'id': ch['id'],
                'start': start,
                'end': cumulative_len
            })

        total_len = cumulative_len

        # Get max char offset for this book from annotations
        book_annotations = [a for a in annotations if a['book'] == book_num]
        if not book_annotations:
            continue

        max_offset = max(a['char_offset'] for a in book_annotations)

        # Scale factor to map annotation offsets to our text
        scale = total_len / max_offset if max_offset > 0 else 1

        # Assign chapters
        for ann in book_annotations:
            scaled_offset = ann['char_offset'] * scale

            # Find which chapter this offset falls into
            assigned_chapter = 1
            for boundary in chapter_boundaries:
                if boundary['start'] <= scaled_offset < boundary['end']:
                    assigned_chapter = boundary['id']
                    break
            else:
                # If not found, use last chapter
                if chapter_boundaries:
                    assigned_chapter = chapter_boundaries[-1]['id']

            ann['chapter'] = assigned_chapter

    return annotations

def build_books_data(annotations, chapter_info, places):
    """Build book-level JSON data."""
    books = {}

    for ann in annotations:
        book_num = ann['book']
        chapter_num = ann.get('chapter', 1)

        if book_num not in books:
            books[book_num] = {
                'id': book_num,
                'title': f"Book {book_num}: {BOOK_TITLES[book_num]}",
                'chapterCount': chapter_info[book_num]['count'],
                'maxChapterId': chapter_info[book_num]['max_id'],
                'chapters': defaultdict(lambda: {'places': []})
            }

        # Add place reference to chapter
        books[book_num]['chapters'][chapter_num]['places'].append({
            'placeId': ann['place_id'],
            'name': ann['quote'],
            'charOffset': ann['char_offset']
        })

    # Update occurrences in places with chapter info
    for ann in annotations:
        place = places.get(ann['place_id'])
        if place:
            for occ in place['occurrences']:
                if occ['book'] == ann['book'] and occ['charOffset'] == ann['char_offset']:
                    occ['chapter'] = ann.get('chapter', 1)

    return books

def write_output(books, places, chapter_info):
    """Write all output JSON files."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Write books.json index
    books_index = {
        'books': [
            {
                'id': book_num,
                'title': f"Book {book_num}: {BOOK_TITLES[book_num]}",
                'chapterCount': chapter_info[book_num]['count'],
                'maxChapterId': chapter_info[book_num]['max_id'],
                'placeCount': sum(
                    len(ch['places'])
                    for ch in books.get(book_num, {}).get('chapters', {}).values()
                )
            }
            for book_num in range(1, 10)
        ]
    }

    with open(OUTPUT_DIR / 'books.json', 'w', encoding='utf-8') as f:
        json.dump(books_index, f, indent=2)
    print(f"Wrote books.json")

    # Write individual book files
    for book_num in range(1, 10):
        if book_num in books:
            book_data = {
                'id': book_num,
                'title': f"Book {book_num}: {BOOK_TITLES[book_num]}",
                'chapters': []
            }

            # Convert chapters dict to sorted list
            for chapter_num in sorted(books[book_num]['chapters'].keys()):
                chapter_data = books[book_num]['chapters'][chapter_num]
                book_data['chapters'].append({
                    'id': chapter_num,
                    'places': sorted(chapter_data['places'], key=lambda x: x['charOffset'])
                })

            with open(OUTPUT_DIR / f'book-{book_num}.json', 'w', encoding='utf-8') as f:
                json.dump(book_data, f, indent=2)
            print(f"Wrote book-{book_num}.json ({len(book_data['chapters'])} chapters with places)")

    # Write places.json
    # Clean up occurrences (remove charOffset for cleaner output)
    places_output = {}
    for place_id, place in places.items():
        clean_occurrences = []
        for occ in place['occurrences']:
            clean_occurrences.append({
                'book': occ['book'],
                'chapter': occ.get('chapter', 1)
            })

        places_output[place_id] = {
            'id': place_id,
            'name': place['name'],
            'lat': place['lat'],
            'lng': place['lng'],
            'pleiadesUri': place['pleiadesUri'],
            'placeType': place['placeType'],
            'isEthnic': place['isEthnic'],
            'occurrences': clean_occurrences
        }

    with open(OUTPUT_DIR / 'places.json', 'w', encoding='utf-8') as f:
        json.dump({'places': places_output}, f, indent=2)
    print(f"Wrote places.json ({len(places_output)} places)")

def main():
    print("Loading chapter info from text files...")
    chapter_info = load_chapter_info()
    for book_num, info in chapter_info.items():
        print(f"  Book {book_num}: {info['count']} chapters (max id: {info['max_id']})")

    print("\nParsing Recogito CSV...")
    annotations = parse_csv()
    print(f"Found {len(annotations)} place annotations")

    print("\nBuilding places gazetteer...")
    places = build_places_gazetteer(annotations)
    print(f"Found {len(places)} unique places")

    print("\nAssigning chapters to annotations...")
    annotations = assign_chapters_to_annotations(annotations, chapter_info)

    print("\nBuilding book data...")
    books = build_books_data(annotations, chapter_info, places)

    print("\nWriting output files...")
    write_output(books, places, chapter_info)

    print("\nDone!")

if __name__ == '__main__':
    main()
