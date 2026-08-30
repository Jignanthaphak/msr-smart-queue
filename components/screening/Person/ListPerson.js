// /components/screening/Person/ListPerson.js "success Refactor Code"
'use client';
import React, { useState, useMemo, useEffect } from "react";
import { MaterialReactTable } from "material-react-table";

export default function ListPerson({
  dataPerson = [],
  onSelectedPerson,
  clearSelected=false,
  tableOptions = {},
}) {

  const {
    density = 'compact',
    enableColumnActions = false,
    enableColumnFilters = false,
    enableHiding = false,
    enableFullscreen = false,
    maxHeight = '100%',
  } = tableOptions

  const [selectedRowId, setSelectedRowId] = useState(null)

  useEffect(() => {

    if (clearSelected) setSelectedRowId(null)

  }, [clearSelected])

  const handleRowClick = (row) => {

    const rowId = row?.original?.rowId
    const selectedRow = tableData.find((r) => r?.rowId === rowId)
    if (Object.keys(selectedRow).length > 0) {
      setSelectedRowId(rowId)
      onSelectedPerson(selectedRow)
    }

  }

  const columns = useMemo(() => [

    { accessorKey: 'hn', header: 'HN' },
    {
      header: 'ชื่อ-นามสกุล (ไทย)',
      accessorFn: (row) => `${row.firstname || ''} ${row.lastname || '-'}`,
    },
    {
      header: 'ชื่อ-นามสกุล (Eng)',
      accessorFn: (row) => `${row.firstname_en || ''} ${row.lastname_en || '-'}`,
    },
    {
      header: 'เลขบัตรประจำตัวประชาชน',
      accessorFn: (row) => `${row.idcard || '-'}`,
    },

  ], [])

  const tableData = useMemo(

    () => dataPerson.map((item) => ({ ...item, rowId: item.hn })),
    [dataPerson]
    
  )

  return (
    <MaterialReactTable
      columns={columns}
      data={tableData}
      getRowId={(row) => row.id}
      enableRowSelection={false}
      enableDensityToggle={false}
      enableColumnActions={enableColumnActions}
      enableColumnFilters={enableColumnFilters}
      enableHiding={enableHiding}
      enableFullScreenToggle={enableFullscreen}
      initialState={{ density }}
      muiTableContainerProps={{
        sx: {
          maxHeight: maxHeight,
          overflow: 'auto',
        },
      }}
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => handleRowClick(row),
        sx: {
          cursor: 'pointer',
          userSelect: 'none',
          bgcolor: row.original.rowId === selectedRowId ? '#eafaf4' : 'inherit',
          textAlign: 'center',
        },
      })}
      muiTableHeadProps={{
        sx: {
          position: 'sticky',
          top: -1,
          zIndex: 2,
          backgroundColor: 'white',
        },
      }}
      muiTableHeadCellProps={{
        sx: {
            whiteSpace: 'nowrap',
            minWidth: 0,
            '& .Mui-TableHeadCell-Content': {
                width: '100% !important',
                display: 'flex !important',
                justifyContent: 'center !important',
                alignItems: 'center !important',
                whiteSpace: 'nowrap !important',
            },
            '& .Mui-TableHeadCell-Content-Wrapper': {
                whiteSpace: 'nowrap !important',
            }
           
        },
      }}
      muiTableBodyCellProps={{
        sx: {
          whiteSpace: 'nowrap',
          textAlign: 'center',
          verticalAlign: 'middle',
        },
      }}
    />
  );
}
