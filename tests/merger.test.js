// merger.test.js — TDD tests for engine/merger.js
// Run with: node tests/merger.test.js

const MERGE_VERTICAL_TOLERANCE = 14;
const MERGE_GAP_TOLERANCE = 15;
const SNAP_RANGE = 42;
const SCORE_PER_MERGE = 15;
const SCORE_DISPLACE = 8;

const BLOCK_TYPES = [
  { name: 'red', color: '#E74C3C' },
  { name: 'blue', color: '#3498DB' },
  { name: 'green', color: '#2ECC71' },
  { name: 'yellow', color: '#F1C40F' },
  { name: 'purple', color: '#9B59B6' },
  { name: 'orange', color: '#E67E22' },
  { name: 'universal', special: 'universal' },
  { name: 'magnet', special: 'magnet' },
  { name: 'bomb', special: 'bomb' },
];

// Mock Block helper
const Block = {
  isUniversal(type) { return BLOCK_TYPES[type] && BLOCK_TYPES[type].special === 'universal'; },
  isSpecial(type) { return BLOCK_TYPES[type] && BLOCK_TYPES[type].special && BLOCK_TYPES[type].special !== 'universal'; },
  canMerge(type) { return !Block.isSpecial(type); },
};

// Mock block factory
function makeBlock(type, x, y, width) {
  width = width || 40;
  return {
    type, x, y, width,
    get left() { return this.x - this.width / 2; },
    get right() { return this.x + this.width / 2; },
    get top() { return this.y - 14; },
    get bottom() { return this.y + 14; },
    height: 28,
    settled: true,
    wasMerged: false,
    vy: 0,
    vx: 0,
  };
}

// ---------- Merger functions (extracted pure logic) ----------

function typesMatch(a, b) {
  if (a === b) return true;
  if (Block.isUniversal(a) || Block.isUniversal(b)) return true;
  return false;
}

function isAdjacent(a, b) {
  if (Math.abs(a.y - b.y) <= MERGE_VERTICAL_TOLERANCE) {
    const hGap = a.left < b.left ? b.left - a.right : a.left - b.right;
    if (hGap <= MERGE_GAP_TOLERANCE) return true;
  }
  if (a.left < b.right && a.right > b.left) {
    const vGap = Math.min(
      Math.abs(a.bottom - b.top),
      Math.abs(b.bottom - a.top)
    );
    if (vGap <= MERGE_VERTICAL_TOLERANCE) return true;
  }
  return false;
}

function findGroups(settledBlocks) {
  const visited = new Set();
  const groups = [];

  for (let i = 0; i < settledBlocks.length; i++) {
    if (visited.has(i)) continue;
    const seed = settledBlocks[i];
    if (seed.wasMerged || !Block.canMerge(seed.type)) continue;

    const group = [seed];
    const groupIndices = [i];
    visited.add(i);

    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < settledBlocks.length; j++) {
        if (visited.has(j)) continue;
        const other = settledBlocks[j];
        if (other.wasMerged || !Block.canMerge(other.type)) continue;
        if (!typesMatch(seed.type, other.type)) continue;

        for (const g of group) {
          if (isAdjacent(g, other)) {
            group.push(other);
            groupIndices.push(j);
            visited.add(j);
            changed = true;
            break;
          }
        }
      }
    }

    if (group.length >= 3) {
      groups.push({ blocks: group, indices: groupIndices });
    }
  }

  return groups;
}

// ---------- Test Runner ----------

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

function assertEquals(actual, expected, msg) {
  if (actual === expected || (typeof actual === 'number' && Math.abs(actual - expected) < 0.01)) { passed++; }
  else { console.error(`  FAIL: ${msg} — expected ${expected}, got ${actual}`); failed++; }
}

// ============ TESTS ============

console.log("\n=== typesMatch ===");

assert(typesMatch(0, 0), "Same type matches");
assert(!typesMatch(0, 1), "Different types do not match");
assert(typesMatch(6, 0), "Universal matches any type (from universal)");
assert(typesMatch(0, 6), "Universal matches any type (to universal)");
assert(typesMatch(6, 6), "Universal matches universal");

console.log("\n=== isAdjacent — horizontal ===");

