import { useState, useEffect, useMemo, useDeferredValue } from "react";


// ===== groupData คืน nested structure พร้อม unique key =====
const groupData = (data, groupOrder, level = 0, parentKey = "") => {
  if (!groupOrder.length)
    return data.map((item, idx) => ({
      ...item,
      level,
      key: `${parentKey}row-${idx}`,
    }));

  const field = groupOrder[0];
  const groupMap = {};

  data.forEach((item) => {
    const key = item[field];
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(item);
  });

  return Object.entries(groupMap).map(([key, items], idx) => {
    const currentKey = `${parentKey}${field}-${level}-${idx}-`;
    const children = groupData(items, groupOrder.slice(1), level + 1, currentKey);
    const groupCount = children.filter((c) => c.isGroup).length;
    const itemCount = children.reduce(
      (sum, c) => (c.isGroup ? sum + (c.itemCount || 0) : sum + 1),
      0
    );

    return {
      key: currentKey.slice(0, -1),
      isGroup: true,
      level,
      groupField: field,
      groupValue: key,
      groupCount,
      itemCount,
      children,
    };
  });
};

export default function useTable({ data, fields = []}) {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hiddenCols, setHiddenCols] = useState([]);
    const [groupOrder, setGroupOrder] = useState([]);
    const [searchText, setSearchText] = useState("");
    const deferredSearchText = useDeferredValue(searchText);
    const [sortInfo, setSortInfo] = useState({ column: null, order: null }); // {column: 'date', order: 'ascend'}
    const [searchableColumns, setSearchableColumns] = useState([]);
    const [filteredStatus, setFilteredStatus] = useState({});

    useEffect(() => {
      setSearchableColumns(fields.filter(f => !hiddenCols.includes(f.dataIndex)).map(f => f.dataIndex));
     
    }, [fields, hiddenCols]);

    useEffect(() => {
      if (!data) return;

      setLoading(true);        // เริ่ม loading
      setRawData(data);        // อัปเดต rawData

      // ถ้าอยากให้ loading อยู่สักแป๊บจน data ถูก map/filter
      // สามารถใช้ setTimeout 0 เพื่อให้ React update ก่อนปิด loading
      setTimeout(() => setLoading(false), 1000);

    }, [data]);
 
    // Apply search filter (ก่อน group) โดยค้นหาเฉพาะ searchableColumns
    const filteredData = useMemo(() => {

      let data = rawData;

      // 🔹 filter จาก column filters (status, etc.)
      Object.entries(filteredStatus).forEach(([key, values]) => {
        if (values && values.length > 0) {
          data = data.filter(row => values.includes(Number(row[key])));
        }
      });

      // 🔹 filter จาก searchText (เฉพาะ searchableColumns)
      if (deferredSearchText && searchableColumns.length > 0) {
        const text = deferredSearchText.toLowerCase();
        data = data.filter(row =>
          searchableColumns.some(col =>
            row[col]?.toString().toLowerCase().includes(text)
          )
        );
      }

       return data;
     
    }, [rawData, filteredStatus, deferredSearchText, searchableColumns]);

    // Apply sort
    const sortedData = useMemo(() => {
        if (!sortInfo.column || !sortInfo.order) return filteredData;
        return [...filteredData].sort((a, b) => {
        const valA = a[sortInfo.column];
        const valB = b[sortInfo.column];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (typeof valA === "number" && typeof valB === "number") {
            return sortInfo.order === "ascend" ? valA - valB : valB - valA;
        }
        return sortInfo.order === "ascend"
            ? valA.toString().localeCompare(valB.toString())
            : valB.toString().localeCompare(valA.toString());
        });
    }, [filteredData, sortInfo]);

    // Apply grouping
    const tableData = useMemo(() => {
        if (!groupOrder.length) return sortedData.map((r) => ({ ...r, level: 0 }));
        return groupData(sortedData, groupOrder);
    }, [sortedData, groupOrder]);

    const handleGroupChange = (checkedValue) => {
        setGroupOrder((prev) => {
            const last = prev.filter((v) => checkedValue.includes(v)); 
            const added = checkedValue.filter((v) => !prev.includes(v));
            return [...last, ...added];
        });
    };

    // const handleTableChange = (_, __, sorter) => {
    //     if (Array.isArray(sorter)) sorter = sorter[0]; // AntD multi sort
    //     if (!sorter) return;
    //     setSortInfo({ column: sorter.field, order: sorter.order });
    // };

    const handleTableChange = (pagination, filters, sorter) => {
      // console.log(filters)
      setFilteredStatus(filters); // ✅ เก็บ filters ของทุก column
      if (Array.isArray(sorter)) sorter = sorter[0];
      if (sorter) setSortInfo({ column: sorter.field, order: sorter.order });
    };

    const handleToggleColumnSearch = (key) => {
      setSearchableColumns(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    };

    return {
        tableData,
        loading,
        hiddenCols,
        setHiddenCols,
        groupOrder,
        handleGroupChange,
        searchText,
        setSearchText,
        handleTableChange,
        handleToggleColumnSearch,
        searchableColumns,
        filteredStatus,
        fields,
    };
}
