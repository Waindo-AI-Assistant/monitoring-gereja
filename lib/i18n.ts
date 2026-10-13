"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const defaultNS = "translation";

export const resources = {
  id: {
    translation: {
      nav: {
        title: "Gereja Gerakan Pentakosta",
        subtitle: "Dashboard Pemetaan Sebaran Data Gereja",
        home: "Beranda",
        leadership: "Pengurus Pusat",
        dashboard: "Dashboard",
        contact: "Kontak",
      },
      pengurus: {
        badge: "SINODE GEREJA GERAKAN PENTAKOSTA",
        title: "Badan Pengurus Majelis Pusat",
        period: "Periode Pelayanan 2021 – 2026",
        subtitle: "Susunan Badan Pengurus Harian (BPH) dan Departemen Pelayanan Majelis Pusat Gereja Gerakan Pentakosta masa bakti 2021 – 2026 hasil Sidang Raya XV.",
        back_home: "Kembali ke Beranda",
        open_dashboard: "Buka Peta Dashboard",
        bph_title: "Badan Pengurus Harian (BPH)",
        bph_desc: "Pucuk kepemimpinan sinode yang menahkodai pelayanan gerejawi tingkat nasional",
        dept_title: "Departemen & Komisi Pelayanan Sinode",
        dept_desc: "Bidang pembinaan, pelayanan kategorial jemaat, dan digitalisasi",
        contact_title: "Sekretariat Majelis Pusat GGP",
        contact_desc: "Pusat administrasi dan kesekretariatan sinode nasional",
      },
      hero: {
        badge: "SISTEM GEOSPASIAL RESMI GGP",
        title_line1: "Gereja Gerakan Pentakosta",
        title_line2: "Sebaran Data Gereja",
        desc: "Akses informasi spasial jemaat, lokasi gereja, fasilitas pelayanan, dan data pendukung untuk mendukung pemantauan dan pelayanan gereja secara terpadu.",
        open_dashboard: "Buka Dashboard",
        stats_mp: "Majelis Pusat",
        stats_mp_val: "2021 – 2026",
        stats_mada: "Majelis Daerah (MADA)",
        stats_mawil: "Majelis Wilayah (MAWIL)",
        stats_gereja: "Majelis Jemaat",
        preview_title: "Dashboard Geospasial Monitoring Gereja",
      },
      preview: {
        label: "Jelajahi wilayah pelayanan",
        description: "Lihat sebaran gereja GGP dari Sumatra hingga Papua. Temukan lokasi gereja dan informasi jemaat melalui peta interaktif.",
        caption: "Sebaran gereja GGP di seluruh Indonesia",
        hint: "Peta interaktif, pencarian gereja, dan filter wilayah.",
      },
      features: {
        label: "Fitur Utama",
        title: "Solusi Geospasial Lengkap",
        subtitle: "Dilengkapi berbagai fitur untuk mendukung analisis dan perencanaan wilayah secara efektif",
        f1_title: "Peta Digital Interaktif",
        f1_desc: "Jelajahi wilayah dengan peta digital yang responsif dan berbagai pilihan basemap sesuai kebutuhan.",
        f2_title: "Multi-Layer Geospasial",
        f2_desc: "Tampilkan berbagai data spasial seperti batas wilayah MADA, MAWIL, jalan, dan fasilitas pelayanan.",
        f3_title: "Pencarian & Analisis Cepat",
        f3_desc: "Temukan lokasi gereja, hitung rute perjalanan, dan analisa distribusi jemaat dalam hitungan detik.",
      },
      footer: {
        brand_name: "Gereja Gerakan Pentakosta",
        brand_sub: "Sistem Informasi Spasial",
        brand_desc: "Platform geospasial berbasis peta digital untuk mendukung pemantauan jemaat, analisis sebaran gereja, pelayanan jemaat, dan infrastruktur wilayah pelayanan.",
        location_title: "Lokasi Sekretariat",
        contact_title: "Hubungi Kami",
        phone_label: "Telp",
        copyright: "© {{year}} PENTAKOSTA • Department Digitalisasi GGP. All rights reserved.",
      },
      lang: {
        switch_title: "Pilih Bahasa",
        id: "Bahasa Indonesia",
        en: "English",
        id_short: "ID",
        en_short: "EN",
      },
    },
  },
  en: {
    translation: {
      nav: {
        title: "Pentecostal Movement Church",
        subtitle: "Church Geospatial Distribution Dashboard",
        home: "Home",
        leadership: "Central Leadership",
        dashboard: "Dashboard",
        contact: "Contact",
      },
      pengurus: {
        badge: "PENTECOSTAL MOVEMENT CHURCH SYNOD",
        title: "Central Council Leadership Board",
        period: "Service Term 2021 – 2026",
        subtitle: "Composition of the Daily Executive Board and Ministry Departments of the Pentecostal Movement Church Central Council from the 15th General Assembly.",
        back_home: "Back to Home",
        open_dashboard: "Open Map Dashboard",
        bph_title: "Daily Executive Board (BPH)",
        bph_desc: "National synod leadership governing ecclesiastical ministry across Indonesia",
        dept_title: "Synod Departments & Ministry Commissions",
        dept_desc: "Church development, departmental ministries, and digital spatial systems",
        contact_title: "GGP Central Council Secretariat",
        contact_desc: "National synod administrative and secretariat headquarters",
      },
      hero: {
        badge: "OFFICIAL GGP GEOSPATIAL SYSTEM",
        title_line1: "Pentecostal Movement Church",
        title_line2: "Church Spatial Distribution",
        desc: "Access spatial congregation information, church locations, ministry facilities, and supporting data to empower integrated church monitoring and ministry services.",
        open_dashboard: "Open Dashboard",
        stats_mp: "Central Council",
        stats_mp_val: "2021 – 2026",
        stats_mada: "Regional Council (MADA)",
        stats_mawil: "District Council (MAWIL)",
        stats_gereja: "Congregations",
        preview_title: "Geospatial Dashboard — Church Monitoring",
      },
      preview: {
        label: "Explore ministry regions",
        description: "Explore GGP churches from Sumatra to Papua. Find church locations and congregation information on an interactive map.",
        caption: "GGP church locations across Indonesia",
        hint: "Interactive map, church search, and regional filters.",
      },
      features: {
        label: "Key Features",
        title: "Complete Geospatial Solution",
        subtitle: "Equipped with comprehensive features to support effective spatial analysis and regional planning",
        f1_title: "Interactive Digital Map",
        f1_desc: "Explore regions with a responsive digital map and various basemap options tailored to your needs.",
        f2_title: "Multi-Layer Geospatial Data",
        f2_desc: "Display various spatial datasets including MADA & MAWIL boundaries, road networks, and ministry facilities.",
        f3_title: "Fast Search & Spatial Analysis",
        f3_desc: "Locate churches, calculate travel routes, and analyze congregation distribution in seconds.",
      },
      footer: {
        brand_name: "Pentecostal Movement Church",
        brand_sub: "Spatial Information System",
        brand_desc: "A digital map-based geospatial platform supporting congregation monitoring, church distribution analysis, ministry services, and regional infrastructure.",
        location_title: "Secretariat Location",
        contact_title: "Contact Us",
        phone_label: "Phone",
        copyright: "© {{year}} PENTAKOSTA • Department Digitalisasi GGP. All rights reserved.",
      },
      lang: {
        switch_title: "Select Language",
        id: "Bahasa Indonesia",
        en: "English",
        id_short: "ID",
        en_short: "EN",
      },
    },
  },
} as const;

// Helper to get initial language on client
const getInitialLanguage = (): string => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("ggp_lang");
      if (saved && (saved === "id" || saved === "en")) {
        return saved;
      }
    } catch {
      // fallback
    }
  }
  return "id";
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "id", // default on SSR / initial
    fallbackLng: "id",
    defaultNS,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

  // On client, sync with localStorage if different
  if (typeof window !== "undefined") {
    const initial = getInitialLanguage();
    if (initial && initial !== i18n.language) {
      i18n.changeLanguage(initial);
    }
  }
}

export const setAppLanguage = (lang: "id" | "en") => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("ggp_lang", lang);
    } catch {
      // ignore
    }
  }
  return i18n.changeLanguage(lang);
};

export default i18n;
