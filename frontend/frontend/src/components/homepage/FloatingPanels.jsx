// Purely illustrative UI dressing for the hero visual — not wired to any API.
const PANELS = [
    { id: "risk", label: "Risk Score", value: "0.52", note: "MEDIUM · Illustrative", accent: "violet", pos: "tl" },
    { id: "value", label: "Recovery Value", value: "₹8,000", note: "Expected · Illustrative", accent: "cyan", pos: "br" }
];

function FloatingPanels() {
    return (
        <div className="rr-float-panels" aria-hidden="true">
            {PANELS.map((p) => (
                <div key={p.id} className={`rr-float-panel accent-${p.accent} pos-${p.pos}`}>
                    <div className="rr-float-panel-label">{p.label}</div>
                    <div className="rr-float-panel-value rr-num">{p.value}</div>
                    <div className="rr-float-panel-note">{p.note}</div>
                </div>
            ))}
        </div>
    );
}

export default FloatingPanels;