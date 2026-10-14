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
        admin: "Admin",
        contact: "Kontak",
        layer_panel: "Layer & Peta Dasar",
        quick_stats: "Statistik Geospasial",
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
        description: "Lihat sebaran gereja GGP di seluruh Indonesia. Temukan lokasi gereja dan informasi jemaat melalui peta interaktif.",
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
        f3_desc: "Temukan lokasi gereja, analisis rute perjalanan, dan petakan persebaran jemaat dalam hitungan detik.",
      },
      footer: {
        brand_name: "Gereja Gerakan Pentakosta",
        brand_sub: "Dashboard Pemetaan Sebaran Data Gereja",
        brand_desc: "Platform geospasial berbasis peta digital untuk mendukung pemantauan jemaat, analisis sebaran gereja, pelayanan jemaat, dan infrastruktur wilayah pelayanan.",
        location_title: "Lokasi Sekretariat",
        contact_title: "Hubungi Kami",
        phone_label: "Telp",
        copyright: "© {{year}} PENTAKOSTA • Departemen Digitalisasi GGP. All rights reserved.",
      },
      lang: {
        switch_title: "Pilih Bahasa",
        id: "Bahasa Indonesia",
        en: "English",
        id_short: "ID",
        en_short: "EN",
      },
      dashboard: {
        subtitle: "Dashboard Pemetaan Geospasial",
        search_placeholder: "CARI NAMA GEREJA...",
        filter_btn: "Filter Wilayah",
        filter_title: "Filter Wilayah & Daerah",
        filter_sub: "Saring sebaran titik gereja pada peta",
        cat_reg: "Kategori Wilayah Reguler",
        cat_reg_badge: "MADA & MAWIL",
        label_mada: "Majelis Daerah (Mada)",
        all_mada: "Semua Mada (Seluruh Daerah)",
        label_mawil: "Majelis Wilayah (Mawil)",
        all_mawil: "Semua Mawil (Seluruh Wilayah)",
        cat_spec: "Wilayah Khusus (Perintisan)",
        cat_spec_badge: "KHUSUS",
        label_mada_spec: "Mada Khusus (Daerah Khusus)",
        all_mada_spec: "Semua Mada Khusus",
        label_mawil_spec: "Mawil Khusus (Wilayah Khusus)",
        all_mawil_spec: "Semua Mawil Khusus",
        reset_filter: "Reset Filter",
        apply_filter: "Terapkan Filter",
        reset: "Reset",
        reset_title: "Kembalikan filter ke tampilan awal",
        layer_settings: "Pengaturan Layer",
        layer_panel: "Panel Layer & Peta Dasar",
        basemap: "Peta Dasar (Basemap)",
        layers: "Daftar Layer",
        layer_filtered_to: "Layer disaring ke",
        stats_mada: "Total Mada",
        stats_mawil: "Total Mawil",
        stats_church: "Total Gereja",
        stats_filtered: "Gereja Terfilter",
        stats_hint_mada: "Jumlah Majelis Daerah yang terdaftar",
        stats_hint_mawil: "Jumlah Majelis Wilayah yang terdaftar pada Mada aktif",
        stats_hint_church: "Total seluruh titik plot gereja di Geodatabase",
        stats_hint_filtered: "Jumlah titik gereja yang lolos filter aktif",
        drawer_empty: "Pilih titik pada peta untuk melihat detail",
        pastor: "Gembala Sidang / Pendeta",
        directions_btn: "Petunjuk Arah & Rute Tercepat",
        finding_route: "Mencari Rute Tercepat...",
        detail_object: "Detail Objek",
        church_point: "Titik Gereja",
        loading_layer: "Memuat layer…",
        zoom_in: "Perbesar peta",
        zoom_out: "Perkecil peta",
        locate_me: "Fokus ke lokasi saya saat ini",
        locate_me_on: "Aktifkan deteksi lokasi saya (GPS)",
        zoombox_title: "Zoom ke area: tarik kotak di peta",
        measure_title: "Ukur jarak & luas",
        reset_map: "Reset ke tampilan awal",
        zoombox_hint: "Tarik kotak di peta untuk memperbesar ke area tersebut.",
        measure_hint: "Klik pada peta untuk mulai mengukur. Klik ganda untuk mengakhiri.",
        distance: "Jarak",
        area: "Luas",
        done: "Selesai",
        nav_active: "Navigasi Web Aktif",
        target_church: "Gereja Tujuan",
        est_time: "Estimasi Waktu",
        travel_dist: "Jarak Tempuh",
        turn_by_turn: "Panduan Belokan",
        steps: "Langkah",
        hide: "Sembunyikan",
        show: "Tampilkan",
        route_on_map: "Rute ditampilkan langsung di peta web",
        gmaps_option: "Opsi Google Maps",
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
        admin: "Admin",
        contact: "Contact",
        layer_panel: "Layers & Basemap",
        quick_stats: "Geospatial Statistics",
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
      dashboard: {
        subtitle: "Geospatial Mapping Dashboard",
        search_placeholder: "SEARCH CHURCH NAME...",
        filter_btn: "Region Filter",
        filter_title: "Region & District Filter",
        filter_sub: "Filter church distribution across the map",
        cat_reg: "Regular Region Category",
        cat_reg_badge: "MADA & MAWIL",
        label_mada: "Regional Council (MADA)",
        all_mada: "All Regional Councils (MADA)",
        label_mawil: "District Council (MAWIL)",
        all_mawil: "All District Councils (MAWIL)",
        cat_spec: "Special Territory (Pioneer)",
        cat_spec_badge: "SPECIAL",
        label_mada_spec: "Special Regional Council",
        all_mada_spec: "All Special Regional Councils",
        label_mawil_spec: "Special District Council",
        all_mawil_spec: "All Special District Councils",
        reset_filter: "Reset Filters",
        apply_filter: "Apply Filters",
        reset: "Reset",
        reset_title: "Reset filters to default view",
        layer_settings: "Layer Settings",
        layer_panel: "Layers & Basemaps Panel",
        basemap: "Basemaps",
        layers: "Map Layers",
        layer_filtered_to: "Layer filtered to",
        stats_mada: "Total Mada",
        stats_mawil: "Total Mawil",
        stats_church: "Total Churches",
        stats_filtered: "Filtered Churches",
        stats_hint_mada: "Number of registered Regional Councils",
        stats_hint_mawil: "Number of registered District Councils",
        stats_hint_church: "Total churches mapped in the geodatabase",
        stats_hint_filtered: "Number of churches matching active filter",
        drawer_empty: "Select a point on the map to view details",
        pastor: "Senior Pastor / Minister",
        directions_btn: "Directions & Fastest Route",
        finding_route: "Calculating fastest route...",
        detail_object: "Object Details",
        church_point: "Church Location",
        loading_layer: "Loading layers…",
        zoom_in: "Zoom in",
        zoom_out: "Zoom out",
        locate_me: "Focus on my current location",
        locate_me_on: "Enable GPS location detection",
        zoombox_title: "Zoom to area: drag box on map",
        measure_title: "Measure distance & area",
        reset_map: "Reset to initial view",
        zoombox_hint: "Drag a box on the map to zoom into that area.",
        measure_hint: "Click on the map to measure. Double-click or click Done to finish.",
        distance: "Distance",
        area: "Area",
        done: "Done",
        nav_active: "Active Web Navigation",
        target_church: "Target Church",
        est_time: "Estimated Time",
        travel_dist: "Travel Distance",
        turn_by_turn: "Turn-by-turn Directions",
        steps: "Steps",
        hide: "Hide",
        show: "Show",
        route_on_map: "Route displayed directly on live web map",
        gmaps_option: "Google Maps Option",
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
