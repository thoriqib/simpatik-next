/** Menampilkan pesan sukses/error dari searchParams (pengganti session flash Laravel) */
export function FlashMessage({ success, error, warning }: { success?: string; error?: string; warning?: string }) {
    return (
        <div className="px-6 pt-4 space-y-3">
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
            )}
            {warning && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">{warning}</div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}
        </div>
    );
}
