# Nooklet

Nooklet is a cozy shared-world game built with Expo Router, React Native Web, Supabase, and React Three Fiber. Players create or join private worlds, walk around an isometric tile map, expand the world by tapping, place items from an inventory, and use shared social features like secret chat.

## What Players Can Do

- Register or log in as a character.
- Create a new world and share its code.
- Join an existing world by code.
- Enter a world from the lobby.
- Walk on the isometric tile grid.
- Tap empty ground to expand the map.
- Double-tap a tile to open tile actions.
- Place floor, furniture, and food items from the inventory.
- Resize catalog items, such as making blueberries smaller than pies.
- Enter secret chat from inside a world.

## Tech Stack

- Expo SDK / Expo Router for app structure and routing.
- React Native and React Native Web for shared mobile/web UI.
- React Three Fiber and Three.js for the isometric world canvas.
- Supabase for auth, worlds, memberships, chat, and world tile data.
- `expo-video` for Nooklet intro/loading videos.

## Project Structure

```text
src/app/
  login.jsx                 Login and registration screen.
  create_world.jsx          Creates a world, seeds starter tiles, enters world.
  join_world.jsx            Join existing world by invite code.
  (tabs)/lobby.jsx          Landing/lobby world list and entry videos.
  (tabs)/chatlist.jsx       Chat list.
  world/[id].jsx            Main isometric world screen.

src/components/
  Player.jsx                Character sprite rendering and animation.
  Camera.jsx                Smooth camera follow behavior.
  MovementControls.jsx      Directional movement controls.
  world/FloorTile.jsx       Tile, furniture, and food rendering.
  world/InventoryBar.jsx    Build mode inventory tabs and item cards.
  world/TileMap.jsx         Renders all loaded world tiles.

src/constants/
  catalog.js                Sprite sheets, item catalog, categories, sizes.

src/hooks/
  useWorldTiles.js          Loads, seeds, expands, places, rotates, deletes tiles.

src/stores/
  buildStore.js             Build mode, selected inventory item, selected tile.
  playerStore.js            Player grid position and movement path.
  worldStore.js             Current world tile cache.

src/utils/
  iso.js                    Grid-to-isometric coordinate conversion.
  introVideo.js             Video asset exports.
  worldTileSeed.ts          Starter 20 x 20 randomized world generation.
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run Expo development server:

```bash
npm run web
```

Build static web output:

```bash
npm run build
```

Serve the static export locally:

```bash
npx serve -s dist -l 8081
```

Use `-s` so direct routes such as `/world/:id` fall back to `index.html`.

## Environment Variables

Create a `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

The app expects Supabase auth and these main tables:

- `worlds`
- `world_members`
- `world_tiles`
- chat/message tables used by the chat screens

## World Creation And Starter Tiles

New worlds are created in:

```text
src/app/create_world.jsx
```

Starter world tiles are generated in:

```text
src/utils/worldTileSeed.ts
```

The starter map is currently a randomized `20 x 20` grid centered around `(0, 0)`.

To change the starter size:

```ts
const INITIAL_WORLD_SIZE = 20;
```

For example, change it to `30` for a `30 x 30` starter map.

To change which floor types appear in new worlds, edit:

```ts
const INITIAL_TILE_TYPES = [
  "grass_v1",
  "grass_v1",
  "grass_v2",
  "grass_v3",
  "stone_v1",
  "stone_v2",
  "stone_v3",
  "wooden_v1",
  "brick_v1",
];
```

Repeated values make that tile type more common. In the example above, `grass_v1` appears more often because it is listed twice.

## Tile Expansion

Expansion logic lives in:

```text
src/hooks/useWorldTiles.js
```

The main function is:

```js
fillPathTiles(path)
```

The world screen calls this from:

```text
src/app/world/[id].jsx
```

Current behavior:

- Tap an existing reachable tile to walk there.
- Tap empty ground to create the missing path tiles.
- After expansion completes, the player walks to the tapped tile.
- Double-tap a tile to open the selected-tile action bubble.
- The selected-tile bubble shows `N / W / E / S` expansion controls.

To change world boundaries, edit the constants in both:

```text
src/app/world/[id].jsx
src/stores/playerStore.js
```

Look for:

```js
const WORLD_MIN = -25;
const WORLD_MAX = 25;
```

## Adding New Floor Tiles

Floor tile sprites are registered in:

```text
src/constants/catalog.js
```

Sprite sheets are declared at the top:

```js
export const SPRITE_SHEETS = {
  tile_1: require("../assets/sprites/iso_tile_1.png"),
  tile_2: require("../assets/sprites/iso_tile_2.png"),
};
```

Add a new floor item:

```js
tile_sand_v1: {
  id: "tile_sand_v1",
  name: "Sand V1",
  category: "floor",
  sheet: "tile_1",
  spriteIndex: 5,
  cols: 16,
  rows: 1,
  size: 64,
}
```

Important naming rule:

- Inventory floor item IDs start with `tile_`.
- Database tile types do not include that prefix.
- `tile_sand_v1` becomes `sand_v1` in `world_tiles.tile_type`.

## Adding Food, Furniture, Or Other Inventory Items

Inventory items are catalog entries in:

```text
src/constants/catalog.js
```

Example food item:

