import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FlipHorizontal2,
  Plus,
  Power,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  MODIFIER_LABELS,
  ModifierDiagnostic,
  ModifierSlot,
  ModifierType,
  SubdivisionLevel,
  TABLET_SUBDIV_FACE_BUDGET,
  normalizeMirrorParams,
  normalizeSubdivisionParams,
} from '../core/modifiers/types';
import { isEditableMeshObject } from '../core/project/hierarchy';
import { SceneObjectData } from '../core/project/types';

interface ModifierStackPanelProps {
  selectedObject: SceneObjectData | null;
  sceneObjects: SceneObjectData[];
  diagnostics: Record<string, ModifierDiagnostic>;
  evaluatedVertexCount: number;
  evaluatedFaceCount: number;
  hasActiveModifiers: boolean;
  onAddModifier: (objectId: string, type: ModifierType) => void;
  onUpdateModifier: (
    objectId: string,
    modifierId: string,
    patch: Partial<ModifierSlot>,
    recordHistory?: boolean,
  ) => void;
  onReorderModifier: (
    objectId: string,
    modifierId: string,
    direction: 'up' | 'down',
  ) => void;
  onRemoveModifier: (objectId: string, modifierId: string) => void;
  onApplyModifier: (objectId: string, modifierId: string) => void;
}

