import { MERGE_VERTICAL_TOLERANCE, MERGE_GAP_TOLERANCE, SNAP_RANGE, SCORE_PER_MERGE, SCORE_DISPLACE } from './lib/config';
import { BLOCK_TYPES } from './lib/config';
import Block from './lib/block';

export default class Merger {
  _typesMatch(a, b) {
    if (a.type === b.type) return true;
    if (Block.isUniversal(a.type) || Block.isUniversal(b.type)) return true;
    return false;
  }

  snapBlocks(settledBlocks) {
    for (let i = 0; i < settledBlocks.length; i++) {
      const a = settledBlocks[i];
      if (a.wasMerged || !Block.canMerge(a.type)) continue;

      let nearest = null;
      let nearestGap = Infinity;

      for (let j = 0; j < settledBlocks.length; j++) {
        if (i === j) continue;
        const b = settledBlocks[j];
        if (b.wasMerged || !Block.canMerge(b.type)) continue;
        if (!this._typesMatch(a, b)) continue;
        if (Math.abs(a.y - b.y) > MERGE_VERTICAL_TOLERANCE) continue;

        const gap = a.left < b.left ? b.left - a.right : a.left - b.right;
        if (gap > MERGE_GAP_TOLERANCE && gap <= SNAP_RANGE && gap < nearestGap) {
          nearest = b;
          nearestGap = gap;
        }
      }

      if (nearest) {
        if (a.x < nearest.x) {
          a.x = nearest.left - a.width / 2 - 1;
        } else {
          a.x = nearest.right + a.width / 2 + 1;
        }
      }
    }
  }

  // Check if two blocks are adjacent (horizontally or vertically)
  isAdjacent(a, b) {
    // Horizontal: same level, close horizontal gap
    if (Math.abs(a.y - b.y) <= MERGE_VERTICAL_TOLERANCE) {
      const hGap = a.left < b.left ? b.left - a.right : a.left - b.right;
      if (hGap <= MERGE_GAP_TOLERANCE) return true;
    }
    // Vertical: overlapping x-range, close vertical gap
    if (a.left < b.right && a.right > b.left) {
      const vGap = Math.min(
        Math.abs(a.bottom - b.top),
        Math.abs(b.bottom - a.top)
      );
      if (vGap <= MERGE_VERTICAL_TOLERANCE) return true;
    }
    return false;
  }

  findGroups(settledBlocks) {
    const visited = new Set();
    const groups = [];

    for (let i = 0; i < settledBlocks.length; i++) {
      if (visited.has(i)) continue;
      const seed = settledBlocks[i];
      if (seed.wasMerged || !Block.canMerge(seed.type)) continue;

      const group = [seed];
      const groupIndices = [i];
      visited.add(i);

      // BFS to find all connected same-type blocks (horizontal + vertical)
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < settledBlocks.length; j++) {
          if (visited.has(j)) continue;
          const other = settledBlocks[j];
          if (other.wasMerged || !Block.canMerge(other.type)) continue;
          if (!this._typesMatch(seed, other)) continue;

          // Check adjacency to any block already in the group
          for (const g of group) {
            if (this.isAdjacent(g, other)) {
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

  update(settledBlocks, particles) {
    const scores = [];
    const displaced = [];
    const positions = [];

    if (settledBlocks.length < 2) return { scores, displaced, positions };

    this.snapBlocks(settledBlocks);

    if (settledBlocks.length < 3) return { scores, displaced, positions };

    const groups = this.findGroups(settledBlocks);

    if (groups.length === 0) return { scores, displaced, positions };

    // Sort groups by indices descending so splice doesn't corrupt earlier indices
    const allIndicesToRemove = [];

    for (const group of groups) {
      const { blocks } = group;
      if (blocks.length < 3) continue;

      const firstBlock = blocks[0];
      const mergeY = firstBlock.y;

      // Determine merge type: majority of non-universal blocks
      const typeCounts = {};
      for (const b of blocks) {
        if (!Block.isUniversal(b.type)) {
          typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
        }
      }
      let mergeType = firstBlock.type;
      let maxCount = 0;
      for (const [t, c] of Object.entries(typeCounts)) {
        if (c > maxCount) { maxCount = c; mergeType = parseInt(t); }
      }
      // Fallback: if all blocks are universal, pick a normal type
      if (Block.isUniversal(mergeType)) {
        mergeType = Math.floor(Math.random() * 6);
      }

      const minLeft = Math.min(...blocks.map(b => b.left));
      const maxRight = Math.max(...blocks.map(b => b.right));
      const totalWidth = blocks.reduce((sum, b) => sum + b.width, 0);
      const newX = (minLeft + maxRight) / 2;
      const newLeft = newX - totalWidth / 2;
      const newRight = newX + totalWidth / 2;

      // Mark indices for removal
      for (const b of blocks) {
        const idx = settledBlocks.indexOf(b);
        if (idx >= 0 && !allIndicesToRemove.includes(idx)) {
          allIndicesToRemove.push(idx);
        }
      }

      // Create merged plate
      const mergedBlock = new Block(mergeType, newX, mergeY, totalWidth);
      mergedBlock.settled = true;
      mergedBlock.wasMerged = true;
      settledBlocks.push(mergedBlock);

      // Displace other-type blocks at same level that overlap with merged plate
      for (let i = settledBlocks.length - 2; i >= 0; i--) {
        const b = settledBlocks[i];
        if (b.type === mergeType || Block.isUniversal(b.type)) continue;
        if (Block.isSpecial(b.type)) continue;
        if (Math.abs(b.y - mergeY) > MERGE_VERTICAL_TOLERANCE) continue;

        // Check overlap with merged plate
        if (b.right <= newLeft || b.left >= newRight) continue;

        // Push block to nearest side of the merged plate
        const distToLeft = Math.abs(b.x - newLeft);
        const distToRight = Math.abs(b.x - newRight);
        if (distToLeft <= distToRight) {
          b.x = newLeft - b.width / 2 - 2;
          b.vx = -200;
        } else {
          b.x = newRight + b.width / 2 + 2;
          b.vx = 200;
        }
        b.settled = false;
        b.vy = -80;
        b.immuneToDrop = true;
        displaced.push(b);
      }

      scores.push(SCORE_PER_MERGE * blocks.length);
      if (displaced.length > 0) {
        scores.push(SCORE_DISPLACE * displaced.length);
      }

      positions.push({ x: newX, y: mergeY });

      if (particles) {
        particles.emit(newX, mergeY, BLOCK_TYPES[mergeType].lighter, 14);
      }
    }

    // Remove merged blocks (sorted descending to preserve indices)
    allIndicesToRemove.sort((a, b) => b - a);
    for (const idx of allIndicesToRemove) {
      settledBlocks.splice(idx, 1);
    }

    return { scores, displaced, positions };
  }
}
