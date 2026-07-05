import fs from "fs";

/**
 * Extract text from PDF file
 */
export const extractPDFText = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);

    let pdfParse;
    try {
      const module = await import('pdf-parse');
      pdfParse = module.default || module;
    } catch (e1) {
      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        pdfParse = require('pdf-parse');
      } catch (e2) {
        throw new Error('pdf-parse module not found. Please install: npm install pdf-parse');
      }
    }

    if (typeof pdfParse !== 'function') {
      throw new Error('pdf-parse is not a function');
    }

    let text = "";
    try {
      const result = await pdfParse(dataBuffer);
      text = result?.text || "";
    } catch (e) {
      const result = await pdfParse(dataBuffer, { version: 'v2' });
      text = result?.text || "";
    }

    try {
      fs.writeFileSync('./debug_extracted_pdf.txt', text);
    } catch (e) {
      // non-fatal - debug convenience only
    }

    return text;
  } catch (error) {
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
};

// Known unit-of-measure tokens that can appear at the very end of an
// "item name + UOM" chunk with NO separating space before the numbers that
// follow (e.g. "Chicken BiriyaniEach43180..."). Sorted longest-first so a
// more specific UOM is matched before a shorter one that could also
// technically match.
const UOM_LIST = [
  'container', 'conetop', 'bottle', 'packet', 'pieces', 'plate',
  'scoop', 'piece', 'glass', 'pack', 'each', 'bowl', 'pcs', 'tub',
  'nos', 'cup', 'can', 'box', 'ltr', 'kg', 'ml', 'g'
].sort((a, b) => b.length - a.length);

/**
 * Strip a known UOM token off the end of `str`, case-insensitively.
 * Returns { name, uom } - uom is null if nothing matched.
 */
const stripTrailingUom = (str) => {
  const lower = str.toLowerCase();
  for (const uom of UOM_LIST) {
    if (lower.endsWith(uom) && str.length > uom.length) {
      return { name: str.slice(0, str.length - uom.length).trim(), uom };
    }
  }
  return { name: str.trim(), uom: null };
};

/**
 * Split a run-together digit blob (e.g. "431807740007740") into
 * { qty, rate, total, tax, discount, saleAmount }.
 *
 * There's no separator between the six numbers, so `total = qty * rate`
 * (an exact mathematical constraint) is used to find where each number
 * starts and ends. Most rows in this export have zero tax and zero
 * discount, in which case saleAmount also equals total - so the blob has
 * the recognizable, unambiguous shape `${qty}${rate}${total}00${total}`.
 * That's checked first. A more general fallback (allowing non-zero
 * tax/discount, validated via saleAmount = total + tax - discount) is
 * tried if the primary pattern doesn't match any split.
 */
const decomposeDigitBlob = (blob) => {
  if (!/^\d+$/.test(blob)) return null;

  for (let qtyLen = 1; qtyLen <= 3; qtyLen++) {
    if (qtyLen >= blob.length) break;
    const qty = parseInt(blob.slice(0, qtyLen), 10);
    for (let rateLen = 1; rateLen <= 5; rateLen++) {
      const rateEnd = qtyLen + rateLen;
      if (rateEnd >= blob.length) break;
      const rate = parseInt(blob.slice(qtyLen, rateEnd), 10);
      const total = qty * rate;
      const totalStr = String(total);
      const expected = `${totalStr}00${totalStr}`;
      if (blob.slice(rateEnd) === expected) {
        return { qty, rate, total, tax: 0, discount: 0, saleAmount: total };
      }
    }
  }

  // Fallback: non-zero tax/discount, validated via saleAmount = total + tax - discount
  for (let qtyLen = 1; qtyLen <= 3; qtyLen++) {
    if (qtyLen >= blob.length) break;
    const qty = parseInt(blob.slice(0, qtyLen), 10);
    for (let rateLen = 1; rateLen <= 5; rateLen++) {
      const rateEnd = qtyLen + rateLen;
      if (rateEnd >= blob.length) break;
      const rate = parseInt(blob.slice(qtyLen, rateEnd), 10);
      const total = qty * rate;
      const totalStr = String(total);
      const totalEnd = rateEnd + totalStr.length;
      if (blob.slice(rateEnd, totalEnd) !== totalStr) continue;
      const tail = blob.slice(totalEnd);
      for (let taxLen = 1; taxLen <= tail.length - 2; taxLen++) {
        const tax = parseInt(tail.slice(0, taxLen), 10);
        for (let discountLen = 1; discountLen <= tail.length - taxLen - 1; discountLen++) {
          const discount = parseInt(tail.slice(taxLen, taxLen + discountLen), 10);
          const saleAmountStr = tail.slice(taxLen + discountLen);
          if (!saleAmountStr) continue;
          const saleAmount = parseInt(saleAmountStr, 10);
          if (saleAmount === total + tax - discount) {
            return { qty, rate, total, tax, discount, saleAmount };
          }
        }
      }
    }
  }

  return null;
};

