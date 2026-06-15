import { useState } from "react";
import { blockFeatures, getFeature, layoutFeatures } from "../../features/registry";
import { revokePendingAsset, stageImageFile } from "../../services/mediaStaging";
import { shortSha } from "../../utils/format";
import { collectLocalMediaPaths } from "../../utils/mediaReferences";
import { getHomePage } from "../../utils/validation";

const DRAG_DATA_TYPE = "application/x-portfolio-editor";

export function AdminDashboard({
  data,
  onBlockCommit,
  onAddBlock,
  onMoveBlock,
  onRemoveBlock,
  onRemovePendingAsset,
  pendingAssets,
  theme,
  onThemeChange,
  onSave,
  onLogout,
  savedRepo,
  savedBranch,
  status,
  message,
  canSave,
  lastPublish,
}) {
  const page = getHomePage(data);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [editingBlockId, setEditingBlockId] = useState("");
  const [dragTarget, setDragTarget] = useState(null);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const editingBlock = findBlockById(page.blocks, editingBlockId);

  function closeEditor() {
    setEditingBlockId("");
  }

  function removeEditingBlock() {
    if (!editingBlock) return;
    onRemoveBlock(editingBlock.id);
    setSelectedBlockId("");
    closeEditor();
  }

  function handleDropItem(payload, parentId = "", targetIndex = null) {
    const parentBlock = parentId ? findBlockById(page.blocks, parentId) : null;
    if (!canAcceptDrop(payload, parentBlock, targetIndex)) return;

    if (payload.kind === "feature") {
      onAddBlock(payload.type, parentId, targetIndex);
      return;
    }

    if (payload.kind === "block") {
      if (targetIndex?.kind === "grid-cell") {
        if (payload.parentId === parentId && getBlockGridCell(payload.blockId, parentBlock) === targetIndex.cellIndex) return;
        onMoveBlock(payload.blockId, parentId, targetIndex);
        return;
      }

      if (payload.parentId === parentId && (targetIndex === payload.index || targetIndex === payload.index + 1)) {
        return;
      }

      const nextIndex = payload.parentId === parentId && targetIndex > payload.index
        ? targetIndex - 1
        : targetIndex;

      onMoveBlock(payload.blockId, parentId, nextIndex);
    }
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <TopEditorBar
        repo={savedRepo}
        branch={savedBranch}
        status={status}
        message={message}
        canSave={canSave}
        pendingCount={pendingAssets.length}
        lastPublish={lastPublish}
        theme={theme}
        onThemeChange={onThemeChange}
        onSave={onSave}
        onLogout={onLogout}
      />

      <div className="flex min-h-0 flex-1">
        <FeatureLibrary
          pendingAssets={pendingAssets}
          onRemovePendingAsset={onRemovePendingAsset}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapsed={() => setIsLibraryCollapsed((current) => !current)}
        />

        <section className="min-w-0 flex-1 overflow-auto">
          <DragSurface
            blocks={page.blocks}
            parentId=""
            dragTarget={dragTarget}
            onDragTarget={setDragTarget}
            onDropItem={handleDropItem}
            className="flex min-h-full w-full flex-col gap-3 p-4"
            style={{
              "--layout-viewport-height": "100%",
              "--layout-viewport-width": "100%",
            }}
          >
            {page.blocks.map((block, index) => (
              <EditablePreviewBlock
                key={block.id}
                block={block}
                index={index}
                parentId=""
                pendingAssets={pendingAssets}
                selectedBlockId={selectedBlockId}
                dragTarget={dragTarget}
                onSelectBlock={setSelectedBlockId}
                onDragTarget={setDragTarget}
                onEditBlock={setEditingBlockId}
                onRemoveBlock={onRemoveBlock}
                onDropItem={handleDropItem}
              />
            ))}
          </DragSurface>
        </section>
      </div>

      {editingBlock ? (
        <BlockSettingsModal
          block={editingBlock}
          pendingAssets={pendingAssets}
          onCommit={onBlockCommit}
          onClose={closeEditor}
          onRemove={removeEditingBlock}
        />
      ) : null}
    </div>
  );
}

