"""
Script to generate thumbnails for existing raffle images
"""
import json
import os
from PIL import Image

RAFFLES_FILE = 'raffle_data.json'
UPLOAD_FOLDER = 'uploads'
THUMBNAIL_FOLDER = 'uploads/thumbnails'

def create_thumbnail(image_path, thumbnail_path, max_size=(300, 300)):
    """Create a thumbnail from the original image"""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Create thumbnail
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
            print(f"✓ Created thumbnail: {thumbnail_path}")
            return True
    except Exception as e:
        print(f"✗ Error creating thumbnail: {str(e)}")
        return False

def generate_missing_thumbnails():
    """Generate thumbnails for all raffles that have images but no thumbnails"""
    
    # Create thumbnails folder if it doesn't exist
    if not os.path.exists(THUMBNAIL_FOLDER):
        os.makedirs(THUMBNAIL_FOLDER)
        print(f"Created thumbnails folder: {THUMBNAIL_FOLDER}")
    
    # Load raffle data
    if not os.path.exists(RAFFLES_FILE):
        print(f"Error: {RAFFLES_FILE} not found")
        return
    
    with open(RAFFLES_FILE, 'r') as f:
        data = json.load(f)
    
    raffles = data.get('raffles', [])
    if not raffles:
        print("No raffles found")
        return
    
    updated = False
    processed = 0
    created = 0
    skipped = 0
    
    print(f"\nProcessing {len(raffles)} raffles...\n")
    
    for raffle in raffles:
        raffle_id = raffle.get('id')
        image_filename = raffle.get('image')
        
        # Skip if no image
        if not image_filename:
            print(f"Raffle #{raffle_id} ({raffle.get('name')}): No image")
            skipped += 1
            continue
        
        # Skip if already has thumbnail
        if raffle.get('thumbnail'):
            print(f"Raffle #{raffle_id} ({raffle.get('name')}): Already has thumbnail")
            skipped += 1
            continue
        
        processed += 1
        
        # Generate thumbnail filename
        ext = image_filename.rsplit('.', 1)[1] if '.' in image_filename else 'jpg'
        thumbnail_filename = f"raffle_{raffle_id}_thumb.jpg"
        
        # Check if image file exists
        image_path = os.path.join(UPLOAD_FOLDER, image_filename)
        if not os.path.exists(image_path):
            print(f"Raffle #{raffle_id} ({raffle.get('name')}): Image file not found: {image_path}")
            continue
        
        # Create thumbnail
        thumbnail_path = os.path.join(THUMBNAIL_FOLDER, thumbnail_filename)
        print(f"Raffle #{raffle_id} ({raffle.get('name')}): Generating thumbnail...")
        
        if create_thumbnail(image_path, thumbnail_path):
            raffle['thumbnail'] = thumbnail_filename
            updated = True
            created += 1
        else:
            print(f"Failed to create thumbnail for raffle #{raffle_id}")
    
    # Save updated data if any thumbnails were created
    if updated:
        with open(RAFFLES_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"\n✓ Updated {RAFFLES_FILE} with thumbnail references")
    
    # Summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Total raffles: {len(raffles)}")
    print(f"Processed: {processed}")
    print(f"Thumbnails created: {created}")
    print(f"Skipped: {skipped}")
    print("="*50)

if __name__ == '__main__':
    print("="*50)
    print("Raffle Thumbnail Generator")
    print("="*50)
    generate_missing_thumbnails()
    print("\nDone!")
