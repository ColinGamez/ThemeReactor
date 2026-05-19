const PACKS = {
  "Orange Core": ["All Orange", "All Orange No Italics", "All Orange Soft", "All Orange High Contrast"],
  Seasonal: ["Spring Bloom", "Summer Sunset", "Autumn Ember", "Winter Aurora"],
  Holiday: ["Halloween Midnight", "Candy Cane Code", "Valentine Glow", "New Year Neon", "Birthday Confetti"],
  Gaming: ["Voxel Craft", "Cyber Runner", "Retro Console", "Starfighter HUD", "Quest Tavern"],
  "Color Moods": [
    "Neon Arcade",
    "Matcha Grove",
    "Peach Soda",
    "Blue Raspberry",
    "Cherry Cola",
    "Lavender Static",
    "Ocean Byte",
    "Graphite Pop",
    "Honey Terminal",
    "Pumpkin Hacker",
    "Cyber Grape",
    "Cotton Candy Terminal",
    "XP Dark",
    "Solar Flare"
  ]
};

const ALL_THEMES = [...new Set(Object.values(PACKS).flat())];

module.exports = { PACKS, ALL_THEMES };
