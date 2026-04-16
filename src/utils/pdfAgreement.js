import PDFDocument from "pdfkit";

export async function buildAgreementPdfBuffer({ user, legalDocs }) {
  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];

  doc.on("data", chunk => chunks.push(chunk));

  doc.fontSize(20).fillColor("#111111").text("Sembhi Bot Ultimate - User Agreement", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(11).fillColor("#333333");
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.text(`Name: ${user.fullName}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Phone: ${user.phone || "-"}`);
  doc.text(`Address: ${user.address || "-"}`);
  doc.text(`Country: ${user.country || "-"}`);
  doc.text(`IP Address: ${user.acceptance?.ipAddress || "-"}`);
  doc.text(`User Agent: ${user.acceptance?.userAgent || "-"}`);
  doc.text(`Accepted At: ${user.acceptance?.acceptedAt ? new Date(user.acceptance.acceptedAt).toLocaleString() : "-"}`);
  doc.text(`Typed Signature Name: ${user.acceptance?.signatureTypedName || "-"}`);

  doc.moveDown();
  doc.fontSize(13).fillColor("#111111").text("Accepted Documents");
  for (const d of legalDocs) {
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor("#333333").text(`${d.title} (Version ${d.version})`);
    if (d.summary) doc.text(d.summary);
  }

  doc.moveDown();
  doc.fontSize(13).fillColor("#111111").text("Digital Signature");
  if (user.acceptance?.signatureDataUrl?.startsWith("data:image")) {
    const base64 = user.acceptance.signatureDataUrl.split(",")[1];
    const imageBuffer = Buffer.from(base64, "base64");
    doc.image(imageBuffer, { fit: [220, 90] });
  } else {
    doc.text("No image signature supplied.");
  }

  doc.moveDown();
  doc.fontSize(9).fillColor("#666666").text("This PDF is intended as an electronic record of signup acknowledgements for platform access, compliance, and support review.");

  doc.end();

  return await new Promise(resolve => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
