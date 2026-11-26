/**
 * 3-Stride website form receiver.
 * Paste into a Google Sheet: Extensions > Apps Script. Replace everything there with this.
 * Each request becomes a row in the "Requests" tab. Uploaded files go into a
 * "3-Stride Website Uploads" folder in your Drive, one subfolder per request.
 */
const NOTIFY_EMAIL = 'hello@3-stride.com';
const SHEET_NAME = 'Requests';
const FOLDER_NAME = '3-Stride Website Uploads';
const MAX_FILES = 10;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d.email || !d.name) return out_({ ok: false, error: 'missing name or email' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Received', 'Name', 'Company', 'Email', 'Phone', 'I am a', 'Request', 'Files']);
      sh.setFrozenRows(1);
    }

    let folderUrl = '';
    const files = (d.files || []).slice(0, MAX_FILES);
    if (files.length) {
      const stamp = Utilities.formatDate(new Date(), 'America/Toronto', 'yyyy-MM-dd HHmm');
      const sub = uploadsFolder_().createFolder(stamp + ' ' + clean_(d.company || d.name));
      files.forEach(function (f) {
        const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type || 'application/octet-stream', f.name);
        sub.createFile(blob);
      });
      folderUrl = sub.getUrl();
    }

    sh.appendRow([new Date(), d.name, d.company, d.email, d.phone, d.role, d.message, folderUrl].map(safe_));

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: d.email,
      subject: 'New 3-Stride request: ' + (d.company || d.name),
      body: 'Name: ' + d.name + '\nCompany: ' + d.company + '\nEmail: ' + d.email +
            '\nPhone: ' + d.phone + '\nI am a: ' + d.role + '\n\n' + d.message +
            (folderUrl ? '\n\nFiles: ' + folderUrl : '') + '\n\nSheet: ' + ss.getUrl()
    });

    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function uploadsFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

// Stops form text starting with = + - @ from running as a spreadsheet formula.
function safe_(v) {
  v = v == null ? '' : v;
  return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
}

function clean_(s) {
  return String(s || 'request').replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor to grant permissions before deploying.
function authorize() {
  uploadsFolder_();
  SpreadsheetApp.getActiveSpreadsheet();
  MailApp.getRemainingDailyQuota();
}
