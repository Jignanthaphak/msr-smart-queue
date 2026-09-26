from flask import Flask, jsonify, request
from flask_cors import CORS
from smartcard.System import readers
import smartcard.Exceptions
import logging
import time
import json # <--- นำเข้า json เพิ่มเพื่อพิมพ์ dict ให้ดูง่ายๆ
import os
import glob
import re

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(message)s")

# Commands
SELECT = [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
CMD_CID = [0x80, 0xb0, 0x00, 0x04, 0x02, 0x00, 0x0d]
CMD_PERSON_INFO = [0x80, 0xb0, 0x00, 0x11, 0x02, 0x00, 0xd1] 
CMD_ADDRESS = [0x80, 0xb0, 0x15, 0x79, 0x02, 0x00, 0xA0]

def transmit_apdu(connection, apdu):
    data, sw1, sw2 = connection.transmit(apdu)
    if sw1 == 0x61:
        data, sw1, sw2 = connection.transmit([0x00, 0xC0, 0x00, 0x00, sw2])
    elif sw1 == 0x6C:
        apdu[-1] = sw2
        data, sw1, sw2 = connection.transmit(apdu)
    return data, sw1, sw2

def decode_thai(data_bytes):
    try:
        return bytes(data_bytes).decode('tis-620').strip()
    except Exception as e:
        print(f"[ERROR Decoding]: {e}")
        return ""

def parse_name(name_raw):
    parts = [p.strip() for p in name_raw.split('#') if p.strip()]
    prefix = parts[0] if len(parts) > 0 else ""
    firstname = parts[1] if len(parts) > 1 else ""
    lastname = parts[3] if len(parts) > 3 else (parts[2] if len(parts) > 2 else "")
    return prefix, firstname, lastname

def get_thai_id_full():
    try:
        reader_list = readers()
        if not reader_list: 
            return None, "ไม่พบเครื่องอ่านบัตร กรุณาเชื่อมต่ออุปกรณ์"

        reader = reader_list[0]
        connection = reader.createConnection()
        
        print("\n" + "="*60)
        print("💡 กรุณาเสียบบัตรประชาชน... (รอตรวจจับบัตร 15 วินาที)")
        
        timeout = 15
        start_time = time.time()
        is_connected = False
        
        while time.time() - start_time < timeout:
            try:
                connection.connect()
                is_connected = True
                break 
            except smartcard.Exceptions.CardConnectionException:
                time.sleep(1)
            except Exception as e:
                time.sleep(1)
                
        if not is_connected:
            print("❌ หมดเวลารออ่านบัตร (Timeout)")
            return None, "หมดเวลารออ่านบัตร กรุณาเสียบบัตรให้แน่นแล้วกดใหม่อีกครั้ง"

        transmit_apdu(connection, SELECT)
        print("✅ ตรวจพบบัตรแล้ว! เริ่มดึงข้อมูล...")
        
        # -------------------------------------------------------------------
        # 1. อ่าน CID
        # -------------------------------------------------------------------
        data_cid, _, _ = transmit_apdu(connection, CMD_CID)
        cid = decode_thai(data_cid)
        print("\n[1] --- ข้อมูลรหัสบัตรประชาชน (CID) ---")
        print(f"    > Raw Bytes (Length: {len(data_cid)}): {data_cid}")
        print(f"    > Decoded CID: '{cid}'")

        # -------------------------------------------------------------------
        # 2. อ่านข้อมูลส่วนตัว
        # -------------------------------------------------------------------
        data_info, _, _ = transmit_apdu(connection, CMD_PERSON_INFO)
        print(f"\n[2] --- ข้อมูลส่วนตัว (Person Info) ---")
        print(f"    > Raw Bytes Length: {len(data_info)} bytes")
        
        if len(data_info) < 209:
            return None, "อ่านข้อมูลส่วนตัวจากบัตรได้ไม่ครบ (อาจเสียบบัตรไม่แน่น)"

        # แกะทั้งก้อนก่อนตัด
        full_info_raw = decode_thai(data_info)
        print(f"    > ข้อมูลดิบก่อนตัดคำทั้งหมด (209 bytes):")
        print(f"      '{full_info_raw}'")

        # ตัดข้อมูล (Slicing)
        thai_name_raw = decode_thai(data_info[0:100])
        eng_name_raw = decode_thai(data_info[100:200])
        birthday_raw = decode_thai(data_info[200:208])
        gender_raw = decode_thai(data_info[208:209])

        print("\n[3] --- ข้อมูลหลังแยกส่วน (Slicing by Offset) ---")
        print(f"    > [0:100]   ชื่อไทยดิบ : '{thai_name_raw}'")
        print(f"    > [100:200] ชื่ออังกฤษดิบ: '{eng_name_raw}'")
        print(f"    > [200:208] วันเกิดดิบ  : '{birthday_raw}'")
        print(f"    > [208:209] เพศดิบ     : '{gender_raw}'")

        # ถอดแยกชื่อ-นามสกุล
        prefix_th, firstname_th, lastname_th = parse_name(thai_name_raw)
        prefix_en, firstname_en, lastname_en = parse_name(eng_name_raw)

        print("\n[4] --- ข้อมูลหลังแยกคำนำหน้าและชื่อ (Parsing Name) ---")
        print(f"    > ภาษาไทย: คำนำหน้า='{prefix_th}', ชื่อ='{firstname_th}', นามสกุล='{lastname_th}'")
        print(f"    > ภาษาอังกฤษ: คำนำหน้า='{prefix_en}', ชื่อ='{firstname_en}', นามสกุล='{lastname_en}'")

        # -------------------------------------------------------------------
        # 3. อ่านที่อยู่
        # -------------------------------------------------------------------
        data_addr, _, _ = transmit_apdu(connection, CMD_ADDRESS)
        address_raw = decode_thai(data_addr)
        
        print("\n[5] --- ข้อมูลที่อยู่ (Address Info) ---")
        print(f"    > Raw Bytes Length: {len(data_addr)} bytes")
        print(f"    > ที่อยู่ดิบก่อนตัดคำ: '{address_raw}'")
        
        addr_parts = [p.strip() for p in address_raw.split('#')]
        print(f"    > ที่อยู่ถูก Split ด้วย #: {addr_parts}")
        
        while len(addr_parts) < 8:
            addr_parts.append("")

        address_dict = {
            "houseno": addr_parts[0],
            "moo": addr_parts[1].replace('หมู่ที่', '').replace('ม.', '').strip(),
            "trok": addr_parts[2],
            "soi": addr_parts[3],
            "road": addr_parts[4].replace('ถนน', '').replace('ถ.', '').strip(),
            "subdistrict": addr_parts[5].replace('ตำบล', '').replace('แขวง', '').strip(),
            "district": addr_parts[6].replace('อำเภอ', '').replace('เขต', '').strip(),
            "province": addr_parts[7].replace('จังหวัด', '').strip()
        }

        print(f"    > ที่อยู่ที่ถูก Map ใส่ตัวแปรแล้ว: {address_dict}")

        # -------------------------------------------------------------------
        # 4. แปลงวันเกิด
        # -------------------------------------------------------------------
        birthday = birthday_raw
        if len(birthday_raw) == 8:
            year_th = int(birthday_raw[:4])
            if year_th > 0:
                year_en = str(year_th - 543)
                month = birthday_raw[4:6]
                day = birthday_raw[6:8]
                month = month if month != '00' else '01'
                day = day if day != '00' else '01'
                birthday = f"{year_en}-{month}-{day}"
        
        print("\n[6] --- การแปลงวันเกิด ---")
        print(f"    > ก่อนแปลง: '{birthday_raw}' --> หลังแปลง (ค.ศ.): '{birthday}'")

        # -------------------------------------------------------------------
        # 5. สรุปผลลัพธ์ที่จะ Return
        # -------------------------------------------------------------------
        result = {
            "citizenId": cid,
            "prefixTH": prefix_th,
            "firstNameTH": firstname_th,
            "lastNameTH": lastname_th,
            "prefixEN": prefix_en,
            "firstNameEN": firstname_en,
            "lastNameEN": lastname_en,
            "birthday": birthday,
            "gender": gender_raw,
            "addressObj": address_dict
        }

        print("\n[7] 🚀 --- ข้อมูล JSON ที่ถูก Return กลับไปให้ Next.js ---")
        print(json.dumps(result, ensure_ascii=False, indent=4))
        print("="*60 + "\n")

        return result, None

    except Exception as e:
        print(f"\n[CRITICAL ERROR]: {str(e)}\n")
        return None, "เกิดข้อผิดพลาดในการอ่านบัตร กรุณาถอดบัตรแล้วเสียบใหม่"

@app.route('/read-id')
def read_id():
    data, error = get_thai_id_full()
    if error: return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "data": data})

