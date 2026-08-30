from flask import Flask, jsonify
from flask_cors import CORS
from smartcard.System import readers
import smartcard.Exceptions
import logging
import time
import json # <--- นำเข้า json เพิ่มเพื่อพิมพ์ dict ให้ดูง่ายๆ

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)