export const ModifierStackPanel: React.FC<ModifierStackPanelProps> = ({
  selectedObject,
  sceneObjects,
  diagnostics,
  evaluatedVertexCount,
  evaluatedFaceCount,
  hasActiveModifiers,
  onAddModifier,
  onUpdateModifier,
  onReorderModifier,
  onRemoveModifier,
  onApplyModifier,
}) => {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const sliderHistoryRecordedRef = useRef(false);

  const canModify = Boolean(
    selectedObject &&
      isEditableMeshObject(selectedObject) &&
      !selectedObject.locked,
  );
  const modifiers = selectedObject?.modifiers ?? [];

  const handleSelectAddType = (type: ModifierType) => {
    if (!selectedObject) return;
    setAddMenuOpen(false);
    onAddModifier(selectedObject.id, type);
  };

  if (!selectedObject) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto cad-scroll p-3 space-y-3">
        <div className="pb-2 border-b border-[#262931] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#e4e6eb]">
            Pila de Modificadores
          </span>
        </div>
        <div className="flex-1 min-h-[160px] rounded-lg border border-dashed border-[#2f3440] bg-[#14161b] p-4 flex flex-col items-center justify-center text-center gap-2">
          <Sparkles className="w-5 h-5 text-[#6b7280]" />
          <p className="text-xs text-[#9ca3af] leading-relaxed max-w-[210px]">
            Selecciona un objeto de malla para añadir y configurar modificadores no destructivos.
          </p>
        </div>
      </div>
    );
  }

  if (!isEditableMeshObject(selectedObject)) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto cad-scroll p-3 space-y-3">
        <div className="pb-2 border-b border-[#262931] flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#e4e6eb]">
            Pila de Modificadores
          </span>
          <span className="text-[11px] text-[#8e95a2] truncate max-w-[115px]">
            {selectedObject.name}
          </span>
        </div>
        <div className="rounded-lg border border-[#2b2e36] bg-[#14161b] p-3.5 text-xs text-[#9ca3af] leading-relaxed">
          Este tipo de objeto ({selectedObject.objectType === 'reference_image' ? 'imagen de referencia' : 'no malla'}) no admite modificadores de geometría.
        </div>
      </div>
    );
  }

  const mirrorRefCandidates = sceneObjects.filter(
    (o) => o.id !== selectedObject.id,
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto cad-scroll p-2.5 space-y-2.5">
      {/* Header + Stats */}
      <div className="pb-2 border-b border-[#262931] space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#e4e6eb]">
            Modificadores
          </span>
          <span className="text-[11px] text-[#ff9900] font-medium truncate max-w-[125px]">
            {selectedObject.name}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#8e95a2] font-mono-tabular">
          <span>
            Base: {selectedObject.mesh.vertices.length}v ·{' '}
            {selectedObject.mesh.faces.length}c
          </span>
          {hasActiveModifiers && (
            <span className="text-[#38bdf8]">
              Final: {evaluatedVertexCount}v · {evaluatedFaceCount}c
            </span>
          )}
        </div>
      </div>

      {/* Add Modifier Selector */}
      <div className="relative">
        <button
          type="button"
          disabled={!canModify}
          onClick={() => setAddMenuOpen((v) => !v)}
          className="w-full h-9 px-3 rounded-lg bg-[#222630] hover:bg-[#2a2f3c] disabled:opacity-45 border border-[#343947] text-xs font-semibold text-[#f3f4f6] flex items-center justify-between gap-2 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#ff9900]" />
            <span>Agregar modificador</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform ${
              addMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {addMenuOpen && (
          <div className="mt-1.5 rounded-lg bg-[#12141a] border border-[#2f3440] shadow-xl overflow-hidden divide-y divide-[#222630]">
            <button
              type="button"
              onClick={() => handleSelectAddType('mirror')}
              className="w-full px-3 py-2.5 text-left hover:bg-[#1e2330] flex items-center gap-2.5 transition-colors"
            >
              <FlipHorizontal2 className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#e4e6eb]">
                  {MODIFIER_LABELS.mirror}
                </div>
                <div className="text-[10px] text-[#8e95a2]">
                  Simetría en tiempo real sobre X / Y / Z
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectAddType('subdivision')}
              className="w-full px-3 py-2.5 text-left hover:bg-[#1e2330] flex items-center gap-2.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#ff9900] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#e4e6eb]">
                  {MODIFIER_LABELS.subdivision}
                </div>
                <div className="text-[10px] text-[#8e95a2]">
                  Catmull-Clark optimizado para tablet (0–3)
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {selectedObject.locked && (
        <div className="rounded-md bg-[#2a2115] border border-[#ff9900]/40 px-2.5 py-2 text-[11px] text-[#fbbf24]">
          Objeto bloqueado. Desbloquéalo en Jerarquía para editar modificadores.
        </div>
      )}

      {/* Modifier Stack */}
      {modifiers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#2b2e36] bg-[#14161b] px-3 py-5 text-center space-y-1.5">
          <p className="text-xs text-[#9ca3af]">
            Sin modificadores activos.
          </p>
          <p className="text-[11px] text-[#6b7280] leading-relaxed">
            La geometría original permanece intacta hasta que decidas aplicar un modificador.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {modifiers.map((mod, idx) => {
            const diag = diagnostics[mod.id];
            const isExpanded = mod.expanded !== false;
            const showPreview = mod.showInViewport !== false;
            const hasBlockingError = diag?.status === 'error';
            const isMirror = mod.type === 'mirror';
            const mirrorParams = isMirror
              ? normalizeMirrorParams(mod.params)
              : null;
            const subdivParams = !isMirror
              ? normalizeSubdivisionParams(mod.params)
              : null;

            return (
              <div
                key={mod.id}
                className={`rounded-lg border transition-colors ${
                  hasBlockingError
                    ? 'bg-[#1a1416] border-[#ef4444]/50'
                    : mod.enabled
                      ? 'bg-[#151820] border-[#2e3340]'
                      : 'bg-[#13151a] border-[#232630] opacity-75'
                }`}
              >
                {/* Card Header */}
                <div className="px-2 py-1.5 flex items-center justify-between gap-1 border-b border-[#232733]">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateModifier(
                        selectedObject.id,
                        mod.id,
                        { expanded: !isExpanded },
                        false,
                      )
                    }
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left py-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#8e95a2] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#8e95a2] shrink-0" />
                    )}
                    {isMirror ? (
                      <FlipHorizontal2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#ff9900] shrink-0" />
                    )}
                    <span className="text-[11px] font-semibold text-[#e4e6eb] truncate">
                      {isMirror ? 'Mirror' : 'Subdivision'}
                    </span>
                    {!isMirror && subdivParams && (
                      <span className="px-1.5 py-0.5 rounded bg-[#232734] text-[10px] font-mono-tabular text-[#cbd5e1] shrink-0">
                        N{subdivParams.levels}
                      </span>
                    )}
                  </button>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={!canModify}
                      onClick={() =>
                        onUpdateModifier(selectedObject.id, mod.id, {
                          showInViewport: !showPreview,
                        })
                      }
                      title={
                        showPreview
                          ? 'Ocultar vista previa en viewport'
                          : 'Mostrar resultado en viewport'
                      }
                      aria-label="Mostrar resultado en viewport"
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        showPreview
                          ? 'text-[#38bdf8] hover:bg-[#232834]'
                          : 'text-[#6b7280] hover:bg-[#232834]'
                      }`}
                    >
                      {showPreview ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!canModify}
                      onClick={() =>
                        onUpdateModifier(selectedObject.id, mod.id, {
                          enabled: !mod.enabled,
                        })
                      }
                      title={
                        mod.enabled
                          ? 'Desactivar modificador'
                          : 'Activar modificador'
                      }
                      aria-label="Activar o desactivar modificador"
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        mod.enabled
                          ? 'text-[#34d399] hover:bg-[#232834]'
                          : 'text-[#6b7280] hover:bg-[#232834]'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={!canModify || idx === 0}
                      onClick={() =>
                        onReorderModifier(selectedObject.id, mod.id, 'up')
                      }
                      title="Subir en la pila"
                      aria-label="Subir modificador"
                      className="w-7 h-7 rounded text-[#9ca3af] hover:text-white hover:bg-[#232834] disabled:opacity-30 flex items-center justify-center"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={!canModify || idx === modifiers.length - 1}
                      onClick={() =>
                        onReorderModifier(selectedObject.id, mod.id, 'down')
                      }
                      title="Bajar en la pila"
                      aria-label="Bajar modificador"
                      className="w-7 h-7 rounded text-[#9ca3af] hover:text-white hover:bg-[#232834] disabled:opacity-30 flex items-center justify-center"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={!canModify}
                      onClick={() =>
                        onRemoveModifier(selectedObject.id, mod.id)
                      }
                      title="Eliminar modificador sin alterar la malla base"
                      aria-label="Eliminar modificador"
                      className="w-7 h-7 rounded text-[#9ca3af] hover:text-[#f87171] hover:bg-[#2c1d21] disabled:opacity-30 flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded && (
                  <div className="p-2.5 space-y-2.5">
                    {isMirror && mirrorParams && (
                      <>
                        {/* Axes X / Y / Z */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-medium text-[#9ca3af]">
                            Ejes de simetría
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['x', 'y', 'z'] as const).map((axis) => {
                              const active = mirrorParams.axes[axis];
                              const accent =
                                axis === 'x'
                                  ? 'border-[#e05252]/70 bg-[#e05252]/20 text-[#fca5a5]'
                                  : axis === 'y'
                                    ? 'border-[#52b852]/70 bg-[#52b852]/20 text-[#86efac]'
                                    : 'border-[#48bce8]/70 bg-[#48bce8]/20 text-[#7dd3fc]';
                              return (
                                <button
                                  key={axis}
                                  type="button"
                                  disabled={!canModify}
                                  onClick={() =>
                                    onUpdateModifier(
                                      selectedObject.id,
                                      mod.id,
                                      {
                                        params: {
                                          ...mirrorParams,
                                          axes: {
                                            ...mirrorParams.axes,
                                            [axis]: !active,
                                          },
                                        },
                                      },
                                    )
                                  }
                                  className={`h-8 rounded-md text-xs font-bold uppercase border transition-colors ${
                                    active
                                      ? accent
                                      : 'bg-[#101216] border-[#292d38] text-[#9ca3af] hover:text-white'
                                  }`}
                                >
                                  {axis.toUpperCase()}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bisect X / Y / Z */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[#9ca3af]">
                              Bisect (cortar plano)
                            </span>
                            {(mirrorParams.bisect.x ||
                              mirrorParams.bisect.y ||
                              mirrorParams.bisect.z) && (
                              <span className="text-[10px] text-[#6b7280]">
                                Lado opuesto
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['x', 'y', 'z'] as const).map((axis) => {
                              const active = mirrorParams.bisect[axis];
                              const flipped = mirrorParams.flipBisect[axis];
                              return (
                                <div key={axis} className="flex gap-1">
                                  <button
                                    type="button"
                                    disabled={!canModify}
                                    onClick={() =>
                                      onUpdateModifier(
                                        selectedObject.id,
                                        mod.id,
                                        {
                                          params: {
                                            ...mirrorParams,
                                            bisect: {
                                              ...mirrorParams.bisect,
                                              [axis]: !active,
                                            },
                                          },
                                        },
                                      )
                                    }
                                    className={`flex-1 h-8 rounded-md text-[11px] font-semibold uppercase border transition-colors ${
                                      active
                                        ? 'bg-[#2a2f3a] border-[#ff9900]/70 text-[#ff9900]'
                                        : 'bg-[#101216] border-[#292d38] text-[#9ca3af] hover:text-white'
                                    }`}
                                  >
                                    {axis.toUpperCase()}
                                  </button>
                                  {active && (
                                    <button
                                      type="button"
                                      disabled={!canModify}
                                      onClick={() =>
                                        onUpdateModifier(
                                          selectedObject.id,
                                          mod.id,
                                          {
                                            params: {
                                              ...mirrorParams,
                                              flipBisect: {
                                                ...mirrorParams.flipBisect,
                                                [axis]: !flipped,
                                              },
                                            },
                                          },
                                        )
                                      }
                                      title={`Invertir lado de corte en ${axis.toUpperCase()}`}
                                      className={`w-7 h-8 rounded-md text-[10px] font-bold border transition-colors ${
                                        flipped
                                          ? 'bg-[#3b2914] border-[#ff9900] text-[#fbbf24]'
                                          : 'bg-[#101216] border-[#292d38] text-[#9ca3af]'
                                      }`}
                                    >
                                      ±
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Merge & Clipping */}
                        <div className="space-y-2 pt-0.5">
                          <label className="flex items-center justify-between gap-2 min-h-[32px] px-2 rounded-md bg-[#101216] border border-[#242832] cursor-pointer">
                            <span className="text-[11px] text-[#d1d5db]">
                              Fusionar vértices (Merge)
                            </span>
                            <input
                              type="checkbox"
                              disabled={!canModify}
                              checked={mirrorParams.merge}
                              onChange={(e) =>
                                onUpdateModifier(selectedObject.id, mod.id, {
                                  params: {
                                    ...mirrorParams,
                                    merge: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 accent-[#ff9900]"
                            />
                          </label>

                          {mirrorParams.merge && (
                            <div className="px-2 py-1.5 rounded-md bg-[#101216] border border-[#242832] space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#9ca3af]">
                                  Distancia de fusión
                                </span>
                                <span className="font-mono-tabular text-[#e4e6eb]">
                                  {mirrorParams.mergeDistance.toFixed(4)}
                                </span>
                              </div>
                              <input
                                type="range"
                                disabled={!canModify}
                                min={0.0005}
                                max={0.1}
                                step={0.0005}
                                value={Math.min(0.1, mirrorParams.mergeDistance)}
                                onPointerDown={() => {
                                  sliderHistoryRecordedRef.current = false;
                                }}
                                onPointerUp={() => {
                                  sliderHistoryRecordedRef.current = false;
                                }}
                                onPointerCancel={() => {
                                  sliderHistoryRecordedRef.current = false;
                                }}
                                onBlur={() => {
                                  sliderHistoryRecordedRef.current = false;
                                }}
                                onChange={(e) => {
                                  const shouldRecord =
                                    !sliderHistoryRecordedRef.current;
                                  sliderHistoryRecordedRef.current = true;
                                  onUpdateModifier(
                                    selectedObject.id,
                                    mod.id,
                                    {
                                      params: {
                                        ...mirrorParams,
                                        mergeDistance: Number(e.target.value),
                                      },
                                    },
                                    shouldRecord,
                                  );
                                }}
                                className="w-full accent-[#ff9900]"
                              />
                            </div>
                          )}

                          <label className="flex items-center justify-between gap-2 min-h-[32px] px-2 rounded-md bg-[#101216] border border-[#242832] cursor-pointer">
                            <span className="text-[11px] text-[#d1d5db]">
                              Clipping (bloquear plano)
                            </span>
                            <input
                              type="checkbox"
                              disabled={!canModify}
                              checked={mirrorParams.clipping}
                              onChange={(e) =>
                                onUpdateModifier(selectedObject.id, mod.id, {
                                  params: {
                                    ...mirrorParams,
                                    clipping: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 accent-[#ff9900]"
                            />
                          </label>
                        </div>

                        {/* Mirror Object Reference */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-[#9ca3af]">
                            Objeto de simetría
                          </label>
                          <select
                            disabled={!canModify}
                            value={mirrorParams.mirrorObjectId ?? ''}
                            onChange={(e) =>
                              onUpdateModifier(selectedObject.id, mod.id, {
                                params: {
                                  ...mirrorParams,
                                  mirrorObjectId: e.target.value || null,
                                },
                              })
                            }
                            className="w-full h-8 px-2 rounded-md bg-[#101216] border border-[#292d38] focus:border-[#ff9900] text-[11px] text-[#e4e6eb] outline-none"
                          >
                            <option value="">Origen del objeto (Local)</option>
                            {mirrorRefCandidates.map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {!isMirror && subdivParams && (
                      <>
                        {/* Subdivision Levels 0..3 */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[#9ca3af]">
                              Niveles (Tablet)
                            </span>
                            <span className="text-[10px] font-mono-tabular text-[#8e95a2]">
                              Máx: 3 ({TABLET_SUBDIV_FACE_BUDGET.toLocaleString()} c)
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {([0, 1, 2, 3] as SubdivisionLevel[]).map((lvl) => {
                              const active = subdivParams.levels === lvl;
                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  disabled={!canModify}
                                  onClick={() =>
                                    onUpdateModifier(
                                      selectedObject.id,
                                      mod.id,
                                      {
                                        params: { levels: lvl },
                                      },
                                    )
                                  }
                                  className={`h-8 rounded-md text-xs font-semibold font-mono-tabular border transition-colors ${
                                    active
                                      ? lvl === 3
                                        ? 'bg-[#3b2914] border-[#ff9900] text-[#fbbf24]'
                                        : 'bg-[#2a2f3a] border-[#ff9900] text-[#ff9900]'
                                      : 'bg-[#101216] border-[#292d38] text-[#9ca3af] hover:text-white'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Diagnostics (Errors / Warnings) */}
                    {diag?.status === 'error' && diag.message && (
                      <div className="rounded-md bg-[#2a1518] border border-[#ef4444]/60 px-2.5 py-2 flex items-start gap-2 text-[11px] text-[#fca5a5] leading-snug">
                        <ShieldAlert className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
                        <span>{diag.message}</span>
                      </div>
                    )}

                    {diag?.status === 'warning' && diag.message && (
                      <div className="rounded-md bg-[#292114] border border-[#f59e0b]/50 px-2.5 py-2 flex items-start gap-2 text-[11px] text-[#fcd34d] leading-snug">
                        <AlertTriangle className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
                        <span>{diag.message}</span>
                      </div>
                    )}

                    {/* Card Footer: Step Counts + Apply */}
                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#232733]">
                      <span className="text-[10px] font-mono-tabular text-[#8e95a2]">
                        {diag
                          ? `${diag.vertexCount}v · ${diag.faceCount}c`
                          : 'Vista previa desactivada'}
                      </span>

                      <button
                        type="button"
                        disabled={!canModify || hasBlockingError}
                        onClick={() =>
                          onApplyModifier(selectedObject.id, mod.id)
                        }
                        title={
                          hasBlockingError
                            ? 'Corrige los errores de topología antes de aplicar'
                            : 'Aplicar modificador definitivamente a la malla base'
                        }
                        className="h-7 px-2.5 rounded-md bg-[#222834] hover:bg-[#ff9900] hover:text-[#111317] disabled:opacity-40 disabled:hover:bg-[#222834] disabled:hover:text-[#9ca3af] border border-[#343b4a] text-[11px] font-semibold text-[#e4e6eb] flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