# -------------------------------------------------------------------
# SA-3000P Biofeedback Reader
# -------------------------------------------------------------------
BIO_CANDIDATE_PATHS = [
    os.environ.get("SA_BIO_DATA_DIR", ""),
    r"D:\OneDrive\แฟรชไดรฟ\SAViewer_New THAI\EXCELDATA",
    r"D:\OneDrive\แฟรชไดรฟ\SA THAI\EXCELDATA",
    r"\\SA3000P\EXCELDATA",
    r"\\SA3000P\SA THAI\EXCELDATA",
    r"C:\SA\EXCELDATA",
    r"C:\SA THAI\EXCELDATA",
    r"C:\SAViewer_New THAI\EXCELDATA",
]

def find_bio_folder(custom_folder=None):
    if custom_folder and os.path.isdir(custom_folder):
        return custom_folder
    for p in BIO_CANDIDATE_PATHS:
        if p and os.path.isdir(p):
            return p
    return None

def parse_sa_tsv(file_path):
    if not os.path.exists(file_path):
        return []
    
    content = None
    for enc in ['utf-16le', 'utf-8-sig', 'utf-8', 'cp874', 'tis-620', 'latin1']:
        try:
            with open(file_path, 'r', encoding=enc, errors='strict') as f:
                content = f.read()
                if content and ('\t' in content or 'ChartNo' in content or 'ChartID' in content):
                    break
        except Exception:
            continue
    
    if content is None:
        try:
            with open(file_path, 'r', encoding='utf-16le', errors='ignore') as f:
                content = f.read()
        except Exception:
            return []

    lines = [line.strip().split('\t') for line in content.splitlines() if line.strip()]
    if not lines:
        return []
    
    headers = [h.strip().lstrip('\ufeff') for h in lines[0]]
    rows = []
    for line in lines[1:]:
        row_dict = {}
        for idx, val in enumerate(line):
            col_name = headers[idx] if idx < len(headers) else f"col_{idx}"
            row_dict[col_name] = val.strip()
        rows.append(row_dict)
    return rows

