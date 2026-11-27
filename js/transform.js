/*
 * Alignment math: carries schematic-map positions onto another map.
 *
 * With 4 anchor points the fit is a plain affine transform (shift, scale,
 * rotate, shear). With 5 or more it becomes a thin-plate spline: it still
 * follows the affine fit overall, but bends locally so every anchor lands
 * exactly where it was clicked. That corrects the hand-drawn map's local
 * distortions, so each extra anchor improves the pins around it.
 *
 * Works in the browser (window.LEONIDA_TRANSFORM) and in Node (require).
 */
(function (root) {
  // Gaussian elimination with partial pivoting. Returns null if singular.
  function solve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / M[c][c];
        if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
      x[r] = s / M[r][r];
    }
    return x;
  }

  // pairs: [[[x, y], [X, Y]], ...]  ->  T = [a, b, c, d, e, f]
  function fitAffine(pairs) {
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
    for (const [[x, y], [X, Y]] of pairs) {
      const r = [x, y, 1];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) M[i][j] += r[i] * r[j];
        bx[i] += r[i] * X;
        by[i] += r[i] * Y;
      }
    }
    const a = solve(M, bx), d = solve(M, by);
    return a && d ? [...a, ...d] : null;
  }

  // r^2 log r, written with r^2 to avoid a square root.
  const U = (r2) => (r2 > 0 ? 0.5 * r2 * Math.log(r2) : 0);

  function fitTPS(pairs) {
    const n = pairs.length, N = n + 3;
    const A = Array.from({ length: N }, () => new Array(N).fill(0));
    const bx = new Array(N).fill(0), by = new Array(N).fill(0);
    for (let i = 0; i < n; i++) {
      const [[xi, yi], [Xi, Yi]] = pairs[i];
      for (let j = 0; j < n; j++) {
        const [[xj, yj]] = pairs[j];
        A[i][j] = U((xi - xj) ** 2 + (yi - yj) ** 2);
      }
      A[i][n] = A[n][i] = 1;
      A[i][n + 1] = A[n + 1][i] = xi;
      A[i][n + 2] = A[n + 2][i] = yi;
      bx[i] = Xi;
      by[i] = Yi;
    }
    const wx = solve(A, bx), wy = solve(A, by);
    if (!wx || !wy) return null;
    const src = pairs.map(([s]) => s);
    return (x, y) => {
      let X = wx[n] + wx[n + 1] * x + wx[n + 2] * y;
      let Y = wy[n] + wy[n + 1] * x + wy[n + 2] * y;
      for (let i = 0; i < n; i++) {
        const u = U((x - src[i][0]) ** 2 + (y - src[i][1]) ** 2);
        X += wx[i] * u;
        Y += wy[i] * u;
      }
      return { x: X, y: Y };
    };
  }

  /*
   * calib: { T: [a,b,c,d,e,f], pts?: [[placeKey, X, Y], ...] }
   * places: the gazetteer (key -> [x, y, ...]) used to look up anchor keys.
   * Returns { fwd(x, y), inv(X, Y), T, warped } or null.
   */
  function makeTransform(calib, places) {
    if (!calib) return null;
    const pairs = (calib.pts || [])
      .filter((p) => Array.isArray(p) && places[p[0]] && isFinite(p[1]) && isFinite(p[2]))
      .map(([k, X, Y]) => [[places[k][0], places[k][1]], [X, Y]]);
    const T = calib.T || (pairs.length >= 3 ? fitAffine(pairs) : null);
    if (!T) return null;
    const aff = (x, y) => ({ x: T[0] * x + T[1] * y + T[2], y: T[3] * x + T[4] * y + T[5] });
    const det = T[0] * T[4] - T[1] * T[3];
    // Apply the inverse of the affine's linear part to a vector.
    const linInv = (ex, ey) => ({ x: (T[4] * ex - T[1] * ey) / det, y: (-T[3] * ex + T[0] * ey) / det });
    const affInv = (X, Y) => linInv(X - T[2], Y - T[5]);
    const tps = pairs.length >= 5 ? fitTPS(pairs) : null;
    const fwd = tps || aff;
    // The spline has no closed-form inverse: refine the affine guess.
    const inv = (X, Y) => {
      let p = affInv(X, Y);
      if (!tps) return p;
      for (let i = 0; i < 20; i++) {
        const q = fwd(p.x, p.y);
        const d = linInv(X - q.x, Y - q.y);
        p = { x: p.x + d.x, y: p.y + d.y };
        if (Math.abs(d.x) + Math.abs(d.y) < 1e-6) break;
      }
      return p;
    };
    return { fwd, inv, T, warped: !!tps };
  }

  const out = { solve, fitAffine, fitTPS, makeTransform };
  if (typeof module !== 'undefined' && module.exports) module.exports = out;
  else root.LEONIDA_TRANSFORM = out;
})(typeof window !== 'undefined' ? window : globalThis);
