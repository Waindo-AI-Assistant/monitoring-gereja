"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_BASEMAP_ID, LAYERS, ATTRIBUTE_LABELS, GEREJA_ORDERED_FIELDS, formatValue, getAttributeLabel, type LayerId } from "@/config/dashboard";
import {
  ALL,
  ALL_KHUSUS,
  DEFAULT_FILTERS,
  formatArea,
  type Filters,
} from "@/lib/stats";
import type { MapHandle, MapTool, MeasureResult } from "@/components/map/MapView";
import MapControls from "@/components/ui/MapControls";
import { calculateRoute, getGoogleMapsDirectionsUrl, type RouteResult } from "@/lib/routing";
import SummaryCards from "./SummaryCards";
import FilterBar from "./FilterBar";
import LayerControl from "./LayerControl";
import RouteInfoCard from "./RouteInfoCard";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

// Leaflet menyentuh `window` saat modul dievaluasi, jadi peta tidak boleh
// ikut render di server.
const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

const DEFAULT_VISIBLE = Object.fromEntries(
  LAYERS.map((l) => [l.id, l.defaultVisible]),
) as Record<LayerId, boolean>;

/** Di bawah lebar ini panel menutupi peta, jadi lebih baik mulai tertutup. */
const WIDE_SCREEN_QUERY = "(min-width: 1024px)";

/**
 * Berlangganan ke media query lewat useSyncExternalStore, bukan setState di
 * dalam useEffect: lebar layar adalah state milik browser, jadi React cukup
 * membacanya. Cara ini juga bebas hydration mismatch — server memakai snapshot
 * "layar lebar" dan client menyesuaikan sendiri setelah hydrate.
 */
function useIsWideScreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(WIDE_SCREEN_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE_SCREEN_QUERY).matches,
    () => true,
  );
}

/** Helper untuk mengekstrak foto dari properties */
function extractPhotos(properties: Record<string, any>): string[] {
  const photosRaw = properties.photos;
  let photos: string[] = [];
  if (Array.isArray(photosRaw)) {
    photos = photosRaw;
  } else if (typeof photosRaw === "string" && photosRaw.trim() !== "") {
    try {
      photos = JSON.parse(photosRaw);
    } catch {
      photos = [photosRaw];
    }
  }

  if (photos.length === 0) {
    const imgKey = Object.keys(properties).find((k) =>
      ["foto", "photo", "image", "gambar", "image_url", "url_foto"].includes(k.toLowerCase())
    );
    if (imgKey && properties[imgKey]) {
      photos = [String(properties[imgKey])];
    }
    const imgKey2 = Object.keys(properties).find((k) =>
      ["foto_2", "photo_2", "image_2", "foto2"].includes(k.toLowerCase())
    );
    if (imgKey2 && properties[imgKey2]) {
      photos.push(String(properties[imgKey2]));
    }
  }
  return photos;
}

interface ChurchMediaBannerProps {
  readonly properties: Record<string, any>;
  readonly coverIndex: number;
  readonly setCoverIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly onOpenPhotoModal: (urls: string[], index: number) => void;
}