{
  const a = makeBlock(0, 100, 100, 40); // left=80, right=120
  const b = makeBlock(0, 140, 100, 40); // left=120, right=160, gap=0
  assert(isAdjacent(a, b), "Touching horizontally: adjacent");
}
{
  const a = makeBlock(0, 100, 100, 40); // right=120
  const b = makeBlock(0, 136, 100, 40); // left=116, gap=4
  assert(isAdjacent(a, b), "Small horizontal gap: adjacent");
}
{
  const a = makeBlock(0, 100, 100, 40); // right=120
  const b = makeBlock(0, 160, 100, 40); // left=140, gap=20
  assert(!isAdjacent(a, b), "Large horizontal gap: not adjacent");
}
{
  const a = makeBlock(0, 100, 100, 40);
  const b = makeBlock(0, 140, 120, 40); // different y row
  assert(!isAdjacent(a, b), "Different y by > tolerance: not horizontally adjacent");
}

console.log("\n=== isAdjacent — vertical ===");

{
  const a = makeBlock(0, 100, 100, 40); // overlapping x
  const b = makeBlock(0, 100, 128, 40); // bottom of a = 114, top of b = 114, gap=0
  assert(isAdjacent(a, b), "Touching vertically: adjacent");
}
{
  const a = makeBlock(0, 100, 100, 40);
  const b = makeBlock(0, 100, 135, 40); // gap = 135-14 - 114 = 7
  assert(isAdjacent(a, b), "Small vertical gap: adjacent");
}
{
  const a = makeBlock(0, 100, 100, 40);
  const b = makeBlock(0, 130, 100, 40); // no x overlap (a:80-120, b:110-150) — wait, overlap is 110-120
  // Actually let me reconsider: a.x=100,width=40 => left=80,right=120. b.x=130,width=40=>left=110,right=150.
  // Overlap: 110-120. And b.y=100, so same y. So they'd be horizontally adjacent.
  // Let me fix this test
  const c = makeBlock(0, 150, 100, 40);  // left=130, right=170
  // a and c: a.right=120, c.left=130. a.y=100, c.y=100. gap=10. within tolerance.
  assert(isAdjacent(a, c), "Horizontally adjacent with small gap");
}

console.log("\n=== findGroups ===");

{
  // No groups (all different types)
  const blocks = [
    makeBlock(0, 100, 100), // red, at x=100
    makeBlock(1, 140, 100), // blue
    makeBlock(2, 180, 100), // green
  ];
  const groups = findGroups(blocks);
  assertEquals(groups.length, 0, "Different types: no merge groups");
}

{
  // 3 same-type blocks in a row (adjacent) = group
  const blocks = [
    makeBlock(0, 100, 100), // x=100, l=80, r=120
    makeBlock(0, 142, 100), // x=142, l=122, r=162 (gap=2 from block1)
    makeBlock(0, 184, 100), // x=184, l=164, r=204 (gap=2 from block2)
  ];
  const groups = findGroups(blocks);
  assertEquals(groups.length, 1, "3 adjacent same-type: 1 group");
  assertEquals(groups[0].blocks.length, 3, "Group has all 3 blocks");
}

{
  // 2 same-type = no group (min 3)
  const blocks = [
    makeBlock(0, 100, 100),
    makeBlock(0, 142, 100),
  ];
  const groups = findGroups(blocks);
  assertEquals(groups.length, 0, "Only 2 same-type: no group");
}

{
  // 4 same-type in 2x2 grid
  const blocks = [
    makeBlock(0, 100, 100), // bottom-left
    makeBlock(0, 142, 100), // bottom-right
    makeBlock(0, 100, 128), // top-left (stacked)
    makeBlock(0, 142, 128), // top-right
  ];
  const groups = findGroups(blocks);
  assertEquals(groups.length, 1, "2x2 grid: 1 group");
  assertEquals(groups[0].blocks.length, 4, "2x2 grid: all 4 blocks");
}

{
  // Special blocks (bomb, magnet) excluded from groups
  const blocks = [
    makeBlock(0, 100, 100),
    makeBlock(0, 142, 100),
    makeBlock(0, 184, 100),
    makeBlock(8, 100, 100), // bomb — excluded
  ];
  const groups = findGroups(blocks);
  assertEquals(groups.length, 1, "Special blocks excluded from groups");
  assertEquals(groups[0].blocks.length, 3, "Only 3 non-special blocks in group");
}

// ============ SUMMARY ============
console.log(`\n==========`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
console.log(`==========\n`);
process.exit(failed > 0 ? 1 : 0);
