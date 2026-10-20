"use client";
import { useTranslation } from "react-i18next";
import { historyText } from "@/lib/history-copy";

export default function HistoryFooter() {
  const { i18n } = useTranslation();
  return <footer className="history-site-footer"><span>Gereja Gerakan Pentakosta</span><p>{historyText("Merawat ingatan. Meneruskan pelayanan.", i18n.language === "en")}</p></footer>;
}
