import "./history.css";
import HistoryFooter from "@/components/history/HistoryFooter";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <div className="history-site">{children}<HistoryFooter /></div>;
}
