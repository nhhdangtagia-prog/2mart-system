const XLSX = require('xlsx');
const crypto = require('crypto');

function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/[^a-zA-Z0-9]/g, "");
  return str.toLowerCase();
}

function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

async function run() {
  const file = "C:\\Users\\This PC\\Downloads\\DanhSachNhanVien_KV30072026-073019-850.xlsx";
  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // Make sure empty cells are "" instead of undefined
  
  const validEmployees = [];
  for (let i = 0; i < json.length; i++) {
    const p = json[i];
    // KiotViet export often uses these column headers
    const name = p["Tên nhân viên"] || p["TÊN NHÂN VIÊN"] || p["Tên NV"];
    if (!name) continue;
    
    const code = String(p["Mã NV"] || p["MÃ NV"] || p["Mã nhân viên"] || p["Mã hàng"] || `NV${Date.now() + i}`);
    const rawUser = String(name);
    const cleanUser = removeVietnameseTones(rawUser).replace(/\s+/g, '');
    
    const passwordHash = hashPassword(`${cleanUser}123`);
    
    const branchVal = String(p["Chi nhánh"] || p["CHI NHÁNH"] || p["Chi nhánh làm việc"] || "285 Nguyễn Lương Bằng");
    
    validEmployees.push({
      code,
      name: rawUser,
      username: cleanUser,
      passwordHash,
      role: String(p["Vai trò"] || p["VAI TRÒ / VỊ TRÍ"] || p["Chức vụ"] || "Nhân viên"),
      accessLevel: "staff",
      department: String(p["Phòng ban"] || p["Bộ phận"] || "Bán hàng"),
      branch: branchVal,
      status: String(p["Trạng thái"] || p["TRẠNG THÁI"] || "Đang làm việc"),
      email: "",
      phone: String(p["Liên hệ"] || p["LIÊN HỆ"] || p["Điện thoại"] || ""),
      joinDate: new Date().toISOString(),
    });
  }
  
  console.log(`Found ${validEmployees.length} employees to import.`);
  if (validEmployees.length > 0) {
      console.log(`Sample first employee:`, validEmployees[0]);
  }
  
  const res = await fetch('http://localhost:4000/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validEmployees)
  });
  
  if (res.ok) {
    console.log("Imported successfully!");
  } else {
    console.error("Failed:", await res.text());
  }
}

run();
