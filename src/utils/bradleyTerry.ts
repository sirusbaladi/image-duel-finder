// bradleyTerry.ts
import * as math from 'mathjs';

export interface BradleyTerryResult {
  rankings: { id: string; pi: number }[];
  topProbabilities: Record<string, number>;
  exactRankProbabilities: Record<string, number>;
}

interface Comparison {
  image_a_id: string;
  image_b_id: string;
  winner_id: string;
}

// Custom Cholesky decomposition using mathjs
function choleskyDecomposition(A: math.Matrix): math.Matrix {
  const n = A.size()[0];
  const L = math.zeros(n, n) as math.Matrix;

  for (let i = 0; i < n; i++) {
    for (let k = 0; k <= i; k++) {
      if (i === k) {
        // Diagonal element
        const rowSlice = math.subset(L, math.index(i, math.range(0, k))) as math.Matrix;
        const sum = math.sum(math.dotMultiply(rowSlice, rowSlice));
        const diag = math.sqrt(math.subtract(A.get([i, i]), sum) as number);
        L.set([i, i], diag);
      } else {
        // Off-diagonal element
        const sum = math.sum(
          math.range(0, k).map(j => L.get([i, j]) * L.get([k, j]))
        );
        const a_ik = A.get([i, k]) as number;
        const l_kk = L.get([k, k]) as number;
        const value = (a_ik - (sum as number)) / l_kk;
        L.set([i, k], value);
      }
    }
  }
  return L;
}

// Estimate Bradley-Terry parameters
function estimateBradleyTerryParams(comparisons: Comparison[]): {
  rankings: { id: string; pi: number }[];
  covariance: number[][];
} {
  const imageIds = Array.from(
    new Set(comparisons.flatMap(c => [c.image_a_id, c.image_b_id]))
  );
  const n = imageIds.length;
  if (n < 2) return { rankings: imageIds.map(id => ({ id, pi: 1 })), covariance: [[0]] };

  const idToIndex = new Map(imageIds.map((id, idx) => [id, idx]));
  const X: number[][] = [];
  const y: number[] = [];

  comparisons.forEach(comp => {
    const i = idToIndex.get(comp.image_a_id)!;
    const j = idToIndex.get(comp.image_b_id)!;
    const row = new Array(n).fill(0);
    if (comp.winner_id === comp.image_a_id) {
      row[i] = 1;
      row[j] = -1;
      y.push(1);
    } else {
      row[i] = -1;
      row[j] = 1;
      y.push(1);
    }
    X.push(row);
  });

  const X_reduced = X.map(row => row.slice(0, -1));
  const n_params = n - 1;
  let beta = new Array(n_params).fill(0);
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    const mu = X_reduced.map(row => {
      const logit = math.dot(row, beta);
      return 1 / (1 + Math.exp(-logit));
    });
    const W = math.diag(mu.map(p => p * (1 - p))) as math.Matrix;
    const XTWX = math.multiply(math.transpose(X_reduced), math.multiply(W, X_reduced)) as math.Matrix;
    const reg = math.multiply(1e-6, math.identity(n_params)) as math.Matrix;
    const XTWX_reg = math.add(XTWX, reg) as math.Matrix;
    const XTWz = math.multiply(
        math.transpose(X_reduced),
        math.matrix(mu.map((m, i) => y[i] - m))
      ) as math.Matrix;
    const delta = math.lusolve(XTWX_reg, XTWz) as math.Matrix;
    const betaNew = math.add(beta, delta.toArray()) as number[];
    const change = math.norm(math.subtract(betaNew, beta), 2) as number;
    beta = betaNew;
    if (change < tolerance) break;
  }

  beta.push(0); // Reference item

  const rankings = imageIds.map((id, idx) => ({
    id,
    pi: Math.exp(beta[idx]),
  }));

  const mu = X.map(row => {
    const logit = math.dot(row, beta);
    return 1 / (1 + Math.exp(-logit));
  });
  const W = math.diag(mu.map(p => p * (1 - p))) as math.Matrix;
  const hessian = math.multiply(math.transpose(X), math.multiply(W, X)) as math.Matrix;
  const hessian_reg = math.add(hessian, math.multiply(1e-6, math.identity(n))) as math.Matrix;
  const covarianceMatrix = math.inv(hessian_reg) as math.Matrix;
  const covariance = covarianceMatrix.toArray() as number[][];

  return { rankings: rankings.sort((a, b) => b.pi - a.pi), covariance };
}

// Monte Carlo simulation for rank probabilities
function computeRankProbabilities(
  rankings: { id: string; pi: number }[],
  covariance: number[][],
  numSamples: number = 10000
): {
  topProbabilities: Record<string, number>;
  exactRankProbabilities: Record<string, number>;
} {
  const imageIds = rankings.map(r => r.id);
  const logPi = rankings.map(r => Math.log(r.pi));
  const rankCounts: Record<string, number[]> = {};
  imageIds.forEach(id => (rankCounts[id] = new Array(imageIds.length).fill(0)));
  const rankMap = new Map(rankings.map((r, idx) => [r.id, idx]));

  const covMatrix = math.matrix(covariance);
  const L = choleskyDecomposition(covMatrix);

  for (let i = 0; i < numSamples; i++) {
    const z = math.random([covariance.length]).map(() =>
      Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    );
    const sampledLogPi = math.add(logPi, math.multiply(L, z).toArray()) as number[];
    const sampledPi = sampledLogPi.map(v => Math.exp(v));

    const sorted = imageIds
      .map((id, idx) => ({ id, pi: sampledPi[idx] }))
      .sort((a, b) => b.pi - a.pi);
    sorted.forEach((item, rank) => rankCounts[item.id][rank]++);
  }

  const topProbabilities: Record<string, number> = {};
  const exactRankProbabilities: Record<string, number> = {};

  imageIds.forEach(id => {
    topProbabilities[id] = rankCounts[id].slice(0, 5).reduce((sum, c) => sum + c, 0) / numSamples;
    const currentRank = rankMap.get(id)!;
    exactRankProbabilities[id] = rankCounts[id][currentRank] / numSamples;
  });

  return { topProbabilities, exactRankProbabilities };
}

export function computeBradleyTerryResults(
  comparisons: Comparison[],
  numSamples: number = 10000
): BradleyTerryResult {
  const { rankings, covariance } = estimateBradleyTerryParams(comparisons);
  const { topProbabilities, exactRankProbabilities } = computeRankProbabilities(
    rankings,
    covariance,
    numSamples
  );
  return { rankings, topProbabilities, exactRankProbabilities };
}