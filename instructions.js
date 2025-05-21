📜✨ Welcome to the Option Particle Ocean! ✨🌊

Dive into the mesmerizing world of CBOE option data, visualized as a dynamic, glowing ocean of particles. Each shimmering sphere represents an option contract, its height and color revealing market secrets.

The starting ocean by default is built from past and placeholder SPY option data. Upload your own CSV, downloadable from the CBOE.

--- NAVIGATION ---

🚀 Explore this data dimension with your trusty controls:

  - 🖱️ Mouse Orbit: Click & Drag to rotate your view around the center.
  - 휠 Mouse Wheel: Zoom In / Zoom Out.

  - ⌨️ Keyboard Flight:
    - W / S:         Move Forward / Backward
    - A / D:         Strafe Left / Right
    - Arrow Up / Dn: Move Camera Up / Down
    - Arrow L / R:   Rotate Camera Left / Right
    - Q / E:         Also Rotate Camera Left / Right
    - Shift:         Hold for a SPEED BOOST! 🚀💨

--- INTERACTION ---

🔧 Customize your view with the GUI on the top right:

  - Y Axis Metric: Choose what data (Ask, IV, Volume, etc.) determines the particle height and color.
                   Metrics ending in '.1' are for Puts.
  - Show Calls/Puts: Toggle visibility for Call or Put options.
  - Glow:          Adjust the neon glow intensity of particles. ✨
  - Wave Speed:    Control the speed of the gentle undulation effect. 🌊
  - Particle Alpha:Set the transparency of the particles.
  - Color 1 & 2:   Pick the start and end colors for the metric gradient. 🎨

📊 Data Points:

  - 🖱️ Hover:      Move your mouse over a particle to see its:
                  - Expiration Date
                  - Strike Price
                  - Current Y-Axis Metric Value

📁 Custom Data:

  - CSV Upload:   Click the "Choose File" button (top left) to load your own 
                  `{ticker}_quotedata.csv` formatted data!
                  The ocean will magically reshape to your data.
                  (Ensure your CSV has headers on the 3rd row, data from 4th, and
                  is a CBOE option quote table from CBOE.com").

--- TIPS ---

  - 💡 Performance: If things get choppy, try reducing particles (by filtering calls/puts if not needed) or slightly reducing glow.
  - 🌌 Immersion: Go full screen (F11) for the best experience!
  - 🤔 Experiment: Play with different metrics and color combinations to uncover interesting patterns!

Happy exploring, data voyager! 🚀🌟 
-By Leslie Cuadra
-Built with Cursor IDE.