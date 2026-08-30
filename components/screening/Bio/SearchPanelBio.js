// /components/screening/Person/SearchPanelBio.js "success Refactor Code"
'use client';
import { useState } from "react";
import SearchForm from '@/components/screening/Search/SearchForm';
import ModalListSearchPerson from '@/components/screening/Person/ModalListSearchPerson';
import { getsearchbio } from "@/services/screening/bio";
import { useAlert } from '@/lib/utils/useAlert';

export default function SearchPanelBio({onSelectedSearch}) {

    const { showAlert, AlertComponent } = useAlert()
    const [isLoading, setIsLoading] = useState(false)
    const [dataSearch, setDataSearch] = useState([])
    const [isOpenDialog, setIsOpenDialog] = useState(false)

    const onSearchCallback = async (data) => {

        try {

            setIsLoading(true)

            await showAlert({ title: 'กำลังค้นหาข้อมูล', icon: 'loading', type: 'loading', duration:500, loadingStyle: 'modal', allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false })
        
            const result = await getsearchbio(data)

            if (result.ok && result?.data && result?.data?.length > 0) {

                setDataSearch(result.data)
                setIsOpenDialog(true)
            }

        } catch (err) {

            await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' })

        } finally {

            setIsLoading(false)

        }
    }

    const onSelectedModalCallback = (item) => {

        onSelectedSearch(item)
        setIsOpenDialog(false)
        setDataSearch([])

    }

    return (
        <>
            <SearchForm onSearch={onSearchCallback} showFields={{idCard: false, passport: false}}  disabledSearch={isLoading} />
            <ModalListSearchPerson
                isOpen={isOpenDialog}
                onClose={() => setIsOpenDialog(false)}
                dataSearch={dataSearch}
                onSelectedModal={onSelectedModalCallback}
            />
            {AlertComponent}
        </>
    );
}
