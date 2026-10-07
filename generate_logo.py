#!/usr/bin/env python3
"""
Generates a 512x512 PNG brand logo for IELTS Mentor AI.
Compliant with Google OAuth Consent Screen requirements:
- Square (1:1 ratio)
- PNG format
- Crisp, modern vector-style educational emblem
"""

from PIL import Image, ImageDraw, ImageFont
import math

width, height = 512, 512
img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# 1. Background Rounded Squircle with Radial / Linear Gradient
for y in range(height):
    # Gradient from Deep Indigo (#1e1b4b) to Rich Slate/Navy (#0f172a)
    t = y / height
    r = int(24 * (1 - t) + 15 * t)
    g = int(27 * (1 - t) + 23 * t)
    b = int(75 * (1 - t) + 42 * t)
    draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

# Create rounded mask for super-smooth corners (radius 100)
mask = Image.new('L', (width, height), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], radius=110, fill=255)

# Outer Border Glow
border_overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
border_draw = ImageDraw.Draw(border_overlay)
border_draw.rounded_rectangle([(4, 4), (width - 5, height - 5)], radius=108, outline=(99, 102, 241, 140), width=4)
border_draw.rounded_rectangle([(10, 10), (width - 11, height - 11)], radius=102, outline=(245, 158, 11, 80), width=2)

# Combine with mask
img.putalpha(mask)
img = Image.alpha_composite(img, border_overlay)
draw = ImageDraw.Draw(img)

# 2. Draw Center Emblem: Graduation Cap + Quill + Golden Band 9.0 Star
cx, cy = 256, 210

# Ambient Glow behind emblem
for rad in range(130, 20, -10):
    alpha = int(45 * (1 - rad / 130))
    draw.ellipse([(cx - rad, cy - rad), (cx + rad, cy + rad)], fill=(79, 70, 229, alpha))

# Graduation Cap Top (Rhombus / Diamond)
cap_points = [
    (cx, cy - 75),        # Top
    (cx + 125, cy - 25),  # Right
    (cx, cy + 25),        # Bottom
    (cx - 125, cy - 25),  # Left
]
draw.polygon(cap_points, fill=(99, 102, 241, 255))
draw.line(cap_points + [cap_points[0]], fill=(165, 180, 252, 255), width=4)

# Graduation Cap Skull Base
skull_base = [
    (cx - 75, cy - 5),
    (cx + 75, cy - 5),
    (cx + 65, cy + 50),
    (cx, cy + 72),
    (cx - 65, cy + 50)
]
draw.polygon(skull_base, fill=(67, 56, 202, 255))
draw.line(skull_base + [skull_base[0]], fill=(129, 140, 248, 255), width=3)

# Tassel & Golden Ribbon
draw.line([(cx + 10, cy - 25), (cx + 115, cy + 15)], fill=(245, 158, 11, 255), width=5)
draw.ellipse([(cx + 110, cy + 15), (cx + 126, cy + 31)], fill=(251, 191, 36, 255))
draw.line([(cx + 118, cy + 31), (cx + 118, cy + 65)], fill=(245, 158, 11, 255), width=4)

# Central Golden Neural Star / Spark
star_center = (cx, cy - 25)
star_r = 18
draw.ellipse([(star_center[0] - star_r, star_center[1] - star_r),
              (star_center[0] + star_r, star_center[1] + star_r)], fill=(245, 158, 11, 255))
draw.ellipse([(star_center[0] - 10, star_center[1] - 10),
              (star_center[0] + 10, star_center[1] + 10)], fill=(254, 240, 138, 255))

# 3. Typography: "IELTS MENTOR" and "AI WRITING"
# Draw stylish modern text using standard system sans-serif
try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    font_badge = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_badge = ImageFont.load_default()

# IELTS MENTOR
text_title = "IELTS MENTOR"
bbox = draw.textbbox((0, 0), text_title, font=font_title)
t_w = bbox[2] - bbox[0]
draw.text((cx - t_w / 2, 335), text_title, fill=(255, 255, 255, 255), font=font_title)

# AI WRITING PLATFORM Badge
badge_text = "AI WRITING PLATFORM"
bbox_badge = draw.textbbox((0, 0), badge_text, font=font_badge)
b_w = bbox_badge[2] - bbox_badge[0]
badge_x = cx - b_w / 2
badge_y = 390

# Badge pill
draw.rounded_rectangle(
    [(badge_x - 18, badge_y - 6), (badge_x + b_w + 18, badge_y + 24)],
    radius=14,
    fill=(30, 41, 59, 230),
    outline=(245, 158, 11, 220),
    width=2
)
draw.text((badge_x, badge_y), badge_text, fill=(251, 191, 36, 255), font=font_badge)

# Bottom Band 9.0 Guarantee Subtitle
sub_text = "ADAPTIVE SOCRATIC LEARNING"
bbox_sub = draw.textbbox((0, 0), sub_text, font=font_sub)
s_w = bbox_sub[2] - bbox_sub[0]
# Draw subtle tracker dots
draw.text((cx - s_w / 2, 438), sub_text, fill=(148, 163, 184, 220), font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13) if hasattr(ImageFont, 'truetype') else font_sub)

# Save images
import os
os.makedirs('public', exist_ok=True)
img.save('public/brand-logo.png', 'PNG')
img.save('public/logo.png', 'PNG')
print("Successfully generated public/brand-logo.png and public/logo.png (512x512)")
