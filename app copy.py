from flask import Flask, jsonify
from flask_cors import CORS
from smartcard.System import readers
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(message)s")

# Commands
SELECT = [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
CMD_CID = [0x80, 0xb0, 0x00, 0x04, 0x02, 0x00, 0x0d]
CMD_PERSON_INFO = [0x80, 0xb0, 0x00, 0x11, 0x02, 0x00, 0xd1] # 209 bytes
CMD_ADDRESS = [0x80, 0xb0, 0x15, 0x79, 0x02, 0x00, 0xA0] # 160 bytes

def transmit_apdu(connection, apdu):
    data, sw1, sw2 = connection.transmit(apdu)
    if sw1 == 0x61:
        data, sw1, sw2 = connection.transmit([0x00, 0xC0, 0x00, 0x00, sw2])
    elif sw1 == 0x6C:
        apdu[-1] = sw2
        data, sw1, sw2 = connection.transmit(apdu)
    return data, sw1, sw2

def decode_thai(data_bytes):
    """แปลง bytes เป็น TIS-620"""
    try:
        return bytes(data_bytes).decode('tis-620').strip()
    except Exception as e:
        print(f"[ERROR Decoding]: {e}")
        return ""

def parse_name(name_raw):
    """แยก คำนำหน้า, ชื่อ, นามสกุล จากข้อมูลที่คั่นด้วย #"""
    parts = [p.strip() for p in name_raw.split('#') if p.strip()]
    
    prefix = parts[0] if len(parts) > 0 else ""
    firstname = parts[1] if len(parts) > 1 else ""
    lastname = parts[3] if len(parts) > 3 else (parts[2] if len(parts) > 2 else "")
    
    return prefix, firstname, lastname

def get_thai_id_full():
    try:
        reader_list = readers()
        if not reader_list: return None, "ไม่พบเครื่องอ่านบัตร"

        reader = reader_list[0]
        connection = reader.createConnection()
        connection.connect()
        transmit_apdu(connection, SELECT)

        print("\n" + "="*50)
        print("💡 เริ่มอ่านข้อมูลจากบัตร...")
        
        # 1. อ่าน CID
        data_cid, _, _ = transmit_apdu(connection, CMD_CID)
        cid = decode_thai(data_cid)
        print(f"[1] CID (13 หลัก): '{cid}'")

        # 2. อ่านข้อมูลส่วนตัว (209 bytes)
        data_info, _, _ = transmit_apdu(connection, CMD_PERSON_INFO)
        print(f"[2] ข้อมูลส่วนตัว (จำนวนไบต์ที่ดึงได้): {len(data_info)} bytes")
        
        if len(data_info) < 209:
            return None, "อ่านข้อมูลส่วนตัวจากบัตรได้ไม่ครบ (อาจเสียบบัตรไม่แน่น)"

        # --- ลอง Decode ทั้งก้อนเพื่อให้เห็นหน้าตาจริงๆ ก่อนตัดคำ ---
        full_info_raw = decode_thai(data_info)
        print(f"[3] ข้อมูลดิบก่อนตัดคำ (209 bytes): '{full_info_raw}'")

        # --- ตัดข้อมูลตาม Offset มาตรฐาน ---
        thai_name_raw = decode_thai(data_info[0:100])
        eng_name_raw = decode_thai(data_info[100:200])
        birthday_raw = decode_thai(data_info[200:208])
        gender_raw = decode_thai(data_info[208:209])

        print("-" * 30)
        print(f"[4.1] ตัดคำ (ไทย 0-100): '{thai_name_raw}'")
        print(f"[4.2] ตัดคำ (อังกฤษ 100-200): '{eng_name_raw}'")
        print(f"[4.3] ตัดคำ (วันเกิด 200-208): '{birthday_raw}'")
        print(f"[4.4] ตัดคำ (เพศ 208-209): '{gender_raw}'")

        # --- จัดการแยกคำนำหน้า ชื่อ นามสกุล ---
        prefix_th, firstname_th, lastname_th = parse_name(thai_name_raw)
        prefix_en, firstname_en, lastname_en = parse_name(eng_name_raw)

        print("-" * 30)
        print(f"[5.1] แยกชื่อไทย: คำนำหน้า='{prefix_th}', ชื่อ='{firstname_th}', นามสกุล='{lastname_th}'")
        print(f"[5.2] แยกชื่ออังกฤษ: คำนำหน้า='{prefix_en}', ชื่อ='{firstname_en}', นามสกุล='{lastname_en}'")

        # 3. อ่านที่อยู่
        data_addr, _, _ = transmit_apdu(connection, CMD_ADDRESS)
        address_raw = decode_thai(data_addr)
        
        # ตัดคำด้วยเครื่องหมาย # จะได้ array เป๊ะๆ ตามโครงสร้างบัตร
        addr_parts = [p.strip() for p in address_raw.split('#')]
        
        # เติมช่องว่างให้ครบ 8 เผื่อข้อมูลบางคนมาไม่ครบ
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

        print(f"[6] ที่อยู่ : '{address_dict}'")
        print("="*50 + "\n")

        # --- แปลงวันเกิด ---
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
        
        print(f"[7] วันเกิดที่แปลงแล้ว (ค.ศ.): '{birthday}'")
        print("="*50 + "\n")

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

        return result, None

    except Exception as e:
        print(f"\n[CRITICAL ERROR]: {str(e)}\n")
        return None, str(e)

@app.route('/read-id')
def read_id():
    data, error = get_thai_id_full()
    if error: return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "data": data})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)