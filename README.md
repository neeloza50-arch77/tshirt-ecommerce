# Product Image Asset Directory

Place your high-resolution studio photography and mockups here.

## Directory Structure:
```
assets/
  products/
    [product-slug]/
      front.jpg    # Clean studio front view (4:5 aspect ratio, e.g. 900x1200 or 1200x1500)
      back.jpg     # Back graphic artwork view
      model.jpg    # Editorial on-model streetwear view (used for hover & model gallery)
      detail.jpg   # Macro fabric knit (240-280 GSM) and screen print ink detail
      folded.jpg   # Folded retail presentation / collar label
```

## How It Works:
- Each product automatically resolves images from `assets/products/[slug]/` when local files are provided.
- If a local image is not found, it seamlessly falls back to the verified high-resolution streetwear fashion photography CDN pipeline defined in `js/data.js`.
- Both `p.images.front` (object syntax) and `p.images[0]` (array syntax), as well as `p.primaryImage`, `p.secondaryImage`, `p.galleryImages`, `p.gallery(ci)`, and `p.thumb(ci)` work out of the box with zero configuration.
