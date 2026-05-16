export default function Nav() {
  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-baseline gap-4">
        <span className="font-mono text-lg font-bold text-green-400 tracking-tight">
          Nexus Telemetry Simulator
        </span>
        <span className="text-xs text-gray-500 font-mono">CDP Physical Event Demo</span>
      </div>
    </nav>
  );
}
