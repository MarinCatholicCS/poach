// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResultsScreen({ results, onRestart }: { results: Record<string, any> | null; onRestart: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-2xl font-black">Results placeholder</p>
      <pre className="text-xs text-gray-500 max-w-xl overflow-auto max-h-96">
        {JSON.stringify(results, null, 2)}
      </pre>
      <button onClick={onRestart} className="px-6 py-3 bg-white text-black rounded-xl font-bold">
        Start Over
      </button>
    </div>
  )
}
