import { createClient } from "npm:@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";
import QRCodeStyling from "npm:qr-code-styling@1.9.2";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExportRequest {
  shape: "square" | "round";
  tag_type?: "dog" | "cat" | null;
  shortcodes?: string[];
  limit?: number;
}

interface QRCodeRecord {
  id: string;
  short_id: string;
  tag_type: string;
  created_at: string;
}

async function makeQrSvgWithText(qrText: string, displayText: string, size = 512): Promise<string> {
  const qrSvg = await QRCode.toString(qrText, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const svgMatch = qrSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!svgMatch) throw new Error("Failed to parse QR SVG");

  const svgContent = svgMatch[1];
  const widthMatch = qrSvg.match(/width="([^"]+)"/);
  const heightMatch = qrSvg.match(/height="([^"]+)"/);
  
  const qrWidth = widthMatch ? parseInt(widthMatch[1]) : size;
  const qrHeight = heightMatch ? parseInt(heightMatch[1]) : size;

  const textHeight = 60;
  const padding = 20;
  const totalWidth = qrWidth + (padding * 2);
  const totalHeight = qrHeight + textHeight + (padding * 3);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding})">
    ${svgContent}
  </g>
  <text x="${totalWidth / 2}" y="${qrHeight + padding * 2 + 35}" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#000000" text-anchor="middle">${displayText}</text>
</svg>`;
}

async function makeRoundQrSvgWithText(qrText: string, displayText: string, size = 512): Promise<string> {
  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data: qrText,
    shape: "circle",
    type: "svg",
    dotsOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersSquareOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersDotOptions: {
      color: "#000000",
      type: "dot"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    qrOptions: {
      errorCorrectionLevel: "H"
    }
  });

  const blob = await qrCode.getRawData("svg");
  if (!blob) throw new Error("Failed to generate SVG");

  let qrSvgContent: string;
  if (blob instanceof Blob) {
    qrSvgContent = await blob.text();
  } else {
    qrSvgContent = blob.toString();
  }

  const svgMatch = qrSvgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!svgMatch) throw new Error("Failed to parse QR SVG");

  const svgContent = svgMatch[1];
  const padding = 30;
  const totalSize = size + (padding * 2);
  const radius = (size / 2) + 40;
  const centerX = totalSize / 2;
  const centerY = totalSize / 2;

  const pathId = `textPath_${Math.random().toString(36).substr(2, 9)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding})">
    ${svgContent}
  </g>
  <defs>
    <path id="${pathId}" d="M ${centerX - radius * 0.7},${centerY + radius * 0.7} A ${radius},${radius} 0 0,1 ${centerX + radius * 0.7},${centerY + radius * 0.7}" fill="none"/>
  </defs>
  <text font-family="Arial, sans-serif" font-size="20" font-weight="500" fill="#000000" text-anchor="middle">
    <textPath href="#${pathId}" startOffset="50%">${displayText}</textPath>
  </text>
</svg>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
      throw new Error("Admin access required");
    }

    const body: ExportRequest = await req.json();
    const { shape, tag_type, shortcodes, limit = 100 } = body;

    let qrCodes: QRCodeRecord[] = [];

    if (shortcodes && shortcodes.length > 0) {
      for (const shortcode of shortcodes) {
        const { data } = await supabase
          .from("qr_codes")
          .select("id, short_id, tag_type, created_at")
          .eq("short_id", shortcode)
          .is("pet_id", null)
          .maybeSingle();

        if (data) {
          qrCodes.push(data);
        }
      }
    } else {
      const query = supabase
        .from("qr_codes")
        .select("id, short_id, tag_type, created_at")
        .is("pet_id", null)
        .order("created_at", { ascending: true })
        .limit(Math.min(limit, 1000));

      if (tag_type) {
        query.eq("tag_type", tag_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      qrCodes = data || [];
    }

    if (qrCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No QR codes found matching criteria" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const zip = new JSZip();
    const baseUrl = "https://www.pawtraceqr.com/p/";

    for (const qr of qrCodes) {
      const qrUrl = `${baseUrl}${qr.short_id}`;
      const displayText = `pawtraceqr.com/p/${qr.short_id}`;

      let svgContent: string;
      if (shape === "round") {
        svgContent = await makeRoundQrSvgWithText(qrUrl, displayText);
      } else {
        svgContent = await makeQrSvgWithText(qrUrl, displayText);
      }

      const filename = `${qr.tag_type}-${qr.short_id}.svg`;
      zip.file(filename, svgContent);
    }

    const manifest = {
      exported_at: new Date().toISOString(),
      shape,
      tag_type: tag_type || "all",
      count: qrCodes.length,
      codes: qrCodes.map(qr => ({
        short_id: qr.short_id,
        tag_type: qr.tag_type,
        filename: `${qr.tag_type}-${qr.short_id}.svg`,
      })),
    };

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({ type: "uint8array" });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `qr-codes-${shape}-${tag_type || "all"}-${timestamp}.zip`;

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") || error.message.includes("Admin") ? 403 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