```js
blueberry: {
  id: "blueberry",
  name: "Blueberry",
  category: "food",
  sheet: "food",
  spriteIndex: 0,
  cols: 16,
  rows: 1,
  size: 28,
}
```

Example furniture item:

```js
furn_bread: {
  id: "furn_bread",
  name: "Fresh Bread",
  category: "furniture",
  sheet: "furniture_bakery",
  spriteIndex: 3,
  cols: 4,
  rows: 4,
  size: 64,
}
```

### How `size` Works

`size` controls how large the item appears visually in the world and inventory preview.

```js
blueberry: {
  size: 28,
}

apple_pie: {
  size: 64,
}
```

This makes blueberry smaller than apple pie.

The sprite sheet frame size defaults to `64`. If a sprite sheet uses a different frame size, add `frameSize`:

```js
tiny_star: {
  id: "tiny_star",
  name: "Tiny Star",
  category: "decor",
  sheet: "decor",
  spriteIndex: 2,
  cols: 8,
  rows: 2,
  frameSize: 32,
  size: 24,
}
```

Use `frameSize` for sprite-sheet cropping. Use `size` for in-game visual scale.

## Adding A New Inventory Tab

Inventory tabs are defined in:

```text
src/components/world/InventoryBar.jsx
```

Current tabs:

```js
export const INVENTORY_TABS = [
  { id: "floor", label: "Floors" },
  { id: "furniture", label: "Furniture" },
  { id: "food", label: "Food" },
];
```

To add a `Decor` tab:

```js
export const INVENTORY_TABS = [
  { id: "floor", label: "Floors" },
  { id: "furniture", label: "Furniture" },
  { id: "food", label: "Food" },
  { id: "decor", label: "Decor" },
];
```

Then add catalog items using the same category:

```js
flower_pot: {
  id: "flower_pot",
  name: "Flower Pot",
  category: "decor",
  sheet: "decor",
  spriteIndex: 0,
  cols: 8,
  rows: 2,
  size: 48,
}
```

If the new category should behave like a placeable object, update placement in:

```text
src/hooks/useWorldTiles.js
```

Currently:

- `category === "floor"` changes the tile floor type.
- Other categories are saved as placed objects through `furniture_type`.

For a future cleaner schema, rename `furniture_type` to something more generic like `item_type` in Supabase and update `FloorTile.jsx` accordingly.

## Adding A New Sprite Sheet

1. Put the image in:

```text
src/assets/sprites/
```

Example:

```text
src/assets/sprites/decor.png
```

2. Register it in:

```text
src/constants/catalog.js
```

```js
export const SPRITE_SHEETS = {
  decor: require("../assets/sprites/decor.png"),
};
```

3. Add catalog items that point to that sheet:

```js
flower_pot: {
  id: "flower_pot",
  name: "Flower Pot",
  category: "decor",
  sheet: "decor",
  spriteIndex: 0,
  cols: 8,
  rows: 2,
  frameSize: 64,
  size: 48,
}
```

## Adding A New Character Sprite

The character sprite is currently loaded in:

```text
src/components/Player.jsx
```

Current import:

```js
const playerSpriteSource = require("../assets/sprites/sample_player.png");
```

To replace the character:

1. Add the new sprite sheet:

```text
src/assets/sprites/my_character.png
```

2. Update the require:

```js
const playerSpriteSource = require("../assets/sprites/my_character.png");
```

3. Set the sheet grid:

```js
const cols = 16;
const rows = 4;
```

The current player shader expects:

- `cols`: number of animation frames per direction.
- `rows`: number of direction rows.
- `directionRow`: selected by `playerStore.js`.

Direction logic lives in:

```text
src/stores/playerStore.js
```

If your sprite sheet uses a different direction row order, update the `directionRow` values in `move()` and `getDirectionForDelta()`.

## Videos And Nooklet Visual Assets

Nooklet videos are exported from:

```text
src/utils/introVideo.js
```

Assets live in:

```text
src/assets/videos/nooklet/
src/assets/images/nooklet/
```

Current video meaning:

- `loading.mp4`: loading states.
- `waiting.mp4`: world-choice waiting state.
- `start.mp4`: joining/entering a world.

## Build And Deployment

Use:

```bash
npm run build
```

This runs:

```bash
expo export -p web && node scripts/fix-expo-web-export.js
```

The post-export script is important for the generated web bundle.

For local static preview:

```bash
npx serve -s dist -l 8081
```

For Vercel:

```bash
npm run vercel-build
```

## Common Extension Checklist

When adding a new asset or feature:

1. Add the image/video file under `src/assets`.
2. Register sprite sheets in `src/constants/catalog.js`.
3. Add catalog items with correct `id`, `category`, `sheet`, `spriteIndex`, `cols`, `rows`, `frameSize`, and `size`.
4. Add a new inventory tab if the category is new.
5. Update placement logic if the category needs custom behavior.
6. Update rendering logic in `FloorTile.jsx` if the object needs custom size, rotation, or layering.
7. Run:

```bash
npm run lint
npm run build
```

## Known Notes

- Some lint warnings are expected because React Three Fiber uses Three.js JSX props such as `position`, `rotation`, `args`, and `intensity`.
- The current database column `furniture_type` is used for most placed non-floor objects, including food. A future migration could rename this to `item_type`.
- The web preview should be served with SPA fallback using `serve -s`.
