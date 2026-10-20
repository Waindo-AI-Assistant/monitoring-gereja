import "./history.css";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <div className="history-site">{children}<footer className="history-site-footer"><span>Gereja Gerakan Pentakosta</span><p>Merawat ingatan. Meneruskan pelayanan.</p></footer></div>;
}
