/**
 * Decorative QR-style placeholder. It is a deterministic pattern drawn with a
 * fixed seed — it encodes no data of any kind: no UPI ID, no URL, no account.
 * Replaced wholesale by the real UPI QR image once one is supplied
 * (see PAYMENT_QR in @/lib/commerce).
 */
const SIZE = 29;
const SEED = 0x4a7f;

function pseudoQrModules(): boolean[][] {
  // Fixed-seed LCG so the pattern is stable between renders and builds.
  let state = SEED;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const grid: boolean[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => false),
  );
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      grid[y][x] = rand() > 0.52;
    }
  }
  // Finder patterns in three corners, with their quiet zones cleared.
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 8; y++) {
      for (let x = -1; x <= 8; x++) {
        const px = ox + x;
        const py = oy + y;
        if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) continue;
        grid[py][px] = false;
      }
    }
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = y === 0 || y === 6 || x === 0 || x === 6;
        const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        grid[oy + y][ox + x] = edge || core;
      }
    }
  };
  finder(0, 0);
  finder(SIZE - 7, 0);
  finder(0, SIZE - 7);
  return grid;
}

const MODULES = pseudoQrModules();

export function DemoQr({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Demo QR placeholder — decorative only, not a working payment QR"
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={SIZE} height={SIZE} fill="white" />
      {MODULES.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}