function ChurchMediaBanner({
  properties,
  coverIndex,
  setCoverIndex,
  onOpenPhotoModal,
}: ChurchMediaBannerProps) {
  const photos = extractPhotos(properties);

  const pastorImgKey = Object.keys(properties).find((k) =>
    ["foto_pendeta", "photo_pendeta", "foto_pastor", "photo_pastor", "pastor_photo", "pastor_image"].includes(k.toLowerCase())
  );
  const pastorImageUrl = pastorImgKey ? String(properties[pastorImgKey]) : null;

  const pastorNameKey = Object.keys(properties).find((k) =>
    ["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase())
  );
  const pastorName = pastorNameKey ? String(properties[pastorNameKey]) : null;

  if (photos.length === 0 && !pastorImageUrl && !pastorName) return null;

  return (
    <div className="relative w-full h-48 bg-slate-100 border-b border-slate-200 group">
      {photos.length > 0 && (
        <div className="relative w-full h-full overflow-hidden">
          <button
            type="button"
            className="w-full h-full p-0 border-0 bg-transparent text-left cursor-pointer focus:outline-none"
            onClick={() => onOpenPhotoModal(photos, coverIndex)}
          >
            <img
              src={photos[coverIndex]}
              alt="Foto Detail"
              className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCoverIndex((prev) => (prev - 1 + photos.length) % photos.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100 duration-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCoverIndex((prev) => (prev + 1) % photos.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100 duration-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-[9px] text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                {coverIndex + 1} / {photos.length}
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {photos.map((url, i) => (
                  <button
                    key={`photo-bullet-${url.slice(0, 10)}-${i}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverIndex(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === coverIndex ? "bg-white scale-125 shadow-sm" : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div
        className="absolute bottom-0 left-6 transform translate-y-1/2 z-20"
        title={pastorName ? `Pendeta: ${pastorName}` : "Pendeta"}
      >
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center">
          {pastorImageUrl ? (
            <button
              type="button"
              className="w-full h-full p-0 border-0 bg-transparent text-left cursor-pointer focus:outline-none"
              onClick={() => {
                const urls = [...photos, pastorImageUrl];
                onOpenPhotoModal(urls, urls.length - 1);
              }}
            >
              <img
                src={pastorImageUrl}
                alt={pastorName || "Foto Pendeta"}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = "none";
                }}
              />
            </button>
          ) : (
            <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChurchAttributesTableProps {
  readonly layerLabel: string;
  readonly properties: Record<string, any>;
}

function ChurchAttributesTable({ layerLabel, properties }: ChurchAttributesTableProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  if (layerLabel === "Titik Gereja" || layerLabel === "Church Locations") {
    const isKhusus =
      properties.tipe_wilayah === "Wilayah Khusus" ||
      Boolean(properties.daerah_khusus && String(properties.daerah_khusus).trim() !== "") ||
      Boolean(properties.wilayah_khusus && String(properties.wilayah_khusus).trim() !== "") ||
      String(properties.nama_mada || "").toUpperCase().includes("KHUSUS");

    const effectiveProps: Record<string, any> = {
      ...properties,
      daerah_khusus: properties.daerah_khusus || (isKhusus ? properties.nama_mada : ""),
      wilayah_khusus: properties.wilayah_khusus || (isKhusus && properties.mawil && properties.mawil !== " " ? properties.mawil : ""),
    };

    return (
      <table className="w-full text-left">
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-2 pr-3 text-[10px] font-medium uppercase text-slate-400 align-top">
              {isEn ? "Region Category" : "Tipe Wilayah"}
            </td>
            <td className="py-2 text-xs font-semibold text-right">
              {isKhusus ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {isEn ? "Special Territory" : "Wilayah Khusus"}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {isEn ? "Regular Territory" : "Wilayah Biasa"}
                </span>
              )}
            </td>
          </tr>

          {GEREJA_ORDERED_FIELDS.filter((k) => {
            if (k === "tipe_wilayah") return false;
            const val = effectiveProps[k];
            if (val === undefined || val === null || String(val).trim() === "" || String(val).trim() === '""') {
              return false;
            }
            if (
              k.toLowerCase().includes("foto") ||
              k.toLowerCase().includes("photo") ||
              k.toLowerCase().includes("image") ||
              k.toLowerCase().includes("gambar") ||
              k.toLowerCase().includes("pendeta") ||
              k.toLowerCase().includes("pastor")
            ) {
              return false;
            }

            if (isKhusus) {
              if (k === "nama_mada") return false;
              if (k === "mawil") return false;
            } else {
              if (k === "daerah_khusus" || k === "wilayah_khusus") return false;
            }

            return true;
          }).map((k) => {
            const label = getAttributeLabel(k, isEn);
            const displayVal = formatValue(effectiveProps[k], k);
            return (
              <tr key={k} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 text-[10px] font-medium uppercase text-slate-400 align-top">
                  {label}
                </td>
                <td className="py-2 text-xs font-semibold text-slate-800 text-right">
                  {displayVal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full text-left">
      <tbody>
        {Object.entries(properties)
          .filter(
            ([k, v]) =>
              v !== undefined &&
              v !== null &&
              v !== "" &&
              !k.startsWith("_") &&
              !k.toLowerCase().includes("foto") &&
              !k.toLowerCase().includes("photo") &&
              !k.toLowerCase().includes("image") &&
              !k.toLowerCase().includes("gambar")
          )
          .map(([k, v]) => {
            const label = getAttributeLabel(k, isEn);
            const displayVal = formatValue(v, k);
            return (
              <tr key={k} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 text-[10px] font-medium uppercase text-slate-400 align-top">
                  {label}
                </td>
                <td className="py-2 text-xs font-semibold text-slate-800 text-right">
                  {displayVal}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

interface ChurchDetailDrawerProps {
  readonly selectedFeature: {
    properties: Record<string, any>;
    layerLabel: string;
  } | null;
  readonly coverIndex: number;
  readonly setCoverIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly onClose: () => void;
  readonly onOpenPhotoModal: (urls: string[], index: number) => void;
  readonly onGetRoute?: (props: any) => void;
  readonly isRoutingLoading?: boolean;
}

function ChurchDetailDrawer({
  selectedFeature,
  coverIndex,
  setCoverIndex,
  onClose,
  onOpenPhotoModal,
  onGetRoute,
  isRoutingLoading,
}: ChurchDetailDrawerProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const pastorNameKey = selectedFeature
    ? Object.keys(selectedFeature.properties).find((k) =>
        ["pendeta", "nama_pendeta", "pastor", "nama_pastor", "priest", "pimpinan"].includes(k.toLowerCase())
      )
    : null;
  const pastorName = pastorNameKey && selectedFeature ? String(selectedFeature.properties[pastorNameKey]) : null;

  const getDrawerLayerLabel = () => {
    if (!selectedFeature) return "";
    if (selectedFeature.layerLabel === "Titik Gereja") return t("dashboard.church_point") || "Titik Gereja";
    if (selectedFeature.layerLabel === "Batas Mada") return isEn ? "Regional Boundaries (MADA)" : "Batas Mada";
    if (selectedFeature.layerLabel === "Batas Wilayah") return isEn ? "District Boundaries (MAWIL)" : "Batas Wilayah";
    return selectedFeature.layerLabel;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {selectedFeature && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-1150 bg-slate-900/40 backdrop-blur-xs sm:hidden transition-opacity cursor-pointer"
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-1200 max-h-[85vh] sm:top-0 sm:right-0 sm:bottom-0 sm:inset-x-auto sm:w-96 sm:max-h-none rounded-t-3xl sm:rounded-none bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
          selectedFeature
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none"
        }`}
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {selectedFeature ? (
          <>
            {/* Header Laci */}
            <div className="flex items-center justify-between bg-blue-950 p-4 rounded-t-2xl sm:rounded-none text-white">
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-300">
                {getDrawerLayerLabel()}
              </span>
              <h2 className="text-sm font-bold truncate">
                {selectedFeature.properties.name || selectedFeature.properties.nama || t("dashboard.detail_object") || "Detail Objek"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? "Close Details" : "Tutup Detail"}
              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Foto Detail & Avatar Pendeta */}
          <ChurchMediaBanner
            properties={selectedFeature.properties}
            coverIndex={coverIndex}
            setCoverIndex={setCoverIndex}
            onOpenPhotoModal={onOpenPhotoModal}
          />

          {/* Konten Detail */}
          <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-4 thin-scroll">
            {/* Tombol Rute Tercepat / Petunjuk Arah */}
            {onGetRoute && (selectedFeature.layerLabel === "Titik Gereja" || selectedFeature.properties.name) ? (
              <button
                type="button"
                onClick={() => onGetRoute(selectedFeature.properties)}
                disabled={isRoutingLoading}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-60"
              >
                {isRoutingLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>{t("dashboard.finding_route") || "Mencari Rute Tercepat..."}</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    <span>{t("dashboard.directions_btn") || "Petunjuk Arah & Rute Tercepat"}</span>
                  </>
                )}
              </button>
            ) : null}

            {pastorName ? (
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  {t("dashboard.pastor") || "Gembala Sidang / Pendeta"}
                </span>
                <p className="text-sm font-bold text-blue-950 mt-0.5">
                  {pastorName}
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <ChurchAttributesTable
                layerLabel={selectedFeature.layerLabel}
                properties={selectedFeature.properties}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <p className="text-xs">{t("dashboard.drawer_empty") || "Pilih titik pada peta untuk melihat detail"}</p>
        </div>
      )}
    </div>
    </>
  );
}

interface DashboardHeaderProps {
  readonly hasManagementAccess: boolean;
  readonly sidebarOpen: boolean;
  readonly onToggleSidebar: () => void;
  readonly mobileNavOpen: boolean;
  readonly onToggleMobileNav: () => void;
  readonly summary?: {
    jumlahMada: number;
    jumlahWilayah: number;
    totalGereja: number;
    gerejaTerfilter: number;
  };
  readonly onResetFilters?: () => void;
}

function DashboardHeader({
  hasManagementAccess,
  sidebarOpen,
  onToggleSidebar,
  mobileNavOpen,
  onToggleMobileNav,
  summary,
  onResetFilters,
}: DashboardHeaderProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <>
      <header className="h-16 sm:h-[72px] shrink-0 bg-[#0f1d3d] px-3 sm:px-4 lg:px-8 flex items-center justify-between shadow-md relative z-[1000]">
        {/* Kiri: Brand GGP */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-2 sm:mr-4">
          {/* Logo & Judul Dashboard */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1 group text-white">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/images/Logo GGP2.png"
                alt="Logo GGP"
                className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight truncate block">
                Gereja Gerakan Pentakosta
              </span>
              <span className="hidden sm:block text-[10px] text-slate-300 font-medium truncate">
                {t("dashboard.subtitle") || "Dashboard Pemetaan Geospasial"}
              </span>
            </div>
          </Link>
        </div>

        {/* Kanan - Layar Desktop (lg+): Menu Navigasi Lengkap */}
        <div className="hidden lg:flex items-center gap-1 lg:gap-2 shrink-0">
          <Link
            href="/"
            className="landing-navbar__link text-xs px-2.5 lg:px-3.5 py-1.5"
          >
            {t("nav.home") || "Beranda"}
          </Link>

          <Link
            href="/pengurus"
            className="landing-navbar__link text-xs px-2.5 lg:px-3.5 py-1.5"
          >
            {t("nav.leadership") || "Pengurus Pusat"}
          </Link>

          <Link
            href="/dashboard"
            className="landing-navbar__link landing-navbar__link--active text-xs px-2.5 lg:px-3.5 py-1.5"
          >
            {t("nav.dashboard") || "Dashboard"}
          </Link>

          {hasManagementAccess && (<Link
            href="/admin"
            className="landing-navbar__link text-xs px-2.5 lg:px-3.5 py-1.5"
          >
            {t("nav.admin") || "Admin"}
          </Link>)}
          <button type="button" onClick={async () => {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (response.ok) window.location.assign("/admin");
          }} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer">{isEn ? "Sign out" : "Keluar"}</button>


          <div className="ml-1 pl-1 border-l border-white/10">
            <LanguageSwitcher variant="compact" />
          </div>
        </div>

        {/* Kanan - Layar Mobile (< lg): Tombol Hamburger Menu Buka/Tutup */}
        <div className="flex lg:hidden items-center shrink-0">
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label={mobileNavOpen ? (isEn ? "Close navigation menu" : "Tutup menu navigasi") : (isEn ? "Open navigation menu" : "Buka menu navigasi")}
            aria-expanded={mobileNavOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer border ${
              mobileNavOpen
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 border-blue-500"
                : "bg-white/10 text-white hover:bg-white/20 border-white/15"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ======================= MOBILE NAVIGATION DRAWER & BACKDROP (< lg) ======================= */}
      {/* Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={onToggleMobileNav}
          className="fixed inset-0 z-[1300] bg-slate-950/65 backdrop-blur-xs transition-opacity lg:hidden cursor-pointer animate-fade-in"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[1310] w-[300px] max-w-[85vw] bg-[#0c1731] border-l border-white/10 shadow-2xl flex flex-col p-5 text-white transition-transform duration-300 ease-out lg:hidden overflow-y-auto thin-scroll ${
          mobileNavOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/Logo GGP2.png"
              alt="Logo GGP"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                Gereja Gerakan Pentakosta
              </span>
              <span className="text-[10px] text-blue-300 block">
                {isEn ? "Navigation Menu" : "Menu Navigasi"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label={isEn ? "Close navigation menu" : "Tutup menu navigasi"}
            className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List Navigasi */}
        <div className="py-4 space-y-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">
            {isEn ? "Page Navigation" : "Navigasi Halaman"}
          </span>

          <Link
            href="/"
            onClick={onToggleMobileNav}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-blue-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>{t("nav.home") || "Beranda"}</span>
          </Link>

          <Link
            href="/pengurus"
            onClick={onToggleMobileNav}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-emerald-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span>{t("nav.leadership") || "Pengurus Pusat"}</span>
          </Link>

          <Link
            href="/dashboard"
            onClick={onToggleMobileNav}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-white shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <div className="flex items-center justify-between flex-1">
              <span>{t("nav.dashboard") || "Dashboard"}</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">{isEn ? "Active" : "Aktif"}</span>
            </div>
          </Link>

          {hasManagementAccess && (<Link
            href="/admin"
            onClick={onToggleMobileNav}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-amber-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>{t("nav.admin") || "Admin"}</span>
          </Link>)}
          <button type="button" onClick={async () => {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (response.ok) window.location.assign("/admin");
          }} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer">{isEn ? "Sign out" : "Keluar"}</button>


          {/* Pengalih Bahasa di Drawer */}
          <div className="pt-3 mt-3 border-t border-white/10 px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Bahasa / Language
            </span>
            <LanguageSwitcher variant="compact" />
          </div>

          {/* Ringkasan Statistik KPI */}
          {summary && (
            <div className="pt-3 mt-3 border-t border-white/10 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
                {t("nav.quick_stats") || "Statistik Geospasial"}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">{t("dashboard.stats_church") || "Total Gereja"}</span>
                  <span className="text-base font-black text-white font-mono">{summary.totalGereja}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">{t("dashboard.stats_filtered") || "Terfilter"}</span>
                  <span className="text-base font-black text-blue-400 font-mono">{summary.gerejaTerfilter}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">{t("dashboard.stats_mada") || "Majelis Daerah"}</span>
                  <span className="text-sm font-bold text-white font-mono">{summary.jumlahMada}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">{t("dashboard.stats_mawil") || "Majelis Wilayah"}</span>
                  <span className="text-sm font-bold text-white font-mono">{summary.jumlahWilayah}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pintasan Aksi Cepat */}
          <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
            <button
              type="button"
              onClick={() => {
                onToggleMobileNav();
                onToggleSidebar();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-300 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                </svg>
                <span>{sidebarOpen ? (isEn ? "Close Layer Panel" : "Tutup Panel Layer") : (isEn ? "Open Layer Panel" : "Buka Panel Layer")}</span>
              </span>
              <span className="text-[10px] text-blue-300 font-bold uppercase">Layer</span>
            </button>

            {onResetFilters && (
              <button
                type="button"
                onClick={() => {
                  onToggleMobileNav();
                  onResetFilters();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>{t("dashboard.reset_map") || "Reset Tampilan Peta"}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{t("dashboard.reset") || "Reset"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface MapToolOverlayBadgesProps {
  readonly layerLoading: boolean;
  readonly activeTool: MapTool;
  readonly measure: MeasureResult;
  readonly poiError: string | null;
  readonly onCloseTool: () => void;
}

function MapToolOverlayBadges({
  layerLoading,
  activeTool,
  measure,
  poiError,
  onCloseTool,
}: MapToolOverlayBadgesProps) {
  const { t } = useTranslation();

  return (
    <>
      {layerLoading ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-400 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-xs">
          {t("dashboard.loading_layer") || "Memuat layer…"}
        </div>
      ) : null}

      {activeTool === "zoombox" ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-400 -translate-x-1/2 rounded-2xl bg-white px-4 py-2 shadow-xs">
          <p className="text-[11px] text-slate-500">
            {t("dashboard.zoombox_hint") || "Tarik kotak di peta untuk memperbesar ke area tersebut."}
          </p>
        </div>
      ) : null}

      {activeTool === "measure" ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-400 -translate-x-1/2 rounded-2xl bg-white px-4 py-2 shadow-xs">
          {measure && measure.points > 0 ? (
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-slate-500">
                {t("dashboard.distance") || "Jarak"}{" "}
                <strong className="font-mono text-slate-800">
                  {formatArea(measure.distanceM / 1000)} km
                </strong>
              </span>
              {measure.points >= 3 ? (
                <span className="text-[11px] text-slate-500">
                  {t("dashboard.area") || "Luas"}{" "}
                  <strong className="font-mono text-slate-800">
                    {formatArea(measure.areaM2 / 10000)} ha
                  </strong>
                </span>
              ) : null}
              <button
                type="button"
                onClick={onCloseTool}
                className="pointer-events-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                {t("dashboard.done") || "Selesai"}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              {t("dashboard.measure_hint") || "Klik pada peta untuk mulai mengukur. Klik titik lagi untuk menambah segmen, klik ganda atau tombol Selesai untuk mengakhiri."}
            </p>
          )}
        </div>
      ) : null}

      {poiError ? (
        <div className="pointer-events-auto absolute bottom-3 right-3 z-400 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700 shadow-xs">
          {poiError}
        </div>
      ) : null}
    </>
  );
}

interface PhotoLightboxModalProps {
  readonly activePhotoModal: {
    readonly urls: string[];
    readonly currentIndex: number;
  } | null;
  readonly isPlaying: boolean;
  readonly onTogglePlaying: () => void;
  readonly onClose: () => void;
  readonly onNavigate: (direction: "prev" | "next") => void;
}

function PhotoLightboxModal({
  activePhotoModal,
  isPlaying,
  onTogglePlaying,
  onClose,
  onNavigate,
}: PhotoLightboxModalProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  if (!activePhotoModal) return null;

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        {activePhotoModal.urls.length > 1 && (
          <button
            type="button"
            onClick={onTogglePlaying}
            title={isPlaying ? (isEn ? "Pause Autoplay" : "Jeda Putar Otomatis") : (isEn ? "Play Autoplay" : "Putar Otomatis")}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? "Close photo viewer" : "Tutup peninjau foto"}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {activePhotoModal.urls.length > 1 && (
        <button
          type="button"
          onClick={() => onNavigate("prev")}
          aria-label={isEn ? "Previous photo" : "Foto sebelumnya"}
          className="absolute left-4 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl bg-slate-900 flex items-center justify-center">
        <img
          src={activePhotoModal.urls[activePhotoModal.currentIndex]}
          alt={`${isEn ? "Photo" : "Foto"} ${activePhotoModal.currentIndex + 1}`}
          className="max-h-[85vh] max-w-[90vw] object-contain select-none"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {activePhotoModal.currentIndex + 1} / {activePhotoModal.urls.length}
        </div>
      </div>

      {activePhotoModal.urls.length > 1 && (
        <button
          type="button"
          onClick={() => onNavigate("next")}
          aria-label={isEn ? "Next photo" : "Foto selanjutnya"}
          className="absolute right-4 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function DashboardShell({ hasManagementAccess = false }: { hasManagementAccess?: boolean }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const mapRef = useRef<MapHandle | null>(null);

  const [poiFeatures, setPoiFeatures] = useState<any[]>([]);
  const [poiError, setPoiError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerId, boolean>>(DEFAULT_VISIBLE);
  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP_ID);
  const [activeTool, setActiveTool] = useState<MapTool>(null);
  const [measure, setMeasure] = useState<MeasureResult>(null);
  const [layerLoading, setLayerLoading] = useState(false);
  const [sidebarToggled, setSidebarToggled] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<{
    properties: Record<string, any>;
    layerLabel: string;
  } | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<{
    urls: string[];
    currentIndex: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [coverIndex, setCoverIndex] = useState(0);

  // State untuk Rute Tercepat & Navigasi
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [routeTargetName, setRouteTargetName] = useState("");
  const [routingToast, setRoutingToast] = useState<string | null>(null);

  // State untuk Lokasi GPS Pengguna Aktif di Peta
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const showRoutingToast = useCallback((msg: string) => {
    setRoutingToast(msg);
    setTimeout(() => setRoutingToast(null), 4000);
  }, []);

  // Deteksi lokasi pengguna saat dashboard dibuka
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleLocateUser = useCallback(() => {
    if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      showRoutingToast(isEn ? "GPS requires HTTPS (SSL) connection on public IP." : "Fitur GPS browser mewajibkan koneksi HTTPS (SSL) untuk mengakses lokasi perangkat pada IP publik.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showRoutingToast(isEn ? "Your device or browser does not support GPS Geolocation." : "Perangkat atau browser Anda tidak mendukung GPS Geolocation.");
      return;
    }

    if (userLocation) {
      mapRef.current?.flyToCoords(userLocation, 16);
      showRoutingToast(isEn ? "Centering map view to your location." : "Memusatkan tampilan peta ke posisi Anda.");
      return;
    }

    setIsLocating(true);
    showRoutingToast(isEn ? "Detecting your GPS coordinates..." : "Mendeteksi koordinat GPS Anda...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setIsLocating(false);
        mapRef.current?.flyToCoords(coords, 16);
        showRoutingToast(isEn ? "Your location was found successfully!" : "Lokasi Anda berhasil ditemukan!");
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          showRoutingToast(isEn ? "GPS permission denied by browser or requires HTTPS." : "Izin lokasi GPS ditolak oleh browser atau memerlukan protokol HTTPS.");
        } else {
          showRoutingToast(isEn ? "Failed to detect device GPS coordinates." : "Gagal mendeteksi lokasi GPS perangkat Anda.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [userLocation, showRoutingToast, isEn]);

  const handleGetDirections = useCallback((props: any) => {
    const lat = Number(props.y || props.lat || props.latitude);
    const lng = Number(props.x || props.lng || props.longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      showRoutingToast(isEn ? "Church coordinates are not yet valid." : "Koordinat lokasi gereja ini belum valid.");
      return;
    }

    const churchName = props.name || props.nama || (isEn ? "Target Church" : "Gereja Tujuan");
    setRouteTargetName(churchName);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      window.open(getGoogleMapsDirectionsUrl(lat, lng), "_blank");
      return;
    }

    setIsRoutingLoading(true);
    showRoutingToast(isEn ? "Detecting your GPS coordinates..." : "Mendeteksi lokasi GPS Anda...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setUserLocation([userLat, userLng]);

        try {
          showRoutingToast(isEn ? "Calculating fastest driving route..." : "Mengalkulasi rute jalan tercepat...");
          const result = await calculateRoute([userLat, userLng], [lat, lng]);
          setRouteResult(result);
          setIsRoutingLoading(false);
          setRoutingToast(null);
          // Tutup drawer agar peta dan rute terlihat jelas di layar
          setSelectedFeature(null);
        } catch (err: any) {
          setIsRoutingLoading(false);
          showRoutingToast(err.message || (isEn ? "Failed to calculate road route." : "Gagal mengalkulasi rute jalan."));
        }
      },
      async (geoError) => {
        // Jika izin lokasi GPS tidak aktif / ditolak browser karena HTTP, coba simulasi dari Jakarta atau buka Google Maps
        try {
          showRoutingToast(isEn ? "GPS disabled / requires HTTPS. Calculating alternative route..." : "GPS browser nonaktif / butuh HTTPS. Menghitung rute alternatif...");
          const defaultStart: [number, number] = [-6.1843, 106.8456]; // Kramat Pulo, Jakarta Pusat
          const result = await calculateRoute(defaultStart, [lat, lng]);
          setRouteResult(result);
          setIsRoutingLoading(false);
          setRoutingToast(null);
          setSelectedFeature(null);
        } catch (err) {
          setIsRoutingLoading(false);
          showRoutingToast(isEn ? "Opening directions in Google Maps..." : "Membuka petunjuk arah di Google Maps...");
          window.open(getGoogleMapsDirectionsUrl(lat, lng), "_blank");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [showRoutingToast, isEn]);

  const isWideScreen = useIsWideScreen();
  const sidebarOpen = sidebarToggled ?? isWideScreen;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/poi.geojson");
        if (!res.ok) throw new Error("gagal memuat data gereja");
        const data = await res.json();
        if (!cancelled) setPoiFeatures(data.features ?? []);
      } catch (error) {
        if (!cancelled) {
          setPoiError(error instanceof Error ? error.message : "Data gereja gagal dimuat.");
        }
      }
    })();
  }, []);

  // Slideshow Autoplay Effect
  useEffect(() => {
    if (!activePhotoModal || activePhotoModal.urls.length <= 1 || !isPlaying) return;

    const timer = setInterval(() => {
      setActivePhotoModal((prev) => {
        if (!prev) return null;
        const nextIndex = (prev.currentIndex + 1) % prev.urls.length;
        return { ...prev, currentIndex: nextIndex };
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [activePhotoModal, isPlaying]);

  // Reset cover index when selected jemaat changes
  useEffect(() => {
    setCoverIndex(0);
  }, [selectedFeature]);

  // Invalidate map size when sidebar opens or closes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // Autoplay for the drawer cover image (mini-carousel)
  useEffect(() => {
    if (!selectedFeature) return;
    const photos = extractPhotos(selectedFeature.properties);
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setCoverIndex((prev) => (prev + 1) % photos.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [selectedFeature]);

  const daerahList = useMemo(() => {
    const list = poiFeatures
      .filter((f: any) => f.properties?.tipe_wilayah !== "Wilayah Khusus" && !String(f.properties?.nama_mada || "").toUpperCase().includes("KHUSUS"))
      .map((f: any) => f.properties?.nama_mada)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort((a, b) => a.localeCompare(b)) as string[];
  }, [poiFeatures]);

  const wilayahList = useMemo(() => {
    let filtered = poiFeatures.filter((f: any) => f.properties?.tipe_wilayah !== "Wilayah Khusus" && !String(f.properties?.nama_mada || "").toUpperCase().includes("KHUSUS"));
    if (filters.daerah !== ALL) {
      filtered = filtered.filter((f: any) => f.properties?.nama_mada === filters.daerah);
    }
    const list = filtered
      .map((f: any) => f.properties?.mawil)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort((a, b) => a.localeCompare(b)) as string[];
  }, [poiFeatures, filters.daerah]);

  const daerahKhususList = useMemo(() => {
    const list = poiFeatures
      .filter((f: any) => f.properties?.tipe_wilayah === "Wilayah Khusus" && Boolean(f.properties?.daerah_khusus))
      .map((f: any) => f.properties?.daerah_khusus)
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort((a, b) => a.localeCompare(b)) as string[];
  }, [poiFeatures]);

  const wilayahKhususList = useMemo(() => {
    let filtered = poiFeatures.filter((f: any) => f.properties?.tipe_wilayah === "Wilayah Khusus" || Boolean(f.properties?.wilayah_khusus) || String(f.properties?.nama_mada || "").toUpperCase().includes("KHUSUS"));
    if (filters.daerahKhusus !== ALL && filters.daerahKhusus !== ALL_KHUSUS) {
      filtered = filtered.filter((f: any) => f.properties?.daerah_khusus === filters.daerahKhusus);
    }
    const list = filtered
      .map((f: any) => f.properties?.wilayah_khusus || (String(f.properties?.nama_mada || "").toUpperCase().includes("MAWIL") ? f.properties?.nama_mada : ""))
      .filter((name: any) => name && name.trim() !== "");
    return [...new Set(list)].sort((a, b) => a.localeCompare(b)) as string[];
  }, [poiFeatures, filters.daerahKhusus]);

  const summary = useMemo(() => {
    const total = poiFeatures.length;
    const filtered = poiFeatures.filter((f: any) => {
      const p = f.properties ?? {};
      if (filters.daerah !== ALL && p.nama_mada !== filters.daerah) return false;
      if (filters.wilayah !== ALL && p.mawil !== filters.wilayah) return false;

      if (filters.daerahKhusus !== ALL) {
        if (filters.daerahKhusus === ALL_KHUSUS) {
          const isKhusus = p.tipe_wilayah === "Wilayah Khusus" || Boolean(p.daerah_khusus) || Boolean(p.wilayah_khusus) || String(p.nama_mada || "").toUpperCase().includes("KHUSUS");
          if (!isKhusus) return false;
        } else {
          const matches = p.daerah_khusus === filters.daerahKhusus;
          if (!matches) return false;
        }
      }

      if (filters.wilayahKhusus !== ALL) {
        const wkVal = p.wilayah_khusus || (p.tipe_wilayah === "Wilayah Khusus" && String(p.nama_mada || "").toUpperCase().includes("MAWIL") ? p.nama_mada : "");
        if (wkVal !== filters.wilayahKhusus) return false;
      }

      return true;
    });

    return {
      jumlahMada: daerahList.length + daerahKhususList.length,
      jumlahWilayah: wilayahList.length + (wilayahKhususList.length || 0),
      totalGereja: total,
      gerejaTerfilter: filtered.length,
    };
  }, [poiFeatures, filters, daerahList, wilayahList, daerahKhususList, wilayahKhususList]);

  const handleFiltersChange = useCallback((next: Filters) => {
    setFilters(next);
    mapRef.current?.fitTo(next);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTool(null);
    setVisibleLayers(DEFAULT_VISIBLE);
    setSelectedFeature(null);
    mapRef.current?.resetView();
    mapRef.current?.closePopup();
  }, []);

  const handleSelectPOI = useCallback((latlng: [number, number], properties: any) => {
    mapRef.current?.focusPOI(latlng, properties);
    setSelectedFeature({ properties, layerLabel: "Titik Gereja" });
  }, []);

  const handleToggleLayer = useCallback((id: LayerId, visible: boolean) => {
    setVisibleLayers((prev) => ({ ...prev, [id]: visible }));
  }, []);

  const handleToolFinished = useCallback(() => setActiveTool(null), []);

  const handleNavigatePhoto = useCallback((direction: "prev" | "next") => {
    setIsPlaying(false);
    setActivePhotoModal((prev) => {
      if (!prev) return null;
      const step = direction === "prev" ? -1 : 1;
      const nextIndex = (prev.currentIndex + step + prev.urls.length) % prev.urls.length;
      return { ...prev, currentIndex: nextIndex };
    });
  }, []);

  const handleFeatureSelect = useCallback((props: Record<string, any> | null, label: string) => {
    if (props) {
      setSelectedFeature({ properties: props, layerLabel: label });
    } else {
      setSelectedFeature(null);
    }
  }, []);

  const effectiveLayers = visibleLayers;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* ------------------------------------------------------------- header */}
      <DashboardHeader
        hasManagementAccess={hasManagementAccess}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarToggled(!sidebarOpen)}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        summary={summary}
        onResetFilters={handleReset}
      />

      {/* ------------------------------------------------------------- filter & stats bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-slate-200 bg-slate-50 px-2.5 sm:px-4 py-2 relative z-[1200]">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            daerahList={daerahList}
            wilayahList={wilayahList}
            daerahKhususList={daerahKhususList}
            wilayahKhususList={wilayahKhususList}
            pois={poiFeatures}
            onSelectPOI={handleSelectPOI}
          />

          <div className="h-5 w-px bg-slate-300 mx-1 shrink-0 hidden lg:block" />

          {/* KPI Stats Badges side-by-side */}
          <div className="hidden md:flex items-center shrink-0">
            <SummaryCards summary={summary} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          title={t("dashboard.reset_title") || "Kembalikan filter ke tampilan awal"}
          className="h-9 shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-xs transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="hidden sm:inline">{t("dashboard.reset") || "Reset"}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- konten */}
      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen ? (
          <aside className="absolute inset-y-0 left-0 z-1100 w-72 max-w-[85vw] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-2xl thin-scroll lg:static lg:w-64 lg:shadow-none">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 lg:hidden">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t("dashboard.layer_settings") || "Pengaturan Layer"}
              </span>
              <button
                type="button"
                onClick={() => setSidebarToggled(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label={isEn ? "Close side panel" : "Tutup panel samping"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <LayerControl
              visibleLayers={visibleLayers}
              onToggleLayer={handleToggleLayer}
              basemapId={basemapId}
              onBasemapChange={setBasemapId}
              filters={filters}
            />
          </aside>
        ) : null}

        {/* peta */}
        <main className="relative min-w-0 flex-1">
          <MapView
            ref={mapRef}
            basemapId={basemapId}
            visibleLayers={effectiveLayers}
            filters={filters}
            activeTool={activeTool}
            routeResult={routeResult}
            userLocation={userLocation}
            onToolFinished={handleToolFinished}
            onMeasureChange={setMeasure}
            onLoadingChange={setLayerLoading}
            onFeatureSelect={handleFeatureSelect}
          />

          <div className="pointer-events-none absolute inset-0">
            {/* Logo overlay di pojok kanan atas peta */}
            <div className="pointer-events-none absolute top-3 right-3 z-400">
              <img
                src="/images/Logo GGP2.png"
                alt="Logo GGP"
                className="h-8 sm:h-14 w-auto object-contain shrink-0 opacity-80 sm:opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              />
            </div>

            <div className="pointer-events-auto absolute left-3 top-3 z-400">
              <MapControls
                onZoomIn={() => mapRef.current?.zoomIn()}
                onZoomOut={() => mapRef.current?.zoomOut()}
                onReset={handleReset}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onLocateUser={handleLocateUser}
                isLocating={isLocating}
                userLocation={userLocation}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarToggled(!sidebarOpen)}
              />
            </div>

            <MapToolOverlayBadges
              layerLoading={layerLoading}
              activeTool={activeTool}
              measure={measure}
              poiError={poiError}
              onCloseTool={() => setActiveTool(null)}
            />

            {/* Kartu Informasi Rute Tercepat */}
            {routeResult && (
              <RouteInfoCard
                route={routeResult}
                churchName={routeTargetName}
                onClose={() => setRouteResult(null)}
              />
            )}
          </div>
        </main>

        {sidebarOpen ? (
          <button
            type="button"
            aria-label={isEn ? "Close panel" : "Tutup panel"}
            onClick={() => setSidebarToggled(false)}
            className="absolute inset-0 z-1050 bg-slate-900/20 lg:hidden"
          />
        ) : null}

        {/* ------------------------------------------------------------- DRAWER DETAIL KANAN */}
        <ChurchDetailDrawer
          selectedFeature={selectedFeature}
          coverIndex={coverIndex}
          setCoverIndex={setCoverIndex}
          onClose={() => {
            setSelectedFeature(null);
            mapRef.current?.closePopup();
          }}
          onOpenPhotoModal={(urls, index) => {
            setActivePhotoModal({ urls, currentIndex: index });
            setIsPlaying(true);
          }}
          onGetRoute={handleGetDirections}
          isRoutingLoading={isRoutingLoading}
        />
      </div>

      {/* Toast Notifikasi Routing */}
      {routingToast && (
        <div className="fixed top-20 right-6 z-1300 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl flex items-center gap-2 animate-bounce">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.25Z" clipRule="evenodd" />
          </svg>
          <span>{routingToast}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- MODAL LIGHTBOX FOTO */}
      <PhotoLightboxModal
        activePhotoModal={activePhotoModal}
        isPlaying={isPlaying}
        onTogglePlaying={() => setIsPlaying(!isPlaying)}
        onClose={() => setActivePhotoModal(null)}
        onNavigate={handleNavigatePhoto}
      />
    </div>
  );
}
