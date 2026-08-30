// lib/utils/generateColumns.js
import Image from "next/image";
import { SearchOutlined } from "@ant-design/icons";
import '@ant-design/v5-patch-for-react-19';
import { Checkbox, Button, Space, Switch } from "antd";
import clientConfig from "@/config/Client";
/**
 * สร้าง columns แบบ dynamic (รองรับ group row และ status image)
 */
export function generateColumns(fields, hiddenCols = [], options = {}) {
  const { searchableColumns = [], handleToggleColumnSearch, onView, onEdit, onDelete, onStatusChange } = options;

  return fields
    .filter(f => !hiddenCols.includes(f.dataIndex))
    .map(f => {
      const column = {
        title: f.title,
        dataIndex: f.dataIndex,
        align: "center",
        sorter: (a, b) => {
          if (a.isGroup || b.isGroup) return 0;
          const valA = a[f.dataIndex];
          const valB = b[f.dataIndex];
          switch (f.type) {
            case "number":
              return Number(valA || 0) - Number(valB || 0);
            case "date":
            case "string":
            default:
              return String(valA || "").localeCompare(String(valB || ""));
          }
        },
        render: (_, row) => {
          if (row.isGroup) {
            if (f.columnsGroupPosition) {
              return (
                <div
                  style={{
                    paddingLeft: `${row.level * 20}px`,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  
                  {f.textIndex?.[row.groupValue] ? f.textIndex?.[row.groupValue] : row.groupField} : {f.textIndex?.[row.groupValue] ? f.textIndex?.[row.groupValue] : row.groupValue}{" "}
                  <span
                    style={{
                      color: "#666",
                      fontWeight: 400,
                      marginLeft: 8,
                    }}
                  >
                    ({row.groupCount} กลุ่ม • {row.itemCount} รายการ)
                  </span>
                </div>
              );
            }
            return null;
          } else {

              if (f.isStatus && f.isStatusText) {
                return (
                  <Space direction="vertical" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <Switch
                      checkedChildren={f.filters?.find(fl => fl.value === 1)?.text || "เปิด"}
                      unCheckedChildren={f.filters?.find(fl => fl.value === 0)?.text || "ปิด"}
                      checked={row[f.dataIndex] === 1}
                      onChange={(checked) => {
                        onStatusChange && onStatusChange(row[f.key], checked ? 1 : 0, f?.typeChange || null);
                      }}
                    />
                  </Space>
                );
              }

              if (f.isStatus && !f.isStatusText) {
                return (
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Image
                        src={`${clientConfig.base_path}/images/status_${row[f.dataIndex]}.png`}
                        alt={row.status}
                        width={18}
                        height={18}
                        unoptimized
                      />
                      {row.status}
                    </span>
                  </div>
                );
              }

              if (f.isStatusText && Array.isArray(f.filters)) {
                const rowValue = row[f.dataIndex];

                // แปลง 0/1 เป็น boolean ถ้า filter ใช้ boolean
                const normalizedValue =
                  typeof rowValue === "number" && typeof f.filters[0].value === "boolean"
                    ? Boolean(rowValue)
                    : rowValue;

                const filter = f.filters.find(fl => fl.value === normalizedValue);
                return filter ? filter.text : row[f.dataIndex];
              }

              if (f.isManage) {
                return (
                  <Space>
                    {f.isView && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => onView && onView(row[f.key])}
                      >
                        ดู
                      </Button>
                    )}
                    {f.isEdit && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => onEdit && onEdit(row[f.key])}
                      >
                        แก้ไข
                      </Button>
                    )}
                    {f.isDel && (
                      <Button
                        size="small"
                        danger
                        onClick={() => onDelete && onDelete(row[f.key])}
                      >
                        ลบ
                      </Button>
                    )}
                  </Space>
                );
              }

              return (
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {row[f.dataIndex]}
                </div>
              );
          }
        },
      };

      // ✅ ถ้ามี filters ให้ใช้ระบบ filter dropdown ของ AntD เอง
      if (f.filters && Array.isArray(f.filters) && f.filters.length) {
        column.filters = f.filters.map(s => ({ text: s.text, value: s.value }));
        column.onFilter = (value, record) =>
          String(record[f.dataIndex]) === String(value);
      }

      // ✅ ถ้าไม่มี filters แต่มี handleToggleColumnSearch ให้แสดง Checkbox
      else if (handleToggleColumnSearch) {
        column.filterDropdown = () => (
          <div style={{ padding: 8 }}>
            <Checkbox
              checked={searchableColumns.includes(f.dataIndex)}
              onChange={() => handleToggleColumnSearch(f.dataIndex)}
            >
              ใช้ในการค้นหา
            </Checkbox>
          </div>
        );

        column.filterIcon = () => (
          <SearchOutlined
            style={{
              fontSize: "18px",
              color: searchableColumns.includes(f.dataIndex)
                ? "#1677ff"
                : undefined,
            }}
          />
        );
      }

      return column;
    });
}