def to_clean_int(val, default_val=100, min_val=0, max_val=150):
    if val is None or str(val).strip() == "":
        return default_val
    try:
        m = re.search(r'[-+]?\d*\.?\d+', str(val))
        if m:
            num = float(m.group(0))
            rounded = int(round(num))
            return max(min_val, min(max_val, rounded))
    except Exception:
        pass
    return default_val

def extract_bio_data(hn=None, name=None, custom_folder=None):
    folder = find_bio_folder(custom_folder)
    if not folder:
        return None, "ไม่พบโฟลเดอร์ผลตรวจ SA-3000P ในเครือข่ายหรือในเครื่อง"

    apg_path = os.path.join(folder, "APGResult.xls")
    hrv_path = os.path.join(folder, "HRVResult.xls")

    apg_rows = parse_sa_tsv(apg_path)
    hrv_rows = parse_sa_tsv(hrv_path)

    if not apg_rows and not hrv_rows:
        return None, f"ไม่พบไฟล์ผลตรวจ (APGResult.xls / HRVResult.xls) ใน {folder}"

    target_apg = None
    target_hrv = None
    matched_by = "latest"

    clean_hn = str(hn).strip() if hn else ""
    clean_name = str(name).strip().lower() if name else ""

    if clean_hn:
        for r in reversed(apg_rows):
            c_no = str(r.get("ChartNo", "") or r.get("ChartID", "")).strip()
            if c_no == clean_hn:
                target_apg = r
                matched_by = "hn"
                break
        for r in reversed(hrv_rows):
            c_no = str(r.get("ChartNo", "") or r.get("ChartID", "")).strip()
            if c_no == clean_hn:
                target_hrv = r
                matched_by = "hn"
                break

    if not target_apg and not target_hrv and clean_name:
        for r in reversed(apg_rows):
            r_name = str(r.get("ชื่อ", "") or r.get("Name", "")).strip().lower()
            if clean_name in r_name or r_name in clean_name:
                target_apg = r
                matched_by = "name"
                break
        for r in reversed(hrv_rows):
            r_name = str(r.get("Name", "") or r.get("ชื่อ", "")).strip().lower()
            if clean_name in r_name or r_name in clean_name:
                target_hrv = r
                matched_by = "name"
                break

    if not target_apg and apg_rows:
        target_apg = apg_rows[-1]
    if not target_hrv and hrv_rows:
        target_hrv = hrv_rows[-1]

    chart_no = ""
    patient_name = ""
    exam_date = ""

    if target_apg:
        chart_no = target_apg.get("ChartNo", "") or target_apg.get("ChartID", "")
        patient_name = target_apg.get("ชื่อ", "") or target_apg.get("Name", "")
        exam_date = target_apg.get("Exam.Date", "") or target_apg.get("Exam. Date", "")
    elif target_hrv:
        chart_no = target_hrv.get("ChartNo", "") or target_hrv.get("ChartID", "")
        patient_name = target_hrv.get("Name", "") or target_hrv.get("ชื่อ", "")
        exam_date = target_hrv.get("Exam.Date", "") or target_hrv.get("Exam. Date", "")

    # Wave Level (1 - 7 ปิดแกปทศนิยมด้วยการปัดเศษ)
    wave_level = 2
    if target_apg and target_apg.get("Wave Type"):
        wave_level = to_clean_int(target_apg.get("Wave Type"), default_val=2, min_val=1, max_val=7)

    # Mean Heart Rate (ปิดแกปทศนิยมด้วยการปัดเศษ)
    hr_str = ""
    if target_apg and target_apg.get("HR"):
        hr_str = target_apg.get("HR")
    elif target_hrv and (target_hrv.get("HR") or target_hrv.get("MEANHRT-SUPINE")):
        hr_str = target_hrv.get("HR") or target_hrv.get("MEANHRT-SUPINE")
    mean_heart_rate = to_clean_int(hr_str, default_val=75, min_val=0, max_val=150)

    # HRV parameters (แปลงและปัดเศษทศนิยมเป็นจำนวนเต็มตามมาตรฐานระบบ MSR)
    ans_activity = 100
    ans_balance = 40
    stress_resistance = 100
    stress_index = 85
    fatigue_index = 80
    electro_cardiac_stability = 95
    ectopic_beat = 0

    if target_hrv:
        psi_val = target_hrv.get("PSI") or target_hrv.get("PSI-SUPINE")
        if psi_val:
            stress_index = to_clean_int(psi_val, default_val=85, min_val=50, max_val=150)
        
        sdnn_val = target_hrv.get("SDNN") or target_hrv.get("SDNN-SUPINE")
        if sdnn_val:
            try:
                sdnn_num = float(sdnn_val)
                ans_activity = to_clean_int(100 + (sdnn_num - 45) * 1.0, default_val=100, min_val=50, max_val=150)
                stress_resistance = to_clean_int(100 + (sdnn_num - 45) * 0.8, default_val=100, min_val=50, max_val=150)
            except Exception:
                pass

        lf_norm = target_hrv.get("LFNorm") or target_hrv.get("LFNORM-SUPINE")
        if lf_norm:
            try:
                lf_val = float(lf_norm)
                ans_balance = to_clean_int(abs(lf_val - 50) * 1.5, default_val=40, min_val=0, max_val=150)
            except Exception:
                pass

        ec_val = target_hrv.get("Ectopic Beat") or target_hrv.get("ARTIFACT-SUPINE") or target_hrv.get("Ectopic Beat(Supine)")
        if ec_val:
            ectopic_beat = to_clean_int(ec_val, default_val=0, min_val=0, max_val=999)

        # Check if direct score columns exist from new SA-3000P models
        if target_hrv.get("ANS Activity"):
            ans_activity = to_clean_int(target_hrv.get("ANS Activity"), default_val=ans_activity, min_val=50, max_val=150)
        if target_hrv.get("ANS Balance"):
            ans_balance = to_clean_int(target_hrv.get("ANS Balance"), default_val=ans_balance, min_val=0, max_val=150)
        if target_hrv.get("Stress Resistance"):
            stress_resistance = to_clean_int(target_hrv.get("Stress Resistance"), default_val=stress_resistance, min_val=50, max_val=150)
        if target_hrv.get("Fatigue Index"):
            fatigue_index = to_clean_int(target_hrv.get("Fatigue Index"), default_val=fatigue_index, min_val=50, max_val=150)
        if target_hrv.get("Stability") or target_hrv.get("Electro-Cardiac Stability"):
            electro_cardiac_stability = to_clean_int(target_hrv.get("Stability") or target_hrv.get("Electro-Cardiac Stability"), default_val=95, min_val=50, max_val=150)

    result = {
        "chart_no": chart_no,
        "patient_name": patient_name,
        "exam_date": exam_date,
        "matched_by": matched_by,
        "folder_path": folder,
        "ans_activity": ans_activity,
        "ans_balance": ans_balance,
        "stress_resistance": stress_resistance,
        "stress_index": stress_index,
        "fatigue_index": fatigue_index,
        "mean_heart_rate": mean_heart_rate,
        "electro_cardiac_stability": electro_cardiac_stability,
        "ectopic_beat": ectopic_beat,
        "wave_level": wave_level,
    }

    return result, None

@app.route('/read-bio')
def read_bio():
    hn = request.args.get('hn', '').strip()
    name = request.args.get('name', '').strip()
    folder = request.args.get('folder', '').strip()
    
    data, error = extract_bio_data(hn=hn, name=name, custom_folder=folder)
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "data": data})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)