/**
 * Parse a single item line. Handles two layouts seen in the wild:
 *  1. Cleanly space-separated columns
 *     (e.g. "08/05/26 Food Items Beef Omelette Each 1 100 100 0 0 100")
 *  2. Columns jammed together with no separating spaces at all - only the
 *     item name may contain internal spaces
 *     (e.g. "08/05/26Food ItemsChicken BiriyaniEach431807740007740")
 *     This is how this restaurant's "ItemWise Sales" PDF export actually
 *     renders (pdf-parse reflects the PDF's own text layout, which has no
 *     literal space characters between adjacent columns here).
 */
const parseItem = (line) => {
  const dateMatch = line.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  if (!dateMatch) return null;

  let rest = line.slice(dateMatch.index + dateMatch[0].length).trim();

  // Strip the item-type prefix, however it's spaced/cased.
  rest = rest.replace(/^\s*(Food\s*Items|Service\s*Items)\s*/i, "");
  if (!rest) return null;

  // --- Attempt 1: cleanly space-separated columns ---
  const tokens = rest.split(/\s+/);
  if (tokens.length >= 4) {
    let numStart = tokens.length;
    while (
      numStart > 0 &&
      (tokens.length - numStart) < 6 &&
      /^-?\d+(\.\d+)?$/.test(tokens[numStart - 1])
    ) {
      numStart--;
    }
    const numericTail = tokens.slice(numStart).map(Number);
    if (numericTail.length >= 3) {
      const nameAndUom = tokens.slice(0, numStart);
      if (nameAndUom.length > 0) {
        const itemName = (nameAndUom.length > 1 ? nameAndUom.slice(0, -1) : nameAndUom).join(" ").trim();
        if (itemName) {
          let qty, rate, total, tax = 0, discount = 0, saleAmount;
          switch (numericTail.length) {
            case 6: [qty, rate, total, tax, discount, saleAmount] = numericTail; break;
            case 5: [qty, rate, total, tax, saleAmount] = numericTail; break;
            case 4: [qty, rate, total, saleAmount] = numericTail; break;
            default: [qty, rate, total] = numericTail; saleAmount = total;
          }
          if (saleAmount === undefined) saleAmount = total;
          if (qty > 0 && rate > 0) {
            return { itemName, quantity: qty, rate, total, tax, discount, saleAmount };
          }
        }
      }
    }
  }

  // --- Attempt 2: run-together columns, no spaces at all ---
  const digitMatch = rest.match(/(\d+)$/);
  if (!digitMatch) return null;

  const digitBlob = digitMatch[1];
  const namePlusUom = rest.slice(0, rest.length - digitBlob.length);
  if (!namePlusUom) return null;

  const { name: itemName, uom } = stripTrailingUom(namePlusUom);
  if (!itemName || !uom) return null;

  const decomposed = decomposeDigitBlob(digitBlob);
  if (!decomposed) return null;

  const { qty, rate, total, tax, discount, saleAmount } = decomposed;
  if (qty <= 0 || rate <= 0) return null;

  return { itemName, quantity: qty, rate, total, tax, discount, saleAmount };
};

/**
 * Parse sales data from extracted text
 */
export const parseSalesText = (text, { debug = false } = {}) => {
  const cleanText = text.replace(/\r/g, "\n").replace(/\t/g, " ");
  const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  let salesDate = null;
  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/);
    if (dateMatch) {
      salesDate = dateMatch[1];
      break;
    }
  }

  const items = [];
  const skipped = [];
  const startsWithDate = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/;

  for (const line of lines) {
    const item = parseItem(line);
    if (item) {
      items.push(item);
    } else if (startsWithDate.test(line)) {
      // Looked like a data row (starts with a date) but still failed to
      // parse - worth surfacing so it's obvious something needs attention.
      skipped.push(line);
    }
    // Otherwise it's a header/title/category/footer line - ignore quietly.
  }

  if (items.length === 0 && skipped.length > 0) {
    console.warn(`[pdfParser] Parsed 0 items out of ${skipped.length} candidate line(s). First few unmatched lines:`);
    skipped.slice(0, 10).forEach(l => console.warn("  ->", l));
  } else if (debug || skipped.length > 0) {
    console.log(`[pdfParser] Parsed ${items.length} item(s) from ${lines.length} lines (${skipped.length} candidate line(s) failed to parse).`);
    if (skipped.length > 0) {
      skipped.slice(0, 10).forEach(l => console.warn("  UNPARSED ->", l));
    }
  }

  return { salesDate, items };
};

/**
 * Convert date string to Date object
 */
export const convertToDate = (dateStr) => {
  if (!dateStr) return null;

  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return null;

  let day = parseInt(parts[0]);
  let month = parseInt(parts[1]) - 1;
  let year = parseInt(parts[2]);

  if (year < 100) {
    year = year < 69 ? 2000 + year : 1900 + year;
  }

  return new Date(year, month, day);
};