/**
 * Google Apps Script for YPI Miftahul Hidayah Attendance System
 * 
 * CARA PENGGUNAAN:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu "Extensions" > "Apps Script".
 * 3. Hapus semua kode yang ada dan tempelkan kode ini.
 * 4. Klik ikon Simpan (Disket).
 * 5. Refresh halaman Spreadsheet Anda. Akan muncul menu baru "MifHida System".
 * 6. Klik menu "MifHida System" > "Setup Database & Dummy Data".
 * 7. Klik "Deploy" > "New Deployment".
 * 8. Pilih "Web App", Set "Execute as: Me", "Who has access: Anyone".
 * 9. Salin URL Web App dan masukkan ke Settings aplikasi (VITE_GAS_URL).
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('MifHida System')
    .addItem('Setup Database & Dummy Data', 'runSetup')
    .addToUi();
}

function runSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = setupDatabase(ss);
  SpreadsheetApp.getUi().alert(result.message || result.error);
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'setup') {
    return jsonResponse(setupDatabase(ss));
  }
  
  if (action === 'getSiswa') {
    const sheet = ss.getSheetByName('Siswa');
    if (!sheet) return jsonResponse({ error: 'Sheet Siswa tidak ditemukan. Silakan jalankan Setup.' });
    const data = getSheetData(sheet);
    return jsonResponse(data);
  }
  
  if (action === 'getAbsensi') {
    const sheet = ss.getSheetByName('Absensi');
    if (!sheet) return jsonResponse({ error: 'Sheet Absensi tidak ditemukan. Silakan jalankan Setup.' });
    const data = getSheetData(sheet);
    return jsonResponse(data);
  }

  return jsonResponse({ error: 'Action tidak valid' });
}

function setupDatabase(ss) {
  try {
    // 1. Setup Sheet Siswa
    let sheetSiswa = ss.getSheetByName('Siswa');
    if (!sheetSiswa) {
      sheetSiswa = ss.insertSheet('Siswa');
    } else {
      sheetSiswa.clear();
    }
    
    const headersSiswa = ['id', 'nama', 'kelas', 'jenjang', 'nisn', 'wa', 'tempat_lahir', 'tanggal_lahir', 'alamat', 'foto', 'createdAt'];
    sheetSiswa.appendRow(headersSiswa);
    
    // Data Dummy Siswa
    const dummySiswa = [
      ['MH-001', 'Ahmad Fauzi', 'VII-A', 'SMP', '0012345678', '628123456789', 'Jakarta', '2010-05-15', 'Jl. Merdeka No. 10', '', new Date().toISOString()],
      ['MH-002', 'Siti Aminah', 'X-IPA-1', 'SMA', '0023456789', '628123456789', 'Bandung', '2008-11-20', 'Jl. Melati No. 5', '', new Date().toISOString()],
      ['MH-003', 'Budi Santoso', 'IV-B', 'SD', '0034567890', '628123456789', 'Surabaya', '2013-02-10', 'Jl. Mawar No. 2', '', new Date().toISOString()],
      ['MH-004', 'Dewi Lestari', 'VIII-C', 'SMP', '0045678901', '628123456789', 'Yogyakarta', '2009-08-25', 'Jl. Anggrek No. 12', '', new Date().toISOString()],
      ['MH-005', 'Rizky Pratama', 'XII-IPS-2', 'SMA', '0056789012', '628123456789', 'Semarang', '2007-01-30', 'Jl. Dahlia No. 8', '', new Date().toISOString()]
    ];
    
    dummySiswa.forEach(row => sheetSiswa.appendRow(row));
    
    // 2. Setup Sheet Absensi
    let sheetAbsensi = ss.getSheetByName('Absensi');
    if (!sheetAbsensi) {
      sheetAbsensi = ss.insertSheet('Absensi');
    } else {
      sheetAbsensi.clear();
    }
    
    const headersAbsensi = ['idSiswa', 'tanggal', 'jam', 'status', 'keterangan'];
    sheetAbsensi.appendRow(headersAbsensi);
    
    // Data Dummy Absensi
    const today = new Date().toISOString().split('T')[0];
    sheetAbsensi.appendRow(['MH-001', today, '07:15:00', 'HADIR', 'Tepat waktu']);
    
    return { success: true, message: 'Berhasil! Sheet Siswa & Absensi telah dibuat dengan data dummy.' };
  } catch (err) {
    return { success: false, error: 'Gagal: ' + err.toString() };
  }
}

function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'addSiswa') {
    const sheet = ss.getSheetByName('Siswa');
    const newRow = [
      postData.data.id,
      postData.data.nama,
      postData.data.kelas,
      postData.data.jenjang,
      postData.data.nisn,
      postData.data.wa,
      postData.data.tempat_lahir,
      postData.data.tanggal_lahir,
      postData.data.alamat,
      postData.data.foto,
      new Date().toISOString()
    ];
    sheet.appendRow(newRow);
    return jsonResponse({ success: true });
  }

  if (action === 'submitAbsensi') {
    const sheet = ss.getSheetByName('Absensi');
    const newRow = [
      postData.data.idSiswa,
      postData.data.tanggal,
      postData.data.jam,
      postData.data.status,
      postData.data.keterangan
    ];
    sheet.appendRow(newRow);
    return jsonResponse({ success: true });
  }

  if (action === 'updateSiswa') {
    const sheet = ss.getSheetByName('Siswa');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === postData.data.id) {
        const row = i + 1;
        headers.forEach((header, j) => {
          if (postData.data[header] !== undefined) {
            sheet.getRange(row, j + 1).setValue(postData.data[header]);
          }
        });
        return jsonResponse({ success: true });
      }
    }
    return jsonResponse({ success: false, message: 'Siswa tidak ditemukan' });
  }

  if (action === 'deleteSiswa') {
    const sheet = ss.getSheetByName('Siswa');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === postData.data.id) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true });
      }
    }
    return jsonResponse({ success: false, message: 'Siswa tidak ditemukan' });
  }

  return jsonResponse({ error: 'Invalid action' });
}

function getSheetData(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
