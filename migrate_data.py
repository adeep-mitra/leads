#!/usr/bin/env python3
"""
Food Safety Permits Data Migration Script
Created: August 26, 2025
Purpose: Clean and migrate CSV data to normalized SQLite database
"""

import pandas as pd
import sqlite3
import re
import sys
from pathlib import Path

def clean_phone_number(phone):
    """Clean and standardize phone numbers"""
    if pd.isna(phone) or phone == '-' or phone == '':
        return None
    
    # Remove all non-digit characters except +
    phone = re.sub(r'[^\d+]', '', str(phone))
    
    # Handle Australian phone numbers
    if phone.startswith('0'):
        phone = '+61' + phone[1:]
    elif not phone.startswith('+'):
        # If it's just digits, assume Australian
        if len(phone) >= 8:
            phone = '+61' + phone
    
    return phone if len(phone) >= 10 else None

def clean_rating(rating):
    """Extract valid rating from mixed data"""
    if pd.isna(rating) or rating == '-' or rating == '':
        return None
    
    rating_str = str(rating).strip()
    
    # If it's a single digit 3, 4, or 5, it's a valid rating
    if rating_str in ['3', '4', '5']:
        return int(rating_str)
    
    # If it contains other data, it's not a rating
    return None

def parse_permit_types(permit_string):
    """Parse comma-separated permit types"""
    if pd.isna(permit_string) or permit_string == '-' or permit_string == '':
        return []
    
    # Clean up the string
    permit_string = str(permit_string).strip()
    
    # Remove quotes and extra characters
    permit_string = permit_string.strip('"')
    
    # Split by comma and clean each type
    types = [t.strip() for t in permit_string.split(',')]
    
    # Filter out empty strings
    types = [t for t in types if t and t != '-']
    
    return types

def extract_suburb_from_list(suburb_list):
    """Extract suburb name from 'X, Suburb Name' format"""
    if pd.isna(suburb_list) or suburb_list == '-' or suburb_list == '':
        return None
    
    suburb_str = str(suburb_list).strip()
    
    # Handle format like "S, Sydney" or "A, Alexandria Mc"
    if ', ' in suburb_str:
        parts = suburb_str.split(', ', 1)
        if len(parts) == 2:
            return parts[1].strip()
    
    return suburb_str

