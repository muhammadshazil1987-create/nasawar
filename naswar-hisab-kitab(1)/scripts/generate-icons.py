import zlib
import struct
import math
import os

def make_png(width, height, draw_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr_data))
    # IDAT
    png.extend(chunk(b'IDAT', compressed))
    # IEND
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

def icon_drawer(is_maskable=False):
    def drawer(x, y, w, h):
        nx = (x / w) * 2 - 1
        ny = (y / h) * 2 - 1
        r_sq = nx * nx + ny * ny
        dist = math.sqrt(r_sq)

        # Base background: deep emerald / pine green (#064e3b -> #047857)
        bg_r = int(6 + 10 * (1 - ny) / 2)
        bg_g = int(78 + 30 * (1 - ny) / 2)
        bg_b = int(59 + 20 * (1 - ny) / 2)

        if not is_maskable:
            # Rounded squircle border
            # Superellipse |nx|^4 + |ny|^4 <= 0.85
            radius_norm = (abs(nx)**3.5 + abs(ny)**3.5)**(1/3.5)
            if radius_norm > 0.96:
                return (0, 0, 0, 0) # transparent outer
            if radius_norm > 0.93:
                # Golden edge
                return (245, 158, 11, 255)

        # Ledger book / Box design in center (keep in safe zone 60% of size)
        bx = nx / 0.7
        by = ny / 0.7

        # Book cover: rect from -0.6 to 0.6 in bx, -0.7 to 0.7 in by
        if -0.65 <= bx <= 0.65 and -0.75 <= by <= 0.75:
            # Gold spine on left
            if -0.65 <= bx <= -0.45:
                return (217, 119, 6, 255) # Amber gold spine
            # Inner notebook body: Dark warm teal/forest
            if -0.42 <= bx <= 0.6 and -0.7 <= by <= 0.7:
                # White/cream ledger lines or symbol
                # Emblem: 'Rs' text or ledger lines
                # Draw lines
                line_y = (by + 0.5) * 5
                line_idx = int(line_y)
                if 1 <= line_idx <= 4 and abs(line_y - line_idx - 0.5) < 0.12 and -0.3 <= bx <= 0.45:
                    return (254, 243, 199, 255) # Light cream ledger rule
                # Leaf / checkmark emblem in top center
                if -0.2 <= bx <= 0.35 and -0.55 <= by <= -0.15:
                    # Diamond / seal
                    if abs(bx - 0.08) + abs(by + 0.35) < 0.22:
                        return (245, 158, 11, 255) # Golden stamp
                return (16, 185, 129, 255) # Emerald surface
            return (254, 243, 199, 255) # Page edge

        return (bg_r, bg_g, bg_b, 255)
    return drawer

os.makedirs('public', exist_ok=True)

with open('public/pwa-192x192.png', 'wb') as f:
    f.write(make_png(192, 192, icon_drawer(is_maskable=False)))

with open('public/pwa-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, icon_drawer(is_maskable=False)))

with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, icon_drawer(is_maskable=True)))

with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(make_png(180, 180, icon_drawer(is_maskable=False)))

with open('public/favicon.ico', 'wb') as f:
    f.write(make_png(64, 64, icon_drawer(is_maskable=False)))

print("PWA icons generated successfully!")
