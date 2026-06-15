export function Alert({ status, message }) {
  if (!message) return null;

  const styles = {
    loading: "border-sky-200 bg-sky-50 text-sky-900",
    "auth-checking": "border-amber-200 bg-amber-50 text-amber-900",
    saving: "border-teal-200 bg-teal-50 text-teal-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
    idle: "border-stone-200 bg-white text-stone-700",
  };

  const showSpinner = status === "loading" || status === "saving" || status === "auth-checking";

  return (
    <div className={`rounded-lg border p-3 text-sm shadow-sm ${styles[status] || styles.idle}`}>
      <div className="flex items-center gap-2">
        {showSpinner ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