def migrate_data():
    """Main migration function"""
    
    # Read CSV file
    print("Reading CSV file...")
    df = pd.read_csv('/Users/om/leads/food-safety-permits.csv')
    print(f"Loaded {len(df)} records from CSV")
    
    # Connect to SQLite database
    print("Connecting to database...")
    conn = sqlite3.connect('/Users/om/leads/food_safety_permits.db')
    cursor = conn.cursor()
    
    # Execute schema
    print("Creating database schema...")
    with open('/Users/om/leads/database_schema.sql', 'r') as f:
        schema_sql = f.read()
    
    # Split and execute each statement
    statements = schema_sql.split(';')
    for statement in statements:
        statement = statement.strip()
        if statement:
            cursor.execute(statement)
    
    conn.commit()
    
    # Collect unique values for lookup tables
    print("Processing lookup data...")
    
    # Extract unique suburbs
    suburbs = set()
    for _, row in df.iterrows():
        suburb = extract_suburb_from_list(row['Business Address Suburb List'])
        if suburb:
            suburbs.add(suburb)
    
    # Insert suburbs
    print(f"Inserting {len(suburbs)} unique suburbs...")
    for suburb in sorted(suburbs):
        cursor.execute("INSERT OR IGNORE INTO suburbs (suburb_name) VALUES (?)", (suburb,))
    
    # Extract unique permit types
    permit_types = set()
    for _, row in df.iterrows():
        types = parse_permit_types(row['Permit Name'])
        for permit_type in types:
            permit_types.add(permit_type)
    
    # Insert permit types
    print(f"Inserting {len(permit_types)} unique permit types...")
    for permit_type in sorted(permit_types):
        cursor.execute("INSERT OR IGNORE INTO permit_types (permit_type_name) VALUES (?)", (permit_type,))
    
    conn.commit()
    
    # Create lookup dictionaries
    cursor.execute("SELECT id, suburb_name FROM suburbs")
    suburb_lookup = {name: id for id, name in cursor.fetchall()}
    
    cursor.execute("SELECT id, permit_type_name FROM permit_types")
    permit_type_lookup = {name: id for id, name in cursor.fetchall()}
    
    # Process main data
    print("Processing main business data...")
    processed_count = 0
    error_count = 0
    
    for idx, row in df.iterrows():
        try:
            # Clean data
            business_name = str(row['Business Name']).strip() if pd.notna(row['Business Name']) else None
            phone = clean_phone_number(row['Business Phone Number'])
            rating = clean_rating(row['Eat Safe Rating'])
            
            # Address data
            full_address = str(row['Business Address']).strip() if pd.notna(row['Business Address']) else None
            address_line_1 = str(row['Business Address(Line 1)']).strip() if pd.notna(row['Business Address(Line 1)']) else None
            address_line_2 = str(row['Business Address(Line 2)']).strip() if pd.notna(row['Business Address(Line 2)']) else None
            
            # Clean address lines
            if address_line_1 == 'nan' or address_line_1 == '-':
                address_line_1 = None
            if address_line_2 == 'nan' or address_line_2 == '-':
                address_line_2 = None
                
            suburb_name = extract_suburb_from_list(row['Business Address Suburb List'])
            suburb_id = suburb_lookup.get(suburb_name) if suburb_name else None
            
            # Skip if no business name
            if not business_name or business_name == 'nan':
                error_count += 1
                continue
            
            # Insert address
            cursor.execute("""
                INSERT INTO addresses (address_line_1, address_line_2, full_address, suburb_id)
                VALUES (?, ?, ?, ?)
            """, (address_line_1, address_line_2, full_address, suburb_id))
            
            address_id = cursor.lastrowid
            
            # Insert business
            cursor.execute("""
                INSERT INTO businesses (business_name, address_id, phone_number, eat_safe_rating)
                VALUES (?, ?, ?, ?)
            """, (business_name, address_id, phone, rating))
            
            business_id = cursor.lastrowid
            
            # Insert permits
            permit_types = parse_permit_types(row['Permit Name'])
            for permit_type in permit_types:
                permit_type_id = permit_type_lookup.get(permit_type)
                if permit_type_id:
                    cursor.execute("""
                        INSERT OR IGNORE INTO permits (business_id, permit_type_id, original_index)
                        VALUES (?, ?, ?)
                    """, (business_id, permit_type_id, row['Index']))
            
            processed_count += 1
            
            if processed_count % 100 == 0:
                print(f"Processed {processed_count} records...")
                conn.commit()
                
        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            error_count += 1
            continue
    
    conn.commit()
    
    # Print statistics
    print(f"\nMigration completed!")
    print(f"Successfully processed: {processed_count} records")
    print(f"Errors encountered: {error_count} records")
    
    # Verify data
    cursor.execute("SELECT COUNT(*) FROM businesses")
    business_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM permits")
    permit_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM suburbs")
    suburb_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM permit_types")
    permit_type_count = cursor.fetchone()[0]
    
    print(f"\nDatabase Statistics:")
    print(f"Businesses: {business_count}")
    print(f"Permits: {permit_count}")
    print(f"Suburbs: {suburb_count}")
    print(f"Permit Types: {permit_type_count}")
    
    # Show sample data
    print(f"\nSample business data:")
    cursor.execute("""
        SELECT business_name, permit_types, suburb_name, eat_safe_rating 
        FROM business_details 
        LIMIT 5
    """)
    
    for row in cursor.fetchall():
        print(f"  {row[0]} | {row[1]} | {row[2]} | Rating: {row[3]}")
    
    conn.close()
    print(f"\nDatabase saved to: /Users/om/leads/food_safety_permits.db")

if __name__ == "__main__":
    migrate_data()