function TopEditorBar({
  repo,
  branch,
  status,
  message,
  canSave,
  pendingCount,
  lastPublish,
  theme,
  onThemeChange,
  onSave,
  onLogout,
}) {
  return (
    <header className="ui-panel z-40 shrink-0 border-x-0 border-t-0 px-4 py-3 shadow-sm backdrop-blur md:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ background: "var(--text)" }}>
              Edit
            </span>
            <span className="truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {repo} / {branch}
            </span>
            {pendingCount ? (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
                {pendingCount} media pending
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm" style={{ color: "var(--text-muted)" }}>{message || "Ready to edit."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastPublish?.commitSha ? (
            <PublishBadge lastPublish={lastPublish} />
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="ui-icon-button"
            title={status === "saving" ? "Saving" : "Save changes"}
            aria-label={status === "saving" ? "Saving" : "Save changes"}
          >
            <Icon name="save" />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
            className="ui-icon-button"
            title={theme === "dark" ? "Use light theme" : "Use dark theme"}
            aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button
            type="button"
            onClick={() => onLogout(true)}
            className="ui-icon-button"
            title="Forget session"
            aria-label="Forget session"
          >
            <Icon name="log-out" />
          </button>
        </div>
      </div>
    </header>
  );
}

function PublishBadge({ lastPublish }) {
  if (lastPublish.commitUrl) {
    return (
      <a
        href={lastPublish.commitUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-xs font-bold text-emerald-800 underline"
      >
        {shortSha(lastPublish.commitSha)}
      </a>
    );
  }

  return (
    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-xs font-bold text-emerald-800">
      {shortSha(lastPublish.commitSha)}
    </span>
  );
}

function FeatureLibrary({ pendingAssets, onRemovePendingAsset, isCollapsed, onToggleCollapsed }) {
  return (
    <aside
      className={[
        "ui-panel min-h-0 shrink-0 overflow-y-auto border-y-0 border-l-0 p-3 transition-[width] duration-200",
        isCollapsed ? "w-16" : "w-72",
      ].join(" ")}
    >
      <div className="space-y-4">
        <div className={isCollapsed ? "flex justify-center" : "flex items-center justify-between gap-3"}>
          {isCollapsed ? null : (
            <h2 className="text-xs font-bold uppercase tracking-normal text-stone-500">Library</h2>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="ui-icon-button"
            title={isCollapsed ? "Expand library" : "Collapse library"}
            aria-label={isCollapsed ? "Expand library" : "Collapse library"}
          >
            <Icon name={isCollapsed ? "sidebar-open" : "sidebar-close"} />
          </button>
        </div>

        <FeatureCategory title="Layouts" features={layoutFeatures} isCollapsed={isCollapsed} />
        <FeatureCategory title="Blocks" features={blockFeatures} isCollapsed={isCollapsed} />
        {isCollapsed ? null : (
          <PendingMedia pendingAssets={pendingAssets} onRemovePendingAsset={onRemovePendingAsset} />
        )}
      </div>
    </aside>
  );
}

function FeatureCategory({ title, features, isCollapsed }) {
  return (
    <section>
      {isCollapsed ? null : (
        <h2 className="mb-2 text-xs font-bold uppercase tracking-normal text-stone-500">{title}</h2>
      )}
      <div className={isCollapsed ? "space-y-2" : "space-y-2"}>
        {features.map((feature) => (
          <FeatureSkeleton key={feature.type} feature={feature} isCollapsed={isCollapsed} />
        ))}
      </div>
    </section>
  );
}

function FeatureSkeleton({ feature, isCollapsed }) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData(
          DRAG_DATA_TYPE,
          JSON.stringify({ kind: "feature", type: feature.type }),
        );
        event.dataTransfer.setData("text/plain", feature.type);
      }}
      className={[
        "block-card cursor-grab transition hover:-translate-y-0.5 active:cursor-grabbing",
        isCollapsed ? "flex h-10 w-10 items-center justify-center p-0" : "p-3",
      ].join(" ")}
      title={`Drag ${feature.title}`}
    >
      {isCollapsed ? (
        <span className="text-xs font-bold" aria-hidden="true">{getFeatureInitials(feature)}</span>
      ) : (
        <>
          <FeatureSkeletonPreview type={feature.type} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold">{feature.title}</span>
            <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{feature.type}</span>
          </div>
        </>
      )}
    </article>
  );
}

function getFeatureInitials(feature) {
  return feature.title
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function FeatureSkeletonPreview({ type }) {
  if (type === "layout.grid") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 rounded-md border border-dashed p-2" style={{ borderColor: "var(--border)" }}>
          <div className="h-10 rounded" style={{ background: "var(--surface-muted)" }} />
          <div className="h-10 rounded" style={{ background: "var(--surface-muted)" }} />
          <div className="h-10 rounded" style={{ background: "var(--surface-muted)" }} />
          <div className="h-10 rounded" style={{ background: "var(--surface-muted)" }} />
        </div>
        <div className="mx-auto h-1 w-16 rounded" style={{ background: "var(--border-strong)" }} />
      </div>
    );
  }

  if (type === "layout.list") {
    return (
      <div className="space-y-2">
        <div className="flex flex-col gap-2 rounded-md border border-dashed p-2" style={{ borderColor: "var(--border)" }}>
          <div className="h-5 rounded" style={{ background: "var(--border-strong)" }} />
          <div className="h-5 rounded" style={{ background: "var(--surface-muted)" }} />
          <div className="h-5 rounded" style={{ background: "var(--surface-muted)" }} />
        </div>
        <div className="mx-auto h-1 w-16 rounded" style={{ background: "var(--border-strong)" }} />
      </div>
    );
  }

  if (type === "author.info") {
    return (
      <div className="flex items-center gap-3 rounded-md border p-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="h-11 w-11 rounded-full" style={{ background: "var(--border-strong)" }} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded" style={{ background: "var(--border-strong)" }} />
          <div className="h-2 w-1/2 rounded" style={{ background: "var(--surface-muted)" }} />
          <div className="flex gap-1.5">
            <div className="h-5 w-10 rounded-full" style={{ background: "var(--surface-muted)" }} />
            <div className="h-5 w-8 rounded-full" style={{ background: "var(--surface-muted)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (type === "media.photoCaption") {
    return (
      <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="h-20" style={{ background: "var(--border-strong)" }} />
        <div className="space-y-1.5 p-2">
          <div className="h-2.5 w-5/6 rounded" style={{ background: "var(--border-strong)" }} />
          <div className="h-2 w-1/2 rounded" style={{ background: "var(--surface-muted)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-3 w-2/3 rounded" style={{ background: "var(--border-strong)" }} />
      <div className="h-14 rounded" style={{ background: "var(--surface-muted)" }} />
      <div className="h-2 w-1/2 rounded" style={{ background: "var(--surface-muted)" }} />
    </div>
  );
}

function PendingMedia({ pendingAssets, onRemovePendingAsset }) {
  if (!pendingAssets.length) return null;

  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-normal text-stone-500">Pending media</h2>
      <div className="space-y-2">
        {pendingAssets.map((asset) => (
          <div key={asset.id} className="rounded-md border border-stone-200 bg-white p-2">
            <div className="flex gap-3">
              <img src={asset.previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-stone-900">{asset.fileName}</p>
                <p className="truncate font-mono text-[11px] text-stone-500">{asset.publicPath}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemovePendingAsset(asset.id)}
              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function EditablePreviewBlock({
  block,
  index,
  parentId,
  pendingAssets,
  selectedBlockId,
  dragTarget,
  onSelectBlock,
  onDragTarget,
  onEditBlock,
  onRemoveBlock,
  onDropItem,
}) {
  const feature = getFeature(block.type);

  if (!feature) {
    return (
      <section className="relative rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        Unknown block type: <span className="font-mono">{block.type}</span>
      </section>
    );
  }

  const ViewComponent = feature.ViewComponent;
  const isLayout = feature.acceptsChildren;
  const children = block.children || [];
  const dragPayload = JSON.stringify({ kind: "block", blockId: block.id, parentId, index });
  const previewState = replacePendingAssetReferences(block.state, pendingAssets);
  const marker = dragTarget?.kind !== "grid-cell" && dragTarget?.parentId === parentId
    ? getBlockMarker(index, dragTarget.index)
    : "";
  const isSelected = selectedBlockId === block.id;

  return (
    <section
      data-editor-block-item
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData(DRAG_DATA_TYPE, dragPayload);
        event.dataTransfer.setData("text/plain", dragPayload);
      }}
      onClick={(event) => {
        if (event.target.closest("[data-admin-control]")) return;
        event.preventDefault();
        event.stopPropagation();
        onSelectBlock(block.id);
      }}
      className={[
        "group relative cursor-grab rounded-lg border p-1.5 transition active:cursor-grabbing",
        isSelected ? "border-teal-400 bg-white/80" : "border-transparent hover:border-teal-300 hover:bg-white/70",
      ].join(" ")}
      title="Drag to reorder"
    >
      {marker ? <DropMarker placement={marker} /> : null}
      {isSelected ? (
        <div
          data-admin-control
          className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2"
        >
          <button
            type="button"
            onClick={() => onEditBlock(block.id)}
            className="ui-icon-button"
            title="Edit block"
            aria-label="Edit block"
          >
            <Icon name="settings" />
          </button>
          <button
            type="button"
            onClick={() => {
              onRemoveBlock(block.id);
              onSelectBlock("");
            }}
            className="ui-icon-button"
            title="Delete block"
            aria-label="Delete block"
          >
            <Icon name="trash" />
          </button>
        </div>
      ) : null}

      <div className="select-none">
        <ViewComponent
          state={previewState}
          surfaceProps={isLayout
            ? createLayoutSurfaceProps({
              block,
              children,
              dragTarget,
              onDragTarget,
              onDropItem,
            })
            : undefined}
        >
          {isLayout
            ? renderAdminLayoutChildren({
              block,
              children,
              dragTarget,
              onDragTarget,
              pendingAssets,
              selectedBlockId,
              onSelectBlock,
              onEditBlock,
              onRemoveBlock,
              onDropItem,
            })
            : null}
        </ViewComponent>
      </div>
    </section>
  );
}

function DragSurface({
  blocks,
  children,
  className,
  dragTarget,
  onDragTarget,
  onDropItem,
  parentId,
  style,
}) {
  const isActive = dragTarget?.parentId === parentId;

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        const index = getSequentialInsertionIndex(event.currentTarget, event, "vertical");
        onDragTarget({ parentId, index });
        event.dataTransfer.dropEffect = "move";
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onDragTarget(null);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = readDragPayload(event);
        const index = getSequentialInsertionIndex(event.currentTarget, event, "vertical");
        onDragTarget(null);
        if (payload) onDropItem(payload, parentId, index);
      }}
      className={[
        "relative rounded-lg transition",
        blocks.length ? "" : "min-h-40 border border-dashed border-stone-300 bg-white/70 p-10",
        isActive ? "outline outline-2 outline-teal-400/70" : "",
        className,
      ].join(" ")}
      style={style}
    >
      {blocks.length ? children : (
        <div className="flex min-h-24 items-center justify-center rounded-md text-xs font-bold text-teal-700">
          Drop here
        </div>
      )}
      {isActive && dragTarget.index === blocks.length ? <DropMarker placement="after" /> : null}
    </div>
  );
}

function createLayoutSurfaceProps({ block, children, dragTarget, onDragTarget, onDropItem }) {
  const isActive = dragTarget?.parentId === block.id;

  return {
    onDragEnter(event) {
      event.preventDefault();
      event.stopPropagation();
    },
    onDragOver(event) {
      event.preventDefault();
      event.stopPropagation();
      const target = block.type === "layout.grid"
        ? { kind: "grid-cell", parentId: block.id, cellIndex: getGridCellIndex(event.currentTarget, event, block) }
        : { parentId: block.id, index: getSequentialInsertionIndex(
          event.currentTarget,
          event,
          block.state.orientation === "horizontal" ? "horizontal" : "vertical",
        ) };
      onDragTarget(target);
      event.dataTransfer.dropEffect = canAcceptDragTarget(block, target) ? "move" : "none";
    },
    onDragLeave(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) onDragTarget(null);
    },
    onDrop(event) {
      event.preventDefault();
      event.stopPropagation();
      const payload = readDragPayload(event);
      const target = block.type === "layout.grid"
        ? { kind: "grid-cell", parentId: block.id, cellIndex: getGridCellIndex(event.currentTarget, event, block) }
        : getSequentialInsertionIndex(
          event.currentTarget,
          event,
          block.state.orientation === "horizontal" ? "horizontal" : "vertical",
        );
      onDragTarget(null);
      if (payload) onDropItem(payload, block.id, target);
    },
    className: [
      "relative transition",
      isActive ? "outline outline-2 outline-teal-400/70" : "",
      !children.length ? "min-h-28" : "",
    ].join(" "),
  };
}

function DropMarker({ placement }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "pointer-events-none absolute z-20 rounded-full bg-teal-500 shadow-[0_0_0_3px_rgb(20_184_166_/_0.18)]",
        placement === "before" ? "-top-1 left-2 right-2 h-1" : "",
        placement === "after" ? "-bottom-1 left-2 right-2 h-1" : "",
      ].join(" ")}
    />
  );
}

function renderAdminLayoutChildren({
  block,
  children,
  dragTarget,
  onDragTarget,
  pendingAssets,
  selectedBlockId,
  onSelectBlock,
  onEditBlock,
  onRemoveBlock,
  onDropItem,
}) {
  if (block.type === "layout.grid") {
    const capacity = getGridCapacity(block);
    const childrenByCell = new Map(
      children.map((childBlock, childIndex) => [
        getChildGridCell(childBlock, childIndex, capacity),
        { childBlock, childIndex },
      ]),
    );

    return Array.from({ length: capacity }, (_, cellIndex) => {
      const item = childrenByCell.get(cellIndex);
      const isTarget = dragTarget?.kind === "grid-cell" &&
        dragTarget.parentId === block.id &&
        dragTarget.cellIndex === cellIndex;

      return (
        <div
          key={`${block.id}-cell-${cellIndex}`}
          data-grid-cell={cellIndex}
          className={[
            "relative min-h-24 rounded-md transition",
            item ? "" : "border border-dashed border-stone-300/70",
            isTarget ? "outline outline-2 outline-teal-400" : "",
          ].join(" ")}
        >
          {item ? (
            <EditablePreviewBlock
              block={item.childBlock}
              index={item.childIndex}
              parentId={block.id}
              pendingAssets={pendingAssets}
              selectedBlockId={selectedBlockId}
              dragTarget={dragTarget}
              onSelectBlock={onSelectBlock}
              onDragTarget={onDragTarget}
              onEditBlock={onEditBlock}
              onRemoveBlock={onRemoveBlock}
              onDropItem={onDropItem}
            />
          ) : (
            <span className="pointer-events-none absolute inset-0 rounded-md bg-teal-50/0 transition" />
          )}
        </div>
      );
    });
  }

  return children.map((childBlock, childIndex) => (
    <EditablePreviewBlock
      key={childBlock.id}
      block={childBlock}
      index={childIndex}
      parentId={block.id}
      pendingAssets={pendingAssets}
      selectedBlockId={selectedBlockId}
      dragTarget={dragTarget}
      onSelectBlock={onSelectBlock}
      onDragTarget={onDragTarget}
      onEditBlock={onEditBlock}
      onRemoveBlock={onRemoveBlock}
      onDropItem={onDropItem}
    />
  ));
}

function getBlockMarker(blockIndex, targetIndex) {
  if (targetIndex === blockIndex) return "before";
  if (targetIndex === blockIndex + 1) return "after";
  return "";
}

function getSequentialInsertionIndex(container, event, orientation) {
  const items = getDirectDragItems(container);
  if (!items.length) return 0;

  const pointer = orientation === "horizontal" ? event.clientX : event.clientY;
  const index = items.findIndex((item) => {
    const rect = item.getBoundingClientRect();
    const center = orientation === "horizontal"
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2;
    return pointer < center;
  });

  return index === -1 ? items.length : index;
}

function getGridCellIndex(container, event, block) {
  const rect = container.getBoundingClientRect();
  const columns = Math.max(1, Number.parseInt(block.state.columns, 10) || 1);
  const rows = Math.max(1, Number.parseInt(block.state.rows, 10) || 1);
  const cellWidth = rect.width / columns;
  const cellHeight = rect.height / rows;
  const column = Math.max(0, Math.min(columns - 1, Math.floor((event.clientX - rect.left) / cellWidth)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor((event.clientY - rect.top) / cellHeight)));
  return row * columns + column;
}

function getDirectDragItems(container) {
  return Array.from(container.children).filter((item) => item.hasAttribute("data-editor-block-item"));
}

function canAcceptDrop(payload, parentBlock, target = null) {
  if (!payload) return false;
  if (!parentBlock || parentBlock.type !== "layout.grid") return true;
  if (target?.kind !== "grid-cell") return false;

  const occupant = findGridCellOccupant(parentBlock, target.cellIndex);
  const isMovingSameBlock = payload.kind === "block" && occupant?.id === payload.blockId;

  return !occupant || isMovingSameBlock;
}

function canAcceptDragTarget(parentBlock, target = null) {
  if (!parentBlock || parentBlock.type !== "layout.grid") return true;
  if (target?.kind !== "grid-cell") return false;

  return !findGridCellOccupant(parentBlock, target.cellIndex);
}

function findGridCellOccupant(block, cellIndex) {
  return (block.children || []).find((childBlock, childIndex) => (
    getChildGridCell(childBlock, childIndex, getGridCapacity(block)) === cellIndex
  ));
}

function getBlockGridCell(blockId, parentBlock) {
  if (!parentBlock) return null;
  const childIndex = (parentBlock.children || []).findIndex((childBlock) => childBlock.id === blockId);
  if (childIndex < 0) return null;
  return getChildGridCell(parentBlock.children[childIndex], childIndex, getGridCapacity(parentBlock));
}

function getChildGridCell(block, fallbackIndex, capacity) {
  const gridCell = block.placement?.gridCell;
  if (!Number.isInteger(gridCell)) return fallbackIndex;
  return Math.max(0, Math.min(capacity - 1, gridCell));
}

function getGridCapacity(block) {
  const rows = Math.max(1, Number.parseInt(block.state.rows, 10) || 1);
  const columns = Math.max(1, Number.parseInt(block.state.columns, 10) || 1);
  return rows * columns;
}

function readDragPayload(event) {
  try {
    const rawPayload = event.dataTransfer.getData(DRAG_DATA_TYPE) || event.dataTransfer.getData("text/plain");
    if (rawPayload && !rawPayload.startsWith("{")) {
      return { kind: "feature", type: rawPayload };
    }

    return rawPayload ? JSON.parse(rawPayload) : null;
  } catch {
    return null;
  }
}

function replacePendingAssetReferences(value, pendingAssets) {
  if (!pendingAssets.length) return value;

  const previewByPublicPath = new Map(
    pendingAssets.map((asset) => [asset.publicPath, asset.previewUrl]),
  );

  return replaceValue(value);

  function replaceValue(item) {
    if (typeof item === "string") return previewByPublicPath.get(item) || item;
    if (Array.isArray(item)) return item.map(replaceValue);
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item).map(([key, child]) => [key, replaceValue(child)]),
      );
    }

    return item;
  }
}

