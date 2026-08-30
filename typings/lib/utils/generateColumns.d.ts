
/**
 * สร้าง columns แบบ dynamic (รองรับ group row และ status image)
 */
export function generateColumns(fields, hiddenCols = [], options = {}) {
  const { searchableColumns = [], handleToggleColumnSearch, onEdit, onDelete, onStatusChange } = options;

  return fields
    .filter(f => !hiddenCols.includes(f.dataIndex))
    .map(f => {
      declare interface columnType {}
