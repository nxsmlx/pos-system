from PIL import Image, ImageDraw, ImageFont
import os

sizes = [192, 512]
out_dir = r"C:\Users\Admin\pos-system\icons"
os.makedirs(out_dir, exist_ok=True)

def make_icon(size, fname, rounded=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Rounded rect background with orange gradient feel (solid orange)
    margin = int(size * 0.05)
    radius = int(size * 0.22) if rounded else 0
    bg_color = (255, 107, 53, 255)  # #FF6B35
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius, fill=bg_color
    )
    # Slight darker inner accent (simulated gradient)
    accent = (255, 138, 92, 255)  # #FF8A5C
    draw.rounded_rectangle(
        [margin, margin, size - margin, int(size * 0.55)],
        radius=radius, fill=accent
    )
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius, fill=bg_color
    )
    # Text "AFQ"
    text = "AFQ"
    font = None
    font_size = int(size * 0.42)
    for fp in [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"]:
        try:
            font = ImageFont.truetype(fp, font_size)
            break
        except Exception:
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1] - int(size * 0.02)
    # White text with subtle shadow
    draw.text((x + 2, y + 3), text, font=font, fill=(229, 75, 27, 255))
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    img.save(os.path.join(out_dir, fname))
    print(f"saved {fname} ({size}x{size})")

make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
# Maskable version (full bleed, more padding inside)
make_icon(192, "icon-192-maskable.png")
make_icon(512, "icon-512-maskable.png")
print("done")