function findBlockById(blocks, blockId) {
  if (!blockId) return null;

  for (const block of blocks) {
    if (block.id === blockId) return block;
    const childBlock = findBlockById(block.children || [], blockId);
    if (childBlock) return childBlock;
  }

  return null;
}

function BlockSettingsModal({ block, pendingAssets, onCommit, onClose, onRemove }) {
  const feature = getFeature(block.type);
  const [draftState, setDraftState] = useState(() => structuredClone(block.state));
  const [draftAssets, setDraftAssets] = useState([]);
  if (!feature) return null;

  const EditorComponent = feature.EditorComponent;
  const mergedPendingAssets = [...pendingAssets, ...draftAssets];

  async function stageDraftAsset(file) {
    const asset = await stageImageFile(file);
    if (!asset) return null;
    setDraftAssets((current) => [...current, asset]);
    return asset;
  }

  function cancelEditor() {
    draftAssets.forEach(revokePendingAsset);
    onClose();
  }

  function commitEditor() {
    const usedPublicPaths = new Set(collectLocalMediaPaths(draftState));
    const usedAssets = draftAssets.filter((asset) => usedPublicPaths.has(asset.publicPath));
    draftAssets
      .filter((asset) => !usedPublicPaths.has(asset.publicPath))
      .forEach(revokePendingAsset);

    onCommit(block.id, draftState, usedAssets);
    onClose();
  }

  function removeBlock() {
    draftAssets.forEach(revokePendingAsset);
    onRemove();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <section className="ui-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal" style={{ color: "var(--text-muted)" }}>Block settings</p>
            <h2 className="text-lg font-bold">{feature.title}</h2>
            <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{block.type}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={removeBlock}
              className="ui-icon-button"
              title="Delete block"
              aria-label="Delete block"
            >
              <Icon name="trash" />
            </button>
            <button
              type="button"
              onClick={commitEditor}
              className="ui-icon-button"
              title="Apply changes"
              aria-label="Apply changes"
            >
              <Icon name="check" />
            </button>
            <button
              type="button"
              onClick={cancelEditor}
              className="ui-icon-button"
              title="Cancel"
              aria-label="Cancel"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <EditorComponent
          state={draftState}
          pendingAssets={mergedPendingAssets}
          stageAsset={stageDraftAsset}
          onChange={setDraftState}
        />
      </section>
    </div>
  );
}

function Icon({ name }) {
  const commonProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    save: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M17 21v-8H7v8" />
        <path d="M7 3v5h8" />
      </>
    ),
    moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ),
    "log-out": (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
    grip: (
      <>
        <circle cx="9" cy="6" r="1" />
        <circle cx="15" cy="6" r="1" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="9" cy="18" r="1" />
        <circle cx="15" cy="18" r="1" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 5 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 5a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.43.18.8.45 1 .86.2.34.4.74.4 1.14V11a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
      </>
    ),
    check: <path d="m20 6-11 11-5-5" />,
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    "sidebar-close": (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
        <path d="m16 10-2 2 2 2" />
      </>
    ),
    "sidebar-open": (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
        <path d="m14 10 2 2-2 2" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}
