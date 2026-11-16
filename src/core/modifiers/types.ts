import { SerializedEditableMesh, Vec3 } from '../mesh/EditableMesh';

export type ModifierType = 'mirror' | 'subdivision';

export interface MirrorAxisFlags {
  x: boolean;
  y: boolean;
  z: boolean;
}

export interface MirrorModifierParams {
  axes: MirrorAxisFlags;
  merge: boolean;
  mergeDistance: number;
  clipping: boolean;
  bisect: MirrorAxisFlags;
  flipBisect: MirrorAxisFlags;
  mirrorObjectId: string | null;
}

export type SubdivisionLevel = 0 | 1 | 2 | 3;

export interface SubdivisionModifierParams {
  levels: SubdivisionLevel;
}

export interface ModifierSlot {
  id: string;
  type: ModifierType | string;
  enabled: boolean;
  showInViewport?: boolean;
  expanded?: boolean;
  params:
    | MirrorModifierParams
    | SubdivisionModifierParams
    | Record<string, unknown>;
}

export interface ModifierDiagnostic {
  modifierId: string;
  type: ModifierType | string;
  status: 'ok' | 'warning' | 'error';
  code?:
    | 'ngons_detected'
    | 'triangles_present'
    | 'non_manifold'
    | 'degenerate_faces'
    | 'empty_mesh'
    | 'budget_exceeded'
    | 'level_3_warning'
    | 'inconsistent_winding';
  message?: string;
  vertexCount: number;
  edgeCount: number;
  faceCount: number;
  ngonCount: number;
  triangleCount: number;
  nonManifoldEdges: number;
  budgetExceeded?: boolean;
}

export interface ModifierEvaluationResult {
  mesh: SerializedEditableMesh;
  diagnostics: Record<string, ModifierDiagnostic>;
  hasActiveModifiers: boolean;
  fromCache: boolean;
}

export interface ModifierTransformRef {
  id: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export const MODIFIER_LABELS: Record<ModifierType, string> = {
  mirror: 'Mirror (Espejo)',
  subdivision: 'Subdivision Surface',
};

export const TABLET_SUBDIV_MAX_LEVEL: SubdivisionLevel = 3;
export const TABLET_SUBDIV_FACE_BUDGET = 24_000;

export function createDefaultMirrorParams(): MirrorModifierParams {
  return {
    axes: { x: true, y: false, z: false },
    merge: true,
    mergeDistance: 0.005,
    clipping: false,
    bisect: { x: false, y: false, z: false },
    flipBisect: { x: false, y: false, z: false },
    mirrorObjectId: null,
  };
}

export function createDefaultSubdivisionParams(): SubdivisionModifierParams {
  return {
    levels: 1,
  };
}

export function normalizeMirrorParams(raw?: unknown): MirrorModifierParams {
  const def = createDefaultMirrorParams();
  if (!raw || typeof raw !== 'object') return def;
  const r = raw as Partial<MirrorModifierParams>;
  const rawMergeDist =
    typeof r.mergeDistance === 'number' && Number.isFinite(r.mergeDistance)
      ? Math.max(0.0001, Math.min(0.5, r.mergeDistance))
      : def.mergeDistance;
  return {
    axes: {
      x: typeof r.axes?.x === 'boolean' ? r.axes.x : def.axes.x,
      y: typeof r.axes?.y === 'boolean' ? r.axes.y : def.axes.y,
      z: typeof r.axes?.z === 'boolean' ? r.axes.z : def.axes.z,
    },
    merge: typeof r.merge === 'boolean' ? r.merge : def.merge,
    mergeDistance: rawMergeDist,
    clipping: typeof r.clipping === 'boolean' ? r.clipping : def.clipping,
    bisect: {
      x: typeof r.bisect?.x === 'boolean' ? r.bisect.x : def.bisect.x,
      y: typeof r.bisect?.y === 'boolean' ? r.bisect.y : def.bisect.y,
      z: typeof r.bisect?.z === 'boolean' ? r.bisect.z : def.bisect.z,
    },
    flipBisect: {
      x:
        typeof r.flipBisect?.x === 'boolean'
          ? r.flipBisect.x
          : def.flipBisect.x,
      y:
        typeof r.flipBisect?.y === 'boolean'
          ? r.flipBisect.y
          : def.flipBisect.y,
      z:
        typeof r.flipBisect?.z === 'boolean'
          ? r.flipBisect.z
          : def.flipBisect.z,
    },
    mirrorObjectId:
      typeof r.mirrorObjectId === 'string' && r.mirrorObjectId
        ? r.mirrorObjectId
        : null,
  };
}

export function normalizeSubdivisionParams(
  raw?: unknown,
): SubdivisionModifierParams {
  const def = createDefaultSubdivisionParams();
  if (!raw || typeof raw !== 'object') return def;
  const r = raw as Partial<SubdivisionModifierParams>;
  const lvl =
    typeof r.levels === 'number' && Number.isFinite(r.levels)
      ? (Math.max(0, Math.min(3, Math.round(r.levels))) as SubdivisionLevel)
      : def.levels;
  return { levels: lvl };
}

export function normalizeModifierSlot(
  raw: unknown,
  fallbackId: string,
): ModifierSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ModifierSlot>;
  const type = typeof r.type === 'string' ? r.type : '';
  if (!type) return null;
  const id = typeof r.id === 'string' && r.id ? r.id : fallbackId;
  const enabled = typeof r.enabled === 'boolean' ? r.enabled : true;
  const showInViewport =
    typeof r.showInViewport === 'boolean' ? r.showInViewport : true;
  const expanded = typeof r.expanded === 'boolean' ? r.expanded : true;

  if (type === 'mirror') {
    return {
      id,
      type: 'mirror',
      enabled,
      showInViewport,
      expanded,
      params: normalizeMirrorParams(r.params),
    };
  }
  if (type === 'subdivision') {
    return {
      id,
      type: 'subdivision',
      enabled,
      showInViewport,
      expanded,
      params: normalizeSubdivisionParams(r.params),
    };
  }

  return {
    id,
    type,
    enabled,
    showInViewport,
    expanded,
    params:
      r.params && typeof r.params === 'object'
        ? { ...(r.params as Record<string, unknown>) }
        : {},
  };
}
