import { createClient } from "npm:@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";
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
    margin: 1,
    width: size,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const svgMatch = qrSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!svgMatch) throw new Error("Failed to parse QR SVG");

  const svgContent = svgMatch[1];

  const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
  let qrWidth = size;
  let qrHeight = size;

  if (viewBoxMatch) {
    const viewBoxValues = viewBoxMatch[1].split(/\s+/);
    qrWidth = parseFloat(viewBoxValues[2]) || size;
    qrHeight = parseFloat(viewBoxValues[3]) || size;
  }

  const padding = 30;
  const textSize = 28;
  const textMargin = 15;
  const totalWidth = qrWidth + (padding * 2);
  const totalHeight = qrHeight + (padding * 2) + textMargin + textSize + 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding}) scale(${qrWidth / size}, ${qrHeight / size})">
    ${svgContent}
  </g>
  <text x="${totalWidth / 2}" y="${qrHeight + padding + textMargin + textSize}" font-family="Arial, sans-serif" font-size="${textSize}" font-weight="600" fill="#000000" text-anchor="middle">${displayText}</text>
</svg>`;
}

async function makeRoundQrSvgWithText(qrText: string, displayText: string, size = 512): Promise<string> {
  const qrSvg = await QRCode.toString(qrText, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    width: size,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const svgMatch = qrSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!svgMatch) throw new Error("Failed to parse QR SVG");

  const svgContent = svgMatch[1];

  const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
  let qrWidth = size;

  if (viewBoxMatch) {
    const viewBoxValues = viewBoxMatch[1].split(/\s+/);
    qrWidth = parseFloat(viewBoxValues[2]) || size;
  }

  const padding = 40;
  const totalSize = size + (padding * 2);
  const centerX = totalSize / 2;
  const centerY = totalSize / 2;
  const circleRadius = size / 2;
  const textRadius = circleRadius + 25;

  const pathId = `textPath_${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `circleMask_${Math.random().toString(36).substr(2, 9)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <defs>
    <clipPath id="${maskId}">
      <circle cx="${centerX}" cy="${centerY}" r="${circleRadius}"/>
    </clipPath>
    <path id="${pathId}" d="M ${centerX - textRadius * 0.85},${centerY + textRadius * 0.7} A ${textRadius},${textRadius} 0 0,1 ${centerX + textRadius * 0.85},${centerY + textRadius * 0.7}" fill="none"/>
  </defs>
  <g transform="translate(${centerX}, ${centerY})">
    <g transform="scale(${size / qrWidth})" clip-path="url(#${maskId})">
      <g transform="translate(${-qrWidth / 2}, ${-qrWidth / 2})">
        ${svgContent}
      </g>
    </g>
  </g>
  <circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" fill="none" stroke="#000000" stroke-width="3"/>
  <text font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#000000" text-anchor="middle">
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