/**
 * WeightedQuickUnion
 * Disjoint Set Union (DSU) implementation with Path Compression.
 * Optimized for real-time tenant grouping with O(alpha(N)) complexity.
 */
export class WeightedQuickUnion {
  private parent: Int32Array;
  private size: Int32Array;

  constructor(n: number) {
    this.parent = new Int32Array(n).map((_, i) => i);
    this.size = new Int32Array(n).fill(1);
  }

  root(i: number): number {
    while (i !== this.parent[i]) {
      this.parent[i] = this.parent[this.parent[i]];
      i = this.parent[i];
    }
    return i;
  }

  union(p: number, q: number): void {
    const i = this.root(p);
    const j = this.root(q);
    if (i === j) return;

    if (this.size[i] < this.size[j]) {
      this.parent[i] = j;
      this.size[j] += this.size[i];
    } else {
      this.parent[j] = i;
      this.size[i] += this.size[j];
    }
  }
}
