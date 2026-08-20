import xlsx from 'xlsx';
import fs from 'fs';

try {
  const filePath = "C:\\Users\\This PC\\Downloads\\DanhSachSanPham_KV25072026-061238-965 (1).xlsx";
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Start from row 2 maybe? KiotViet usually has titles in row 1 or 2. We can just use sheet_to_json
  const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  
  console.log("Total rows:", rawData.length);
  if (rawData.length > 0) {
    console.log("Sample columns:", Object.keys(rawData[0]));
    console.log("Sample row:", rawData[0]);
  }

  // Write out the raw JSON so we can inspect it and map it later
  if (!fs.existsSync("src/data")) {
    fs.mkdirSync("src/data");
  }
  fs.writeFileSync("src/data/raw_products.json", JSON.stringify(rawData, null, 2));
  console.log("Successfully wrote raw_products.json");

} catch (e) {
  console.error("Error reading file:", e);
}
