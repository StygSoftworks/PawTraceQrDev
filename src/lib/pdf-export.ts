export type PageSize = "letter" | "a4" | "custom";
export type PageOrientation = "portrait" | "landscape";

export interface PDFOptions {
  pageSize?: PageSize;
  orientation?: PageOrientation;
  customWidth?: number;
  customHeight?: number;
  margin?: number;
  title?: string;
  author?: string;
  targetWidth?: number;
}

const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
};

function getPageDimensions(
  pageSize: PageSize,
  orientation: PageOrientation,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  let dimensions: { width: number; height: number };

  if (pageSize === "custom" && customWidth && customHeight) {
    dimensions = { width: customWidth, height: customHeight };
  } else if (pageSize === "letter" || pageSize === "a4") {
    dimensions = PAGE_SIZES[pageSize];
  } else {
    dimensions = PAGE_SIZES.letter;
  }

  if (orientation === "landscape") {
    dimensions = { width: dimensions.height, height: dimensions.width };
  }

  return dimensions;
}

async function loadJsPDF() {
  const [{ jsPDF }, _svg2pdf] = await Promise.all([
    import("jspdf"),
    import("svg2pdf.js"),
  ]);
  return jsPDF;
}

export async function svgStringToPdf(
  svgString: string,
  options: PDFOptions = {}
): Promise<Blob> {
  const {
    pageSize = "letter",
    orientation = "portrait",
    customWidth,
    customHeight,
    margin = 36,
    title = "QR Code",
    author = "PawTrace QR",
    targetWidth,
  } = options;

  const { width: pageWidth, height: pageHeight } = getPageDimensions(
    pageSize,
    orientation,
    customWidth,
    customHeight
  );

  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({
    orientation: orientation === "portrait" ? "p" : "l",
    unit: "pt",
    format: [pageWidth, pageHeight],
  });

  doc.setProperties({
    title,
    author,
    creator: "PawTrace QR",
    subject: "QR Code for Pet Identification",
  });

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgElement = svgDoc.documentElement;

  const viewBox = svgElement.getAttribute("viewBox")?.split(" ").map(Number);
  const svgWidth = viewBox?.[2] || parseFloat(svgElement.getAttribute("width") || "512");
  const svgHeight = viewBox?.[3] || parseFloat(svgElement.getAttribute("height") || "512");

  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  let scaledWidth: number;
  let scaledHeight: number;

  if (targetWidth) {
    const scale = targetWidth / svgWidth;
    scaledWidth = svgWidth * scale;
    scaledHeight = svgHeight * scale;

    if (scaledWidth > availableWidth || scaledHeight > availableHeight) {
      const constrainedScale = Math.min(
        availableWidth / svgWidth,
        availableHeight / svgHeight
      );
      scaledWidth = svgWidth * constrainedScale;
      scaledHeight = svgHeight * constrainedScale;
    }
  } else {
    const scale = Math.min(
      availableWidth / svgWidth,
      availableHeight / svgHeight,
      1
    );
    scaledWidth = svgWidth * scale;
    scaledHeight = svgHeight * scale;
  }

  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;

  await doc.svg(svgElement, {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
  });

  return doc.output("blob");
}

export async function multipleQrsToPdf(
  qrData: Array<{ svgString: string; label?: string }>,
  options: PDFOptions & { qrsPerPage?: number } = {}
): Promise<Blob> {
  const {
    pageSize = "letter",
    orientation = "portrait",
    customWidth,
    customHeight,
    margin = 36,
    qrsPerPage = 1,
    title = "QR Codes Batch Export",
    author = "PawTrace QR",
  } = options;

  const { width: pageWidth, height: pageHeight } = getPageDimensions(
    pageSize,
    orientation,
    customWidth,
    customHeight
  );

  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({
    orientation: orientation === "portrait" ? "p" : "l",
    unit: "pt",
    format: [pageWidth, pageHeight],
  });

  doc.setProperties({
    title,
    author,
    creator: "PawTrace QR",
    subject: "QR Codes for Pet Identification",
  });

  const parser = new DOMParser();

  for (let i = 0; i < qrData.length; i++) {
    if (i > 0 && i % qrsPerPage === 0) {
      doc.addPage();
    }

    const { svgString, label } = qrData[i];
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    const viewBox = svgElement.getAttribute("viewBox")?.split(" ").map(Number);
    const svgWidth = viewBox?.[2] || parseFloat(svgElement.getAttribute("width") || "512");
    const svgHeight = viewBox?.[3] || parseFloat(svgElement.getAttribute("height") || "512");

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    if (qrsPerPage === 1) {
      const scale = Math.min(
        availableWidth / svgWidth,
        availableHeight / svgHeight,
        1
      );

      const scaledWidth = svgWidth * scale;
      const scaledHeight = svgHeight * scale;

      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      await doc.svg(svgElement, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });

      if (label) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(label, pageWidth / 2, pageHeight - margin / 2, {
          align: "center",
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i + 1} of ${qrData.length}`,
        pageWidth - margin,
        pageHeight - margin / 2,
        { align: "right" }
      );
    } else {
      const gridCols = qrsPerPage === 2 ? 1 : qrsPerPage === 4 ? 2 : 2;
      const gridRows = qrsPerPage === 2 ? 2 : qrsPerPage === 4 ? 2 : 3;

      const positionInPage = i % qrsPerPage;
      const col = positionInPage % gridCols;
      const row = Math.floor(positionInPage / gridCols);

      const cellWidth = availableWidth / gridCols;
      const cellHeight = availableHeight / gridRows;

      const scale = Math.min(
        (cellWidth - margin) / svgWidth,
        (cellHeight - margin) / svgHeight,
        1
      );

      const scaledWidth = svgWidth * scale;
      const scaledHeight = svgHeight * scale;

      const x = margin + col * cellWidth + (cellWidth - scaledWidth) / 2;
      const y = margin + row * cellHeight + (cellHeight - scaledHeight) / 2;

      await doc.svg(svgElement, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
  }

  return doc.output("blob");
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
