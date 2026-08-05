TROVI SIGNATURE LIQUID ORB
==========================

The new orb is already installed in:
  solutions/restaurants.html

Quick preview:
  1. Open this folder in VS Code.
  2. Start Live Server.
  3. Open orb-preview.html to view the orb at a large size.
  4. Open solutions/restaurants.html to view it inside the real demo card.

Important files:
  assets/planets/trovi-signature-liquid-orb.png  - approved painted artwork
  js/liquid-orbs.js                              - WebGL liquid animation
  css/restaurants.css                            - final card integration

The original image stays visible as a fallback if WebGL is unavailable.
The visible play button is part of the artwork; the real HTML button remains
positioned above it as an accessible click target.

Reliability fallback:
  assets/planets/trovi-signature-liquid-orb-animated.webp

This six-second animated WebP is used until WebGL has rendered its first frame,
and remains animated if WebGL is unavailable. The richer WebGL animation then
replaces it automatically on supported browsers.
