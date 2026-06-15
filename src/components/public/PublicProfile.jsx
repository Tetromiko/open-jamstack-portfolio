import { getFeature } from "../../features/registry";
import { getHomePage } from "../../utils/validation";

export function PublicProfile({ status, message, data }) {
  if (status === "loading" && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-500">
        <span className="text-sm font-medium">Завантаження сайту...</span>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-stone-700">
        <p className="max-w-md text-center text-sm">{message || "Документ сайту ще не завантажений."}</p>
      </main>
    );
  }

  const page = getHomePage(data);

  return (
    <main data-theme={data.site.theme} className="site-page min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col justify-center gap-10">
        {page.blocks.map((block) => (
          <PublicBlock key={block.id} block={block} />
        ))}
      </div>
    </main>
  );
}

function PublicBlock({ block }) {
  const feature = getFeature(block.type);

  if (!feature) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        Unknown block type: <span className="font-mono">{block.type}</span>
      </section>
    );
  }

  const ViewComponent = feature.ViewComponent;
  return (
    <ViewComponent state={block.state}>
      {feature.acceptsChildren
        ? renderPublicLayoutChildren(block)
        : null}
    </ViewComponent>
  );
}

function renderPublicLayoutChildren(block) {
  const children = block.children || [];
  if (block.type !== "layout.grid") {
    return children.map((childBlock) => <PublicBlock key={childBlock.id} block={childBlock} />);
  }

  const columns = Math.max(1, Number.parseInt(block.state.columns, 10) || 1);
  return children.map((childBlock, childIndex) => {
    const cellIndex = Number.isInteger(childBlock.placement?.gridCell)
      ? childBlock.placement.gridCell
      : childIndex;

    return (
      <div key={childBlock.id} style={getGridCellStyle(cellIndex, columns)}>
        <PublicBlock block={childBlock} />
      </div>
    );
  });
}

function getGridCellStyle(cellIndex, columns) {
  return {
    gridColumn: `${(cellIndex % columns) + 1}`,
    gridRow: `${Math.floor(cellIndex / columns) + 1}`,
  };
}
