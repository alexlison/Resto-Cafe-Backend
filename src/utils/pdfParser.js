import fs from "fs";
import { PDFParse } from "pdf-parse";

/**
 * Extract text from PDF file.
 *
 * IMPORTANT: this requires "pdf-parse" v2.x in package.json, e.g.
 *   npm install pdf-parse@^2.4.5
 * The old v1.x bundles a very old copy of pdf.js (~2016) that throws
 * "bad XRef entry" on PDFs written by some generators (e.g. modern
 * cross-reference streams) and gives up entirely on that file. v2 uses a
 * current pdf.js build and correctly parses a much wider range of PDFs.
 * It also reliably preserves spaces between words, which v1 did not
 * always do (v1 silently concatenated words together on some PDFs,
 * producing text like "ChickenBiriyaniEach43180..." with no spaces at
 * all — that's what the old parseItemRow's digit-splitting logic below
 * was originally trying to work around).
 */
export const extractPDFText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const result = await parser.getText();
    return result?.text || "";
  } catch (error) {
    throw new Error(`Failed to read PDF: ${error.message}`);
  } finally {
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
  }
};

// Valid unit-of-measure tokens, matched as a WHOLE token (not a substring),
// since text is now reliably space-separated.
const UOM_TOKENS = new Set(["each", "per", "kg", "ltr", "ml", "pcs", "g"]);

// A numeric field, allowing plain integers or decimals like "65.00".
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

/**
 * Parse sales data from extracted text.
 */
export const parseSalesText = (text) => {
  console.log("Raw text length:", text.length);
  console.log("First 500 chars:", text.substring(0, 500));

  // Normalize line endings and collapse runs of spaces/tabs — but never
  // touch newlines here, since parseItemRow relies on one item per line.
  let cleanText = text.replace(/\r/g, "\n");
  cleanText = cleanText.replace(/\t/g, " ");
  cleanText = cleanText.replace(/[ ]{2,}/g, " ");

  const lines = cleanText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  console.log("Total lines:", lines.length);

  let salesDate = null;
  const items = [];

  // Date patterns, checked in order of specificity
  const datePatterns = [
    /From Date\s*:\s*(\d{2}-\d{2}-\d{4})/,
    /From Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/,
    /(\d{2}-\d{2}-\d{4})/,
    /(\d{2}\/\d{2}\/\d{4})/
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        salesDate = match[1];
        console.log("Found sales date:", salesDate);
        break;
      }
    }
    if (salesDate) break;
  }

  if (!salesDate) {
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}[\/-]\d{2}[\/-]\d{4})/);
      if (dateMatch) {
        salesDate = dateMatch[1];
        console.log("Found sales date from line:", salesDate);
        break;
      }
    }
  }

  for (const line of lines) {
    // Skip header / metadata / footer lines
    const upper = line.toUpperCase();
    if (
      upper.includes("PRAJAIANS") || upper.includes("PRAJAINS") || upper.includes("RESTO CAF") ||
      upper.includes("ITEMWISE SALES") || upper.includes("ITEM WISE SALES") ||
      upper.includes("FROM DATE") || upper.includes("TO DATE") ||
      upper.startsWith("DOCDATE") || upper.includes("CATEGORY:") ||
      upper.startsWith("POS:") || upper.includes("KODAKARA") ||
      upper.startsWith("TOTAL") || upper.startsWith("-- ") ||
      line === "Food Items" || line === "Service Items"
    ) {
      continue;
    }

    // Skip pure numeric subtotal rows, e.g. "47 8300 0 0 8300" or "330 35137 0 0 35137"
    if (/^[\d.\s]+$/.test(line)) {
      continue;
    }

    const itemMatch = parseItemRow(line);
    if (itemMatch) {
      console.log("Parsed item:", itemMatch.itemName, "Qty:", itemMatch.quantity, "Rate:", itemMatch.rate);
      items.push(itemMatch);
    } else {
      console.log("Failed to parse item row:", line);
    }
  }

  console.log("Total items parsed:", items.length);

  return {
    salesDate,
    items,
    totalItems: items.length
  };
};

/**
 * Parse a single item row using whitespace tokens, e.g.:
 *   "08/05/26 Food Items Chicken Biriyani Each 43 180 7740 0 0 7740"
 *   "08/05/26 Food Items Garlic Bread Each 15 65.00 975.00 0.00 0.00 975.00"
 *
 * Strategy: the row's shape is fixed from both ends —
 *   [DATE] [Food Items | Service Items]? <item name tokens...> <UOM> <6 numbers>
 * so we peel off the date from the front, the optional item-type label,
 * then take the LAST 6 whitespace tokens as the numeric fields and the
 * token right before them as the UOM. Everything left in the middle is
 * the item name — however many words it has, and even if some of those
 * words are themselves numbers (e.g. "Marshmallow 40", "Water 500ml").
 */
const parseItemRow = (line) => {
  const tokens = line.split(/\s+/);
  if (tokens.length < 8) return null; // date + item + uom + 6 numbers, minimum

  if (!/^\d{2}[\/-]\d{2}[\/-]\d{2,4}$/.test(tokens[0])) return null;

  let idx = 1;
  if (
    tokens[idx] && tokens[idx + 1] &&
    (
      (tokens[idx].toLowerCase() === "food" && tokens[idx + 1].toLowerCase() === "items") ||
      (tokens[idx].toLowerCase() === "service" && tokens[idx + 1].toLowerCase() === "items")
    )
  ) {
    idx += 2;
  }

  const rest = tokens.slice(idx);
  if (rest.length < 7) return null; // item name (>=1 token) + uom + 6 numbers

  const last6 = rest.slice(-6);
  if (!last6.every(t => NUMBER_RE.test(t))) return null;

  const uomToken = rest[rest.length - 7];
  if (!uomToken || !UOM_TOKENS.has(uomToken.toLowerCase())) return null;

  const itemName = rest.slice(0, rest.length - 7).join(" ").trim();
  if (!itemName) return null;

  const [qty, rate, total, tax, discount, saleAmount] = last6.map(Number);
  if (qty <= 0 || rate <= 0) return null;

  return { itemName, quantity: qty, rate, total, tax, discount, saleAmount };
};

/**
 * Convert extracted date to proper Date object
 */
export const convertToDate = (dateStr) => {
  if (!dateStr) return null;

  let parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    // Handle 2-digit year
    if (parts[2].length === 2) {
      const year = parseInt(parts[2]);
      parts[2] = year >= 24 ? `19${parts[2]}` : `20${parts[2]}`;
    }
    // Format: DD-MM-YYYY
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }

  return null;
};