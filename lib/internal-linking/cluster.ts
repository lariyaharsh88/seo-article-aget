/** Union-find for clustering articles by similarity edges. */
export class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(i: number): number {
    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(a: number, b: number): void {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
  }
}

/** Cluster id per index: smallest root id in each component (stable label). */
export function clusterLabels(uf: UnionFind, n: number): number[] {
  const roots = new Map<number, number>();
  let next = 0;
  const labels = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const r = uf.find(i);
    if (!roots.has(r)) {
      roots.set(r, next++);
    }
    labels[i] = roots.get(r)!;
  }
  return labels;
}
