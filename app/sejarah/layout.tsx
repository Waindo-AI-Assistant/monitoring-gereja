import "./history.css";
import SiteFooter from "@/components/layout/SiteFooter";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <div className="history-site">{children}<SiteFooter /></div>;
}
