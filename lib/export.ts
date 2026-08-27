/**
 * Utility untuk mengekspor data geospasial gereja ke format GeoJSON dan CSV
 */

export function exportGeoJSON(features: any[], filename?: string) {
  const dateStr = new Date().toISOString().split("T")[0];
  const name = filename || `persebaran_gereja_ggp_${dateStr}.geojson`;

  const geojson = {
    type: "FeatureCollection",
    name: "Persebaran_Gereja_GGP",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features: features.map((f) => {
      if (f.type === "Feature" && f.geometry) return f;

      const p = f.properties || f;
      const x = parseFloat(p.x || "0");
      const y = parseFloat(p.y || "0");

      return {
        type: "Feature",
        properties: p,
        geometry: {
          type: "Point",
          coordinates: [x, y],
        },
      };
    }),
  };

  const jsonString = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonString], { type: "application/geo+json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCSV(features: any[], filename?: string) {
  const dateStr = new Date().toISOString().split("T")[0];
  const name = filename || `data_gereja_ggp_${dateStr}.csv`;

  if (features.length === 0) return;

  const sampleProps = features[0].properties || features[0];
  const headers = Object.keys(sampleProps).filter((k) => !k.startsWith("_"));

  const csvRows: string[] = [];
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

  for (const f of features) {
    const p = f.properties || f;
    const values = headers.map((header) => {
      const val = p[header] ?? "";
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = "\uFEFF" + csvRows.join("\r\n"); // UTF-8 BOM
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
