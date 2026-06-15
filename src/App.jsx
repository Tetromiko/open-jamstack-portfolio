import { usePortfolioApp } from "./application/usePortfolioApp";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminLogin } from "./components/admin/AdminLogin";
import { PublicProfile } from "./components/public/PublicProfile";
import { Alert } from "./components/ui/Alert";

export default function App() {
  const {
    auth,
    canSave,
    canonicalAdminUrl,
    data,
    isAdminRoute,
    lastPublish,
    message,
    pendingAssets,
    requiresPat,
    runtimeMode,
    showDashboard,
    status,
    actions,
  } = usePortfolioApp();

  if (!isAdminRoute) {
    return <PublicProfile status={status} message={message} data={data} />;
  }

  if (showDashboard) {
    return (
      <main data-theme={data.site.theme} className="site-page min-h-screen">
        <AdminDashboard
          data={data}
          onBlockCommit={actions.handleBlockCommit}
          onAddBlock={actions.handleAddBlock}
          onMoveBlock={actions.handleMoveBlock}
          onRemoveBlock={actions.handleRemoveBlock}
          onRemovePendingAsset={actions.handleRemovePendingAsset}
          pendingAssets={pendingAssets}
          theme={data.site.theme}
          onThemeChange={actions.handleThemeChange}
          onSave={actions.handleSave}
          onLogout={actions.handleLogout}
          savedRepo={auth.repo}
          savedBranch={auth.branch}
          status={status}
          message={message}
          requiresPat={requiresPat}
          canSave={canSave}
          lastPublish={lastPublish}
        />
      </main>
    );
  }

  return (
    <main className="site-page min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-normal md:text-3xl">Portfolio Admin</h1>
          <p className="text-sm text-stone-600">
            Mode: <span className="font-mono">{runtimeMode}</span>
            <span className="mx-2 text-stone-300">/</span>
            URL: <code>{canonicalAdminUrl}</code>
          </p>
        </header>

        <Alert status={status} message={message} />

        {!data ? (
          <section className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
            Завантаження даних портфоліо...
          </section>
        ) : (
          <AdminLogin
            onLogin={actions.handleLogin}
            autoRepo={auth.repo}
            defaultBranch={auth.branch}
            status={status}
          />
        )}
      </div>
    </main>
  );
